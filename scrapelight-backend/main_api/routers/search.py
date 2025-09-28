import asyncio
import uuid
from enum import Enum
from typing import Optional

from celery import Celery
from fastapi import APIRouter, UploadFile, File, HTTPException
from starlette import status

from shared import SearchResponse, StoresModel
from fastapi import Response
from shared.schemas import SpecSearchBody

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

celery_app = Celery('scrapelight', broker='redis://redis:6379/0', backend='redis://redis:6379/0')


@router.post("/by_picture")
async def predict_image(response: Response, file: UploadFile = File(...), store: StoresModel = StoresModel.All, top_k: int = 20, wait: bool = True):
    task_id = str(uuid.uuid4())

    file_path = f"/app/tmp_shared/{task_id}_{file.filename}"

    # Ensure the directory exists
    import os
    os.makedirs("/app/tmp_shared", exist_ok=True)

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            buffer.flush()

        # Verify the file was created
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Failed to create file at {file_path}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    try:
        task = celery_app.send_task(
            'ml_worker.tasks.search_tasks.picture_search',
            args=[file_path, store.value, top_k],
            task_id=task_id
        )
        if not wait:
            response.status_code = status.HTTP_202_ACCEPTED
            return {"task_id": task_id, "status": "queued"}
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, task.get, 60)  # 60s timeout

        # Handle the result format
        if isinstance(result, dict) and result.get('status') == 'failed':
            raise HTTPException(status_code=500, detail=result.get('error', 'Picture search failed'))

        # If result is a list of predictions, format it properly
        if isinstance(result, list):
            return SearchResponse(items_found=len(result), predictions=result, status="success")
        else:
            return SearchResponse(items_found=len(result), predictions=[], status="success")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Picture search failed: {str(e)}")


@router.post("/by_specifications")
async def spec_search(
        response: Response,
        details: Optional[str] = None,
        bulb_type: Optional[str] = None,
        dimensions: Optional[str] = None,
        category: Optional[str] = None,
        store: StoresModel = StoresModel.All,
        wait: bool = True,
):
    task_id = str(uuid.uuid4())
    try:
        task = celery_app.send_task(
            "ml_worker.tasks.search_tasks.spec_search",
            args=[details, bulb_type, dimensions, category, store.value],
            task_id=task_id
        )
        if not wait:
            response.status_code = status.HTTP_202_ACCEPTED
            return {"task_id": task_id, "status": "queued"}
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, task.get, 60)  # 60s timeout
        if isinstance(result, dict) and result.get('status') == 'failed':
            raise HTTPException(status_code=500, detail=result.get('error', 'Spec search failed'))

        # If result is a list of predictions, format it properly
        if isinstance(result, list):
            return SearchResponse(items_found=len(result), predictions=result, status="success")
        else:
            return SearchResponse(items_found=len(result), predictions=[], status="success")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spec search failed: {str(e)}")
