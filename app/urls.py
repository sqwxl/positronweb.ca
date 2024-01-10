from django.urls import include, path

from . import views

urlpatterns = [
    path("__reload__/", include("django_browser_reload.urls")),
    path("", views.index, name="index"),
    path("services/", views.services, name="services"),
    path("technologies/", views.tech, name="tech"),
    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),
]
