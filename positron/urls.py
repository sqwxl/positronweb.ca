from django.contrib import admin
from django.conf.urls.i18n import i18n_patterns
from django.urls import include, path

app_urls = [
    path("", include("app.urls")),
    path("admin/", admin.site.urls),
]

urlpatterns = i18n_patterns(*app_urls)
