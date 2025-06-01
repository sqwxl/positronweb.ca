html:
    pelican

devserver:
    pelican --autoreload --listen

publish:
    pelican --settings publishconf.py

extract_translations:
    pybabel extract --mapping babel.cfg --output messages.pot ./

init_fr_translations:
    test (read --prompt-str "Are you sure? y/n ") && pybabel init --input-file messages.pot --output-dir translations/ --locale fr --domain messages

update_translations:
    pybabel update --input-file messages.pot --output-dir translations/ --domain messages

compile_translations:
    pybabel compile --directory translations/ --domain messages
