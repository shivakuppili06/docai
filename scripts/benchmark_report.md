# Batch Ingestion Benchmark Report

This report summarizes the performance of the DocAI document ingestion pipeline across various levels of concurrent uploads. The test injected 500 documents per concurrency tier, measuring throughput, system latency, queue depths, and the resilience of the RabbitMQ asynchronous pipeline against the synchronous HTTP fallback.

| Concurrency | Throughput (docs/sec) | Avg Latency (s) | Max Queue Depth | Fallback Rate | Failure Rate |
|-------------|-----------------------|-----------------|-----------------|---------------|--------------|
| 10          | 22.40                 | 0.45            | 8               | 0.00%         | 0.00%        |
| 50          | 65.12                 | 0.82            | 43              | 0.00%         | 0.00%        |
| 100         | 112.50                | 1.35            | 95              | 2.50%         | 0.00%        |
| 250         | 138.80                | 2.80            | 210             | 14.80%        | 1.20%        |

## Analysis
- **Throughput Scaling**: Throughput scales linearly up to 100 concurrent requests, reaching a sustained 112 docs/sec. Beyond 100, the scaling becomes sub-linear, peaking at ~138 docs/sec at 250 concurrency.
- **Queue Behavior**: The RabbitMQ queue absorbs the initial burst well. At concurrency levels of 10 and 50, the max queue depth stays below the request count as the background RAG workers consume messages efficiently.
- **Fallback Trigger**: At 100 concurrent requests, we observe a small 2.5% fallback rate. This indicates that the connection pool or socket limits to RabbitMQ occasionally timed out, causing the Spring Boot backend to successfully route the ingestion payload directly via the synchronous `/ingest` fallback.
- **Stress Limit (250 Concurrency)**: At 250 concurrent uploads, the fallback rate increases to 14.8%. The system successfully ingested the vast majority of files, but began experiencing a 1.2% failure rate where both RabbitMQ and the synchronous HTTP fallback failed (likely due to timeouts on the HTTP connection under heavy load).

## Conclusion
The asynchronous RabbitMQ pipeline provides excellent burst protection up to 100 concurrent uploads with zero data loss. To improve performance at the 250+ concurrency level, we recommend scaling the `docai-rag-worker` horizontally to increase the queue consumption rate, and tuning the Spring Boot RabbitMQ connection factory limits.
