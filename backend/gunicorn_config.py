"""
gunicorn_config.py — Gunicorn configuration for production deployment.
Used by: gunicorn -c gunicorn_config.py app:app
"""

import os
import multiprocessing

# Server configuration
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
workers = max(2, multiprocessing.cpu_count())
worker_class = "sync"
worker_connections = 1000
timeout = 60
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "caremend"

# Server mechanics
daemon = False
umask = 0o022
tmp_upload_dir = None

# SSL (if needed, set via environment)
keyfile = os.getenv("GUNICORN_KEYFILE")
certfile = os.getenv("GUNICORN_CERTFILE")

# App configuration
raw_env = []
forwarded_allow_ips = "*"
secure_scheme_headers = {
    "X-FORWARDED_PROTOCOL": "ssl",
    "X-FORWARDED_PROTO": "https",
    "X-FORWARDED_SSL": "on",
}

print("🚀 Gunicorn configured:")
print(f"  - Bind: {bind}")
print(f"  - Workers: {workers}")
print(f"  - Timeout: {timeout}s")
print(f"  - Logging: stdout/stderr")
