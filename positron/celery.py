import os
from django.core import mail
from celery import Celery


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "positron.settings")

app = Celery("positron", broker="redis://localhost")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()


# create send_mail task
@app.task(bind=True)
def send_mail(self, subject, message, from_email, recipient_list):
    mail.send_mail(subject, message, from_email, recipient_list)
