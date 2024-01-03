from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.core import mail

from .forms import ContactForm


def index(request):
    return render(request, "pages/index.html", {"page_title": _("Home")})


def services(request):
    return render(request, "pages/services.html", {"page_title": _("Services")})


def about(request):
    return render(request, "pages/about.html", {"page_title": _("About")})


def contact(
    request, page_title=_("Contact"), template_name="pages/contact.html"
):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            # TODO:  flash success message
            with mail.get_connection() as connection:
                mail.EmailMessage(
                    subject="Contact Form Submission",
                    body="\n".join(
                        [
                            f"{field}: {value}"
                            for field, value in form.cleaned_data.items()
                        ]
                    ),
                    to=("info@positronweb.ca",),
                    connection=connection,
                ).send()
    else:
        form = ContactForm()

    return render(
        request,
        template_name,
        {"page_title": page_title, "form": form},
    )


def project(request):
    return contact(request, _("Project"), "pages/project.html")
