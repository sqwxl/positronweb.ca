from django.contrib import messages
from django.conf import settings
from django.core import mail
from django.shortcuts import HttpResponseRedirect, render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from .forms import ContactForm


def index(request):
    return render(request, "pages/index.html", {"page_title": _("Home")})


def services(request):
    return render(request, "pages/services.html", {"page_title": _("Services")})


def tech(request):
    return render(request, "pages/tech.html", {"page_title": _("Technologies")})


def about(request):
    return render(request, "pages/about.html", {"page_title": _("About")})


def contact(
    request,
):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            with mail.get_connection(fail_silently=False) as connection:
                mail.EmailMessage(
                    subject="Contact Form Submission",
                    body="\n".join(
                        [
                            f"{field}: {value}"
                            for field, value in form.cleaned_data.items()
                        ]
                    ),
                    to=(settings.EMAIL_HOST_USER,),
                    from_email=settings.EMAIL_HOST_USER,
                    connection=connection,
                ).send(fail_silently=False)
            messages.success(
                request, _("Your message has been sent, thank you.")
            )
            return HttpResponseRedirect(reverse("index"))
        else:
            messages.error(
                request,
                _("There are errors with your submission."),
            )
    else:
        form = ContactForm()

    return render(
        request,
        "pages/contact.html",
        {"page_title": _("Contact"), "form": form},
    )
