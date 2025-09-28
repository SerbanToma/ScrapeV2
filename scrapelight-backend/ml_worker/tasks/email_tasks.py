from celery import Celery
import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from services import EmailService

import logging

logger = logging.getLogger(__name__)

celery_app = Celery('ml_worker')

_emailer = None

def get_emailer():
    global _emailer
    if _emailer is None:
        _emailer = EmailService()
    return _emailer

@celery_app.task(bind=True, name='ml_worker.tasks.email_tasks.send_registration_email')
def send_registration_email(self, username, email):
    emailer = get_emailer()
    try:
        emailer.send_registration_email(username, email)
        logger.info(f"Email Successfully sent to {username}, {email}")
        return True
    except Exception as exc:
        logger.error(f"Error sending email: {exc}")

        if self.request.retries < 3:
            raise self.retry(countdown=60, exc=exc)

        return {
            'error': str(exc),
            'status': 'failed'
        }