"""
utils/logger.py — Centralised logging setup.
Import `logger` anywhere in the project.
"""

import logging
import os
from config import LOG_FILE


def setup_logger() -> logging.Logger:
    logger = logging.getLogger("caremend")
    if logger.handlers:          # avoid duplicate handlers on reload
        return logger

    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s — %(message)s")

    # File handler - create directory if it doesn't exist
    try:
        log_dir = os.path.dirname(LOG_FILE)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        fh = logging.FileHandler(LOG_FILE)
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except Exception as e:
        # If we can't write to file (e.g., read-only file system), just skip file handler
        print(f"Warning: Could not set up file logging: {e}")

    # Console handler (always works)
    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    logger.addHandler(ch)
    
    return logger


logger = setup_logger()
