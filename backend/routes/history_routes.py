"""
routes/history_routes.py — GET /history
Returns past risk assessments and chat history from the database.
"""

from flask import Blueprint, request, jsonify
from utils.logger import logger
from models_db.user_model import UserProfile, ChatHistory

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
def get_history():
    """
    Query params (all optional):
      limit  — max records to return (default 20)
      type   — "assessments" | "chats" | "all" (default "all")
    """
    limit = min(int(request.args.get("limit", 20)), 100)
    kind  = request.args.get("type", "all").lower()

    result = {}

    if kind in ("assessments", "all"):
        profiles = (
            UserProfile.query
            .order_by(UserProfile.created_at.desc())
            .limit(limit)
            .all()
        )
        result["assessments"] = [p.to_dict() for p in profiles]
        logger.info(f"HISTORY  returned {len(profiles)} assessments")

    if kind in ("chats", "all"):
        chats = (
            ChatHistory.query
            .order_by(ChatHistory.timestamp.desc())
            .limit(limit)
            .all()
        )
        result["chats"] = [c.to_dict() for c in chats]
        logger.info(f"HISTORY  returned {len(chats)} chat records")

    return jsonify(result)


@history_bp.route("/health", methods=["GET"])
def health():
    from datetime import datetime
    return jsonify({
        "status":    "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service":   "CareMend API",
    })
