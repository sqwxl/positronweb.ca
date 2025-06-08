AUTHOR = "Positron"
SITENAME = "Positron"
TIMEZONE = "America/Montreal"

IGNORE_FILES = ["**/.*", "infra", "__pycache__", "README.md"]
TEMPLATE_EXTENSIONS = [".html"]

SITEURL = ""

THEME = "."

THEME_STATIC_DIR = ""  # output dir for static files

JINJA_ENVIRONMENT = {
    "extensions": ["jinja2.ext.i18n"],
}
I18N_SUBSITES = {"fr": {}}

DIRECT_TEMPLATES = ["index"]

# Disable feed gen
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Disable tags
TAGS_SAVE_AS = ""
TAG_SAVE_AS = ""

DELETE_OUTPUT_DIRECTORY = True
