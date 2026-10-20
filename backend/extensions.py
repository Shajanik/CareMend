"""
extensions.py — Shared Flask extensions.
Initialised here, bound to the app in app.py to avoid circular imports.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
