# backend/ilas_backend/celery.py
from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ilas_backend.settings')

app = Celery('ilas_backend')

app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscover all tasks.py files in installed apps
app.autodiscover_tasks(lambda: os.environ.get("DJANGO_SETTINGS_MODULE") and [] )

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
