from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

from .forms import ContactForm


def index(request):
    return render(request, "pages/index.html", {"page_title": _("Home")})


def services(request):
    return render(request, "pages/services.html", {"page_title": _("Services")})


def about(request):
    return render(request, "pages/about.html", {"page_title": _("About")})


def contact(request):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            # TODO: send email; flash success message
            pass
    else:
        form = ContactForm()

    return render(
        request,
        "pages/contact.html",
        {"page_title": _("Contact"), "form": form},
    )
