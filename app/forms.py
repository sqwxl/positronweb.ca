from django import forms
from django.utils.translation import gettext_lazy as _


class ContactForm(forms.Form):
    def __init__(self, *args, **kwargs):
        kwargs["label_suffix"] = ""
        super().__init__(*args, **kwargs)

    name = forms.CharField(max_length=100, label=_("Name"))
    email = forms.EmailField(label=_("Email"))
    number = forms.CharField(
        widget=forms.TextInput(attrs={"type": "tel"}),
        label=_("Phone Number (optional)"),
        required=False,
    )
    message = forms.CharField(
        label=_("Message"),
        widget=forms.Textarea(
            attrs={
                "placeholder": _(
                    "Tell us about your project, your budget and your target launch date. We'll get back to you ASAP."
                )
            }
        ),
    )
