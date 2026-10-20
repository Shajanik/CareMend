"""
services/firebase_client.py — Firebase client and authentication initialization
Handles connection to Firebase for authentication and cloud storage
"""

import os
from utils.logger import logger
from config import FIREBASE_CONFIG, FIREBASE_ENABLED

def is_firebase_enabled():
    """Check if Firebase is properly configured"""
    return FIREBASE_ENABLED

def log_firebase_status():
    """Log Firebase connection status"""
    if is_firebase_enabled():
        logger.info(f"[OK] Firebase configured - Project: {FIREBASE_CONFIG.get('projectId', 'N/A')}")
        return True
    else:
        logger.warning("[INFO] Firebase not configured - Using local SQLite")
        return False

def initialize_firebase():
    """Initialize Firebase (placeholder for future Firebase Admin SDK integration)"""
    if not FIREBASE_ENABLED:
        logger.warning("[INFO] Firebase not configured - Using local authentication")
        return False
    
    # For now, just log the status
    # Full Firebase Admin SDK integration requires service account JSON
    logger.info(f"[INFO] Firebase client-side config ready for Project: {FIREBASE_CONFIG['projectId']}")
    return True

# Initialize on module load
if __name__ != "__main__":
    log_firebase_status()
