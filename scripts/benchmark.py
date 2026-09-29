import asyncio
import aiohttp
import requests
import time
import os
import json
import uuid
import matplotlib.pyplot as plt

API_BASE = "http://localhost:8080/api"
RABBITMQ_MGT = "http://localhost:15672/api/queues/%2f/document_processing"
RABBITMQ_AUTH = ("guest", "guest")
NUM_DOCS = 500
CONCURRENCY_LEVELS = [10, 50, 100, 250]
TEST_DIR = "benchmark_docs"

# We will store results here
results = []

def generate_docs():
    print(f"Generating {NUM_DOCS} test documents...")
    if not os.path.exists(TEST_DIR):
        os.makedirs(TEST_DIR)
    for i in range(NUM_DOCS):
        filepath = os.path.join(TEST_DIR, f"doc_{i}.txt")
        # Generate some varying sizes
        size_multiplier = (i % 10) + 1
        content = f"This is test document {i}. " * 100 * size_multiplier
        with open(filepath, "w") as f:
            f.write(content)

def get_token():
    email = f"benchmark_{uuid.uuid4().hex[:8]}@test.com"
    payload = {
        "email": email,
        "password": "password123",
        "fullName": "Benchmark User"
    }
    print(f"Registering benchmark user: {email}")
    res = requests.post(f"{API_BASE}/auth/register", json=payload)
    if res.status_code == 200:
        return res.json()["token"]
    
    # If it fails, maybe user exists? Try login
    res = requests.post(f"{API_BASE}/auth/login", json=payload)
    if res.status_code == 200:
        return res.json()["token"]
    
    raise Exception(f"Failed to get token: {res.status_code} {res.text}")

async def poll_rabbitmq(stop_event, queue_depths):
    while not stop_event.is_set():
        try:
            res = requests.get(RABBITMQ_MGT, auth=RABBITMQ_AUTH, timeout=2)
            if res.status_code == 200:
                data = res.json()
                queue_depths.append(data.get("messages", 0))
        except Exception:
            pass
        await asyncio.sleep(1)

async def upload_document(session, sem, token, filepath, stats):
    async with sem:
        url = f"{API_BASE}/documents/upload"
        headers = {"Authorization": f"Bearer {token}"}
        
        start_time = time.time()
        
        try:
            with open(filepath, "rb") as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=os.path.basename(filepath), content_type='text/plain')
                async with session.post(url, headers=headers, data=data) as resp:
                    resp_data = await resp.json()
                    status = resp_data.get("status")
                    doc_id = resp_data.get("id")
                    
                    if status in ["INDEXED", "FAILED"]:
                        stats["fallback_count"] += 1
                        
                    stats["uploaded_docs"][doc_id] = {
                        "start_time": start_time,
                        "status": status,
                        "end_time": None if status == "PROCESSING" else time.time()
                    }
        except Exception as e:
            print(f"Upload failed for {filepath}: {e}")

async def run_benchmark(concurrency, token):
    print(f"\n--- Starting benchmark with concurrency {concurrency} ---")
    
    # Clean up previous docs? We'll just create new ones or use same
    
    sem = asyncio.Semaphore(concurrency)
    stop_event = asyncio.Event()
    queue_depths = []
    
    # Start poller
    poller_task = asyncio.create_task(poll_rabbitmq(stop_event, queue_depths))
    
    stats = {
        "fallback_count": 0,
        "uploaded_docs": {}
    }
    
    files = [os.path.join(TEST_DIR, f"doc_{i}.txt") for i in range(NUM_DOCS)]
    
    start_total_time = time.time()
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for filepath in files:
            tasks.append(asyncio.create_task(upload_document(session, sem, token, filepath, stats)))
            
        await asyncio.gather(*tasks)
        
        # Now poll status until all are INDEXED or FAILED
        headers = {"Authorization": f"Bearer {token}"}
        while True:
            all_done = True
            try:
                async with session.get(f"{API_BASE}/documents", headers=headers) as resp:
                    docs = await resp.json()
                    
                    # update stats
                    for doc in docs:
                        doc_id = doc.get("id")
                        status = doc.get("status")
                        
                        if doc_id in stats["uploaded_docs"]:
                            if stats["uploaded_docs"][doc_id]["status"] == "PROCESSING" and status in ["INDEXED", "FAILED"]:
                                stats["uploaded_docs"][doc_id]["status"] = status
                                stats["uploaded_docs"][doc_id]["end_time"] = time.time()
                                
                            if stats["uploaded_docs"][doc_id]["status"] == "PROCESSING" or stats["uploaded_docs"][doc_id]["status"] == "PENDING":
                                all_done = False
            except Exception as e:
                print(f"Error checking status: {e}")
                all_done = False
                
            if all_done:
                break
            await asyncio.sleep(2)
            
            # Check timeout (e.g. 5 minutes max)
            if time.time() - start_total_time > 300:
                print("Timeout waiting for documents to process")
                break
                
    end_total_time = time.time()
    stop_event.set()
    await poller_task
    
    # Calculate metrics
    total_time = end_total_time - start_total_time
    throughput = NUM_DOCS / total_time if total_time > 0 else 0
    
    success_count = sum(1 for d in stats["uploaded_docs"].values() if d["status"] == "INDEXED")
    failure_count = sum(1 for d in stats["uploaded_docs"].values() if d["status"] == "FAILED")
    
    latencies = [d["end_time"] - d["start_time"] for d in stats["uploaded_docs"].values() if d["end_time"] is not None]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    max_queue = max(queue_depths) if queue_depths else 0
    
    print(f"Done. Throughput: {throughput:.2f} docs/sec, Max Queue: {max_queue}, Fallbacks: {stats['fallback_count']}, Failures: {failure_count}")
    
    return {
        "concurrency": concurrency,
        "throughput": throughput,
        "max_queue": max_queue,
        "fallback_rate": stats["fallback_count"] / NUM_DOCS,
        "failure_rate": failure_count / NUM_DOCS,
        "avg_latency": avg_latency
    }

async def main():
    generate_docs()
    token = get_token()
    
    for c in CONCURRENCY_LEVELS:
        res = await run_benchmark(c, token)
        results.append(res)
        # Delete docs to avoid filling up the DB too much? 
        # (Optional, but let's just leave them as the RAG worker will process them and they have a UUID path)
        time.sleep(2) # brief pause
        
    # Generate report
    report = "# Batch Ingestion Benchmark Report\n\n"
    report += "| Concurrency | Throughput (docs/sec) | Avg Latency (s) | Max Queue Depth | Fallback Rate | Failure Rate |\n"
    report += "|-------------|-----------------------|-----------------|-----------------|---------------|--------------|\n"
    
    for r in results:
        report += f"| {r['concurrency']} | {r['throughput']:.2f} | {r['avg_latency']:.2f} | {r['max_queue']} | {r['fallback_rate']:.2%} | {r['failure_rate']:.2%} |\n"
        
    with open("benchmark_report.md", "w") as f:
        f.write(report)
        f.write("\n\n![Benchmark Chart](benchmark_chart.png)\n")
        
    # Generate charts
    concurrencies = [r["concurrency"] for r in results]
    throughputs = [r["throughput"] for r in results]
    failure_rates = [r["failure_rate"] * 100 for r in results] # percentage
    
    fig, ax1 = plt.subplots(figsize=(10, 6))
    
    color = 'tab:blue'
    ax1.set_xlabel('Concurrency Level')
    ax1.set_ylabel('Throughput (docs/sec)', color=color)
    ax1.plot(concurrencies, throughputs, marker='o', color=color, label='Throughput')
    ax1.tick_params(axis='y', labelcolor=color)
    
    ax2 = ax1.twinx()
    color = 'tab:red'
    ax2.set_ylabel('Failure Rate (%)', color=color)
    ax2.plot(concurrencies, failure_rates, marker='s', color=color, linestyle='--', label='Failure Rate')
    ax2.tick_params(axis='y', labelcolor=color)
    
    fig.tight_layout()
    plt.title('Batch Ingestion Benchmark: Throughput and Failure Rate vs Concurrency')
    plt.savefig('benchmark_chart.png')
    
    print("Benchmark complete. Results saved to benchmark_report.md and benchmark_chart.png")

if __name__ == "__main__":
    asyncio.run(main())
