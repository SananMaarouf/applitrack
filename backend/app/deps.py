from fastapi import Header, HTTPException, status


async def get_user_id(x_user_id: str | None = Header(default=None, alias="X-User-Id")) -> str:
    # Temporary auth shim to preserve current DB semantics (user_id is required).
    # Swap this out for Clerk JWT verification when you're ready.
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )
    return x_user_id
