from __future__ import annotations

import asyncio
from functools import partial
from typing import Any

import boto3
from botocore.config import Config

from app.core.config import settings


def _get_r2_client() -> Any:
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


async def upload_file(key: str, data: bytes, content_type: str) -> None:
    """Upload a file to R2."""
    client = _get_r2_client()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        partial(
            client.put_object,
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        ),
    )


async def delete_file(key: str) -> None:
    """Delete a file from R2."""
    client = _get_r2_client()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        partial(
            client.delete_object,
            Bucket=settings.r2_bucket_name,
            Key=key,
        ),
    )


async def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned GET URL for a private R2 object."""
    client = _get_r2_client()
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(
            client.generate_presigned_url,
            "get_object",
            Params={"Bucket": settings.r2_bucket_name, "Key": key},
            ExpiresIn=expires_in,
        ),
    )
