run:
    tailwindcss -i static/css/input.css -o static/css/output.css
    python3 manage.py runserver

css:
    tailwindcss -i static/css/input.css -o static/css/output.css --watch

run-containers:
    podman build -t harfang -f Dockerfile .
    podman-compose up -d

migrate:
    python3 manage.py makemigrations
    python3 manage.py migrate

populate: rm-migrations migrate
    python3 manage.py setup_test_data

setup:
    pip install -r requirements.txt
    python manage.py makemigrations
    python manage.py migrate
    python manage.py collectstatic --noinput
    python manage.py compress

setup-server:
    #!/usr/bin/env bash
    sudo dnf install redis nginx
    cp extra/systemd/* /etc/systemd/system/
    cp extra/celeryrc /etc/default/celeryrc
    sudo systemctl daemon-reload
    sudo systemctl enable celery.service
    sudo systemctl enable gunicorn.service
    sudo systemctl enable redis.service
    sudo systemctl enable nginx.service
    sudo reboot

rm-migrations:
    #!/usr/bin/env bash
    echo "Removing migrations..."
    find . -path "*/migrations/0*.py" -delete 2> /dev/null
    find . -path "*/migrations/__pycache__" -delete 2> /dev/null
    echo "Removing database..."
    rm -f db.sqlite3 2> /dev/null
