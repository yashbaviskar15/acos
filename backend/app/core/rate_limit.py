"""
Aravanta CloudOS — Rate Limiting and Velocity Defense
Provides sliding-window in-memory rate limiting for authentication endpoints,
protecting against brute-force attacks and credential stuffing.
"""
import time
import logging
from collections import defaultdict, deque
from threading import Lock
from typing import Callable
from fastapi import Request, HTTPException, status

logger = logging.getLogger("aravanta.rate_limit")

_REQUEST_HISTORY = defaultdict(deque)
_LOCK = Lock()


def get_client_ip(request: Request) -> str:
    """Extract real client IP considering forwarders and proxies."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def rate_limiter(
    key_prefix: str,
    max_requests: int = 5,
    window_seconds: int = 60
) -> Callable:
    """
    FastAPI dependency factory for sliding-window rate limiting.
    Example: Depends(rate_limiter("login", max_requests=5, window_seconds=60))
    """
    async def check_rate_limit(request: Request):
        client_ip = get_client_ip(request)
        cache_key = f"{key_prefix}:{client_ip}"
        now = time.time()
        window_start = now - window_seconds

        with _LOCK:
            history = _REQUEST_HISTORY[cache_key]
            while history and history[0] < window_start:
                history.popleft()

            if len(history) >= max_requests:
                logger.warning(
                    f"Rate limit exceeded for {cache_key}: {len(history)}/{max_requests} in {window_seconds}s"
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests for {key_prefix}. Please retry after {window_seconds} seconds.",
                    headers={"Retry-After": str(window_seconds)},
                )

            history.append(now)

    return check_rate_limit


def clear_rate_limits():
    """Helper for testing: reset in-memory history."""
    with _LOCK:
        _REQUEST_HISTORY.clear()
