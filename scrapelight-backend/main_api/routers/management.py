from fastapi import APIRouter, HTTPException
from celery import Celery
from fastapi import Response

from shared import SearchResponse

router = APIRouter(
    prefix="/management",
    tags=["management"]
)

celery_app = Celery('scrapelight', broker='redis://redis:6379/0', backend='redis://redis:6379/0')


@router.get("/health_check")
def health_check():
    try:
        task = celery_app.send_task(
            'ml_worker.tasks.search_tasks.health_check'
        )
        return task.get()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)

    if result.ready():
        if result.successful():
            result = result.result
            return {
                    "task_id": task_id,
                    "status": "completed",
                    "items_found": len(result),
                    "predictions": result,
                }
        else:
            return {
                "task_id": task_id,
                "status": "failed",
                "error": str(result.info)
            }
    else:
        return {
            "task_id": task_id,
            "status": "processing"
        }
