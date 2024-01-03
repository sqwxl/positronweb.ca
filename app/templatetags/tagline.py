import random

from django.template import Library
from django.utils.translation import gettext as _

register = Library()

taglines = [
    _("The web how it was meant to be"),
    _("The snippy, snappy subatomic particle"),
    _("The web artisans"),
    _("Simple, reliable, and fast"),
    _("Your new favorite antiparticle"),
    _("Where technology meets craftsmanship"),
    _("Powered by positronic brains"),
    _("Web crafting with a positive spin"),
    _("Bit by positronic bit"),
    _("Enjoy a warm cup of positronic tea"),
    _("Positronic precision in every pixel"),
    _("Positive design, positive impact"),
    _("The positively powerful positronic web experience"),
    _("Infused with positively charged particles"),
    _("Thunderstruck by a bolt of positronic lightning"),
    _("Artisanal bytes served up on a positronic palette"),
    _("Meet the electron's nerdy cousin"),
]


@register.simple_tag
def tagline():
    return random.choice(taglines)
