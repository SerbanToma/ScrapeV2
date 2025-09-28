import sys
from pathlib import Path
from typing import Optional

from celery import Celery
from celery.signals import worker_process_init
import os
from shared.schemas import StoresModel

sys.path.append(str(Path(__file__).parent.parent))
from services import SearchService

celery_app = Celery('ml_worker')

_searcher = None


def get_searcher():
    """Lazy load predictor """
    global _searcher
    if _searcher is None:
        _searcher = SearchService()
    return _searcher


@celery_app.task(bind=True, name='ml_worker.tasks.search_tasks.picture_search')
def picture_search(self, image_path: str, store: str, top_k: int = 20):
    try:
        # Add detailed logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Processing image: {image_path}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"File exists: {os.path.exists(image_path)}")

        # Check if file exists before processing
        if not os.path.exists(image_path):
            # List contents of the tmp_shared directory
            tmp_shared_dir = "/app/tmp_shared"
            if os.path.exists(tmp_shared_dir):
                files = os.listdir(tmp_shared_dir)
                logger.info(f"Files in {tmp_shared_dir}: {files}")
            else:
                logger.error(f"Directory {tmp_shared_dir} does not exist")
            raise FileNotFoundError(f"Image file not found at {image_path}")

        predictor = get_searcher()
        results = predictor.search_by_picture_and_display_results(image_path=image_path, store=store, top_k=top_k)

        if os.path.exists(image_path):
            os.remove(image_path)

        # Return the results directly
        return results if results else []
    except Exception as exc:
        if os.path.exists(image_path):
            os.remove(image_path)

        if self.request.retries < 3:
            raise self.retry(countdown=60, exc=exc)

        return {
            'error': str(exc),
            'status': 'failed'
        }


# Warm up model and feature cache on worker process start
@worker_process_init.connect
def warmup_worker(**kwargs):
    try:
        predictor = get_searcher()
        # Preload features so the first task is fast
        predictor._load_feature_cache()
    except Exception:
        # Do not crash worker if warmup fails; the first task will trigger loading
        pass


@celery_app.task(bind=True, name='ml_worker.tasks.search_tasks.spec_search')
def spec_search(
        self,
        details: Optional[str],
        bulb_type: Optional[str],
        dimensions: Optional[str],
        category: Optional[str],
        store: str
):
    try:
        predictor = get_searcher()
        results = predictor.search_by_specifications_and_display_results(
            details=details,
            bulb_type=bulb_type,
            dimensions=dimensions,
            category=category,
            store=store
        )
        return results if results else []
    except Exception as exc:

        if self.request.retries < 3:
            raise self.retry(countdown=60, exc=exc)

        return {
            'error': str(exc),
            'status': 'failed'
        }



@celery_app.task(name='ml_worker.tasks.search_tasks.health_check')
def health_check():
    """Health check for ML workers"""
    try:
        predictor = get_searcher()
        return {
            'status': 'healthy',
            'model_loaded': predictor is not None
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }
