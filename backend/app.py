"""
app.py — CareMend Flask application entry point.
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS

from config import DATABASE_URI
from extensions import db
from utils.logger import logger

# Blueprints
from routes.history_routes import history_bp
from routes.predict_routes import predict_bp
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.nutrition_routes import nutrition_bp
from routes.assessment_routes import assessment_bp
from routes.system_routes import system_bp
from routes.careconnect_routes import careconnect_bp
from routes.nutrition_plan_routes import nutrition_plan_bp
from routes.exercise_plan_routes import exercise_plan_bp
from routes.forum_routes import forum_bp
from routes.exercise_routes import exercise_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "dev-secret-key-change-in-production"
    )

    # CORS Configuration
    # Allow frontend origin in production
    frontend_urls = [
        "https://care-mend.vercel.app",  # Production frontend URL (Vercel)
        "*"  # Allow all origins (can be restricted later)
    ]
    CORS(app, 
         origins=frontend_urls, 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         max_age=3600)

    # DB
    db.init_app(app)

    # Blueprints - wrapped in try-catch to identify which blueprint fails
    blueprints = [
        ("history", history_bp),
        ("predict", predict_bp),
        ("auth", auth_bp),
        ("user", user_bp),
        ("nutrition", nutrition_bp),
        ("assessment", assessment_bp),
        ("system", system_bp),
        ("careconnect", careconnect_bp),
        ("nutrition_plan", nutrition_plan_bp),
        ("exercise_plan", exercise_plan_bp),
        ("forum", forum_bp),
        ("exercise", exercise_bp),
    ]
    
    for name, bp in blueprints:
        try:
            app.register_blueprint(bp)
            logger.info(f"[OK] Registered blueprint: {name}")
        except Exception as e:
            logger.error(f"[FAILED] Failed to register blueprint '{name}': {e}")
            # Don't crash - continue with other blueprints

    # Risk screening is rule-based (services/risk_screening.py): nothing to load at start-up.
    # The earlier ML demo (ml/, models/osteoporosis/) is no longer used for scoring.

    # DB create - use app context
    try:
        with app.app_context():
            db.create_all()
            logger.info("[OK] Database tables created / verified.")
    except Exception as e:
        logger.error(f"[WARNING] Database initialization error: {e}")

    # Root route
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "message": "Backend running successfully",
            "service": "CareMend Backend",
            "version": "1.0.0",
            "status": "operational"
        }), 200

    # Health check
    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "CareMend Backend",
            "version": "1.0.0"
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"500 error: {e}")
        return jsonify({"error": "Internal server error."}), 500

    return app


# =========================
# IMPORTANT FIX FOR GUNICORN
# =========================

app = create_app()

# =========================
# RUN LOCALLY ONLY
# =========================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    logger.info(f"Starting CareMend backend on http://{host}:{port}")
    app.run(debug=debug, host=host, port=port)
