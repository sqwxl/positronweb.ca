from django.contrib import messages
from django.conf import settings
from django.shortcuts import HttpResponseRedirect, render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from .forms import ContactForm

if settings.DEBUG:
    from django.core.mail import send_mail
else:
    from positron.celery import send_mail

    send_mail = send_mail.delay


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
            try:
                send_mail(
                    f"Message from {form.cleaned_data['name']}",
                    "\n".join(
                        [
                            f"{field}: {value}"
                            for field, value in form.cleaned_data.items()
                        ]
                    ),
                    settings.EMAIL_HOST_USER,
                    [settings.EMAIL_HOST_USER],
                )
                messages.success(
                    request,
                    _("Your message has been sent, thank you."),
                )

                return HttpResponseRedirect(
                    reverse("index"),
                )
            except Exception:
                messages.error(
                    request,
                    _(
                        "There was an error sending your message, please try again."
                    ),
                )
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
