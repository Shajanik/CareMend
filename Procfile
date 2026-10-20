web: gunicorn --worker-class sync --workers 2 --timeout 60 --access-logfile - --error-logfile - --log-level info --bind 0.0.0.0:5000 backend.app:app
