import httpx
from fastapi import HTTPException, Request, status

from app.core.auth import authenticate_request


def _to_httpx_request(request: Request) -> httpx.Request:
    """Convert a FastAPI/Starlette Request into an httpx.Request for the Clerk SDK."""
    return httpx.Request(
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
    )


async def get_user_id(request: Request) -> str:
    """Authenticate the incoming request via Clerk and return the user id."""
    user_id = authenticate_request(_to_httpx_request(request))
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user_id
