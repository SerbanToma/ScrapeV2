from typing import Optional

import httpx
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="", tags=["image-proxy"])


@router.get("/image-proxy")
async def image_proxy(url: str = Query(..., description="Absolute image URL (http/https)")):
	if not (url.startswith("http://") or url.startswith("https://")):
		raise HTTPException(status_code=400, detail="Invalid URL. Must start with http:// or https://")

	parsed = urlparse(url)
	host = parsed.hostname or ""
	default_referer = f"{parsed.scheme}://{host}/"

	headers = {
		# Impersonate a modern browser
		"User-Agent": (
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
			"AppleWebKit/537.36 (KHTML, like Gecko) "
			"Chrome/126.0.0.0 Safari/537.36"
		),
		"Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
		"Accept-Language": "en-US,en;q=0.9",
		# Some CDNs require a referer; use site root or vendor domain if known
		"Referer": "https://novaluce.com/" if host.endswith("novaluce.com") else default_referer,
		# Ensure Host matches upstream
		"Host": host,
	}

	try:
		# Use HTTP/1.1 to avoid optional http2 dependency; many CDNs work fine over HTTP/1.1
		async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
			r = await client.get(url, headers=headers)
			r.raise_for_status()
			content_type = r.headers.get("content-type", "image/jpeg")
			return StreamingResponse(iter([r.content]), media_type=content_type)
	except httpx.HTTPStatusError as e:
		raise HTTPException(status_code=e.response.status_code, detail=f"Upstream error: {e}")
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Proxy failed: {e}")


