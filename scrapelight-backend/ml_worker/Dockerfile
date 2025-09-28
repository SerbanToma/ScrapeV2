FROM python:3.11-slim

RUN groupadd -r celery && useradd -r -g celery celery

WORKDIR /app

RUN pip install --no-cache-dir torch==2.1.0+cpu torchvision==0.16.0+cpu \
  -f https://download.pytorch.org/whl/torch_stable.html

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R celery:celery /app
RUN mkdir -p /home/celery && chown -R celery:celery /home/celery
ENV HOME=/home/celery

# Switch to non-root user
USER celery

# Default command (can be overridden)
CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info"]