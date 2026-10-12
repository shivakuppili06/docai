import redis
import json
import logging
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        self.redis_client = None
        self._connect()

    def _connect(self):
        host = getattr(settings, "redis_host", "localhost")
        port = getattr(settings, "redis_port", 6379)
        try:
            self.redis_client = redis.Redis(host=host, port=port, decode_responses=True)
            self.redis_client.ping()
            logger.info(f"Connected to Redis at {host}:{port}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None

    def _generate_key(self, doc_ids: list[int] | int, question: str) -> str:
        if isinstance(doc_ids, list):
            sorted_ids = ",".join(str(i) for i in sorted(doc_ids))
            return f"query_cache:multi:{sorted_ids}:{hash(question)}"
        return f"query_cache:{doc_ids}:{hash(question)}"

    def get_query_result(self, doc_ids: list[int] | int, question: str) -> Optional[Dict[str, Any]]:
        if not self.redis_client:
            return None
            
        key = self._generate_key(doc_ids, question)
        try:
            cached_data = self.redis_client.get(key)
            if cached_data:
                logger.info(f"[CACHE HIT] Found cached result for doc(s) {doc_ids}, question: '{question}'")
                return json.loads(cached_data)
            else:
                logger.info(f"[CACHE MISS] No cached result for doc(s) {doc_ids}, question: '{question}'")
                return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    def set_query_result(self, doc_ids: list[int] | int, question: str, answer: str, sources: list):
        if not self.redis_client:
            return
            
        key = self._generate_key(doc_ids, question)
        try:
            data = json.dumps({"answer": answer, "sources": sources})
            self.redis_client.setex(key, settings.cache_ttl, data)
        except Exception as e:
            logger.error(f"Redis set error: {e}")

    def is_rate_limited(self, identifier: str, limit: int = 20, window_seconds: int = 60) -> bool:
        if not self.redis_client:
            return False # Fail open if Redis is down
            
        key = f"rate_limit:{identifier}"
        try:
            current = self.redis_client.incr(key)
            if current == 1:
                self.redis_client.expire(key, window_seconds)
            
            if current > limit:
                logger.warning(f"[RATE LIMIT] Identifier {identifier} exceeded limit {limit}/{window_seconds}s")
                return True
            return False
        except Exception as e:
            logger.error(f"Redis rate limit error: {e}")
            return False

redis_cache = RedisCache()
