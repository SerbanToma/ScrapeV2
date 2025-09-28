from celery import Celery
import os

celery_app = Celery('ml_worker')
celery_app.config_from_object({
    'broker_url': os.getenv('REDIS_URL', 'redis://redis:6379/0'),
    'result_backend': os.getenv('REDIS_URL', 'redis://redis:6379/0'),
    'task_serializer': 'json',
    'accept_content': ['json'],
    'result_serializer': 'json',
    'timezone': 'UTC',
    'enable_utc': True,
    'broker_connection_retry_on_startup': True,
    'imports': [
        'tasks.search_tasks',
        'tasks.email_tasks'
    ]
})

if __name__ == '__main__':
    celery_app.start()