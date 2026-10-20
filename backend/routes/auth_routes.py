"""
routes/auth_routes.py
=====================
POST /signup  — register a new user (hashed password, stored in DB)
POST /signin  — verify credentials, return JWT token
GET  /me      — return current user from token (optional, for profile)
"""

import re
import os
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

from extensions import db
from models_db.auth_model import User
from utils.logger import logger

auth_bp = Blueprint("auth", __name__)

# ── JWT secret (use env var in production) ────────────────────────────────────
JWT_SECRET  = os.getenv("JWT_SECRET_KEY", "caremend-secret-key-change-in-production")
JWT_EXPIRES = timedelta(days=7)


def _make_token(user_id: int, email: str) -> str:
    payload = {
        "sub":  user_id,
        "email": email,
        "iat":  datetime.now(timezone.utc),
        "exp":  datetime.now(timezone.utc) + JWT_EXPIRES,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _validate_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


# ── POST /signup ──────────────────────────────────────────────────────────────
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    logger.info(f"SIGNUP payload received: {data}")

    full_name = (data.get("full_name") or "").strip()
    email     = (data.get("email")     or "").strip().lower()
    password  = (data.get("password")  or "").strip()
    mobile    = (data.get("mobile")    or "").strip()
    username  = (data.get("username")  or "").strip()

    # ── Validate ──────────────────────────────────────────────────────────────
    errors = []
    if not full_name:            errors.append("full_name is required")
    if not email:                errors.append("email is required")
    elif not _validate_email(email): errors.append("email format is invalid")
    if not password:             errors.append("password is required")
    elif len(password) < 6:      errors.append("password must be at least 6 characters")
    if not username:             errors.append("username is required")

    if errors:
        logger.warning(f"SIGNUP validation failed: {errors}")
        return jsonify({"error": "Validation failed", "details": errors}), 400

    # ── Duplicate check ───────────────────────────────────────────────────────
    if User.query.filter_by(email=email).first():
        logger.warning(f"SIGNUP duplicate email: {email}")
        return jsonify({"error": "An account with this email already exists"}), 409

    if User.query.filter_by(username=username).first():
        logger.warning(f"SIGNUP duplicate username: {username}")
        return jsonify({"error": "This username is already taken"}), 409

    # ── Hash password & save ──────────────────────────────────────────────────
    logger.info(f"🔐 SIGNUP hashing password for: {username}")
    hashed = generate_password_hash(password)
    logger.info(f"🔑 Password hashed successfully, length: {len(hashed)}")

    user = User(
        full_name     = full_name,
        email         = email,
        username      = username,
        password_hash = hashed,
        mobile        = mobile,
    )
    db.session.add(user)
    db.session.commit()

    logger.info(f"✅ SIGNUP success - id={user.id}, email={email}, username={username}")
    logger.info(f"📊 User saved to database with hash length: {len(user.password_hash)}")

    token = _make_token(user.id, user.email)

    return jsonify({
        "message":  "Account created successfully",
        "token":    token,
        "user": {
            "id":        user.id,
            "full_name": user.full_name,
            "email":     user.email,
            "username":  user.username,
        },
    }), 201


# ── POST /signin ──────────────────────────────────────────────────────────────
@auth_bp.route("/signin", methods=["POST"])
def signin():
    data = request.get_json(silent=True) or {}

    identifier = (data.get("identifier") or data.get("username") or data.get("email") or "").strip()
    password   = (data.get("password")   or "").strip()

    logger.info(f"🔐 SIGNIN attempt - identifier: {identifier}")
    logger.info(f"📊 Request origin: {request.origin}")
    logger.info(f"📊 Request headers: {dict(request.headers)}")

    if not identifier or not password:
        logger.warning("SIGNIN missing identifier or password")
        return jsonify({
            "error": "Invalid credentials",
            "message": "identifier/username/email and password are required"
        }), 401

    # ── Find user by email, username, or mobile ───────────────────────────────
    user = None
    search_fields = []
    
    # Try email first (case-insensitive)
    user = User.query.filter(User.email.ilike(identifier)).first()
    search_fields.append(f"email={identifier}")
    if user:
        logger.info(f"✅ User found by email: {user.email} (ID: {user.id})")
    
    # Try username (case-insensitive)
    if not user:
        user = User.query.filter(User.username.ilike(identifier)).first()
        search_fields.append(f"username={identifier}")
        if user:
            logger.info(f"✅ User found by username: {user.username} (ID: {user.id})")
    
    # Try mobile
    if not user:
        user = User.query.filter_by(mobile=identifier).first()
        search_fields.append(f"mobile={identifier}")
        if user:
            logger.info(f"✅ User found by mobile: {user.mobile} (ID: {user.id})")

    if not user:
        logger.warning(f"❌ SIGNIN unknown identifier: {identifier} (searched: {', '.join(search_fields)})")
        logger.info(f"📊 Total users in database: {User.query.count()}")
        
        # List all users for debugging (remove in production)
        all_users = User.query.all()
        for u in all_users:
            logger.debug(f"   - User: username={u.username}, email={u.email}, mobile={u.mobile}")
        
        return jsonify({
            "error": "Invalid credentials",
            "message": "Username, email, or password is incorrect"
        }), 401

    # ── Verify password ────────────────────────────────────────────────────────
    logger.info(f"🔑 Checking password for user: {user.username}")
    logger.info(f"🔑 Password hash exists: {bool(user.password_hash)}")
    logger.info(f"🔑 Password hash length: {len(user.password_hash) if user.password_hash else 0}")
    logger.info(f"🔑 Password length provided: {len(password)}")
    
    password_valid = check_password_hash(user.password_hash, password)
    logger.info(f"🔑 Password validation result: {password_valid}")

    if not password_valid:
        logger.warning(f"❌ SIGNIN wrong password for: {identifier} (user: {user.username})")
        return jsonify({
            "error": "Invalid credentials",
            "message": "Username, email, or password is incorrect"
        }), 401

    token = _make_token(user.id, user.email)

    logger.info(f"✅ SIGNIN success - id={user.id}, email={user.email}, username={user.username}")

    return jsonify({
        "success": True,
        "message": "Signed in successfully",
        "token":   token,
        "user": {
            "id":        user.id,
            "full_name": user.full_name,
            "email":     user.email,
            "username":  user.username,
            "has_completed_assessment": user.has_completed_assessment,
        },
    }), 200


# ── Token decode helper ───────────────────────────────────────────────────────
def _decode_token(request):
    """Returns (user_id, error_response). One of them will be None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "Missing token"}), 401)
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"], None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Token expired"}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Invalid token"}), 401)


# ── GET /me ───────────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
def me():
    user_id, err = _decode_token(request)
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict())


# ── GET /profile ──────────────────────────────────────────────────────────────
@auth_bp.route("/profile", methods=["GET"])
def get_profile():
    user_id, err = _decode_token(request)
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict())


# ── DEBUG ENDPOINT: Check users in database ───────────────────────────────────
@auth_bp.route("/debug/users", methods=["GET"])
def debug_users():
    """DEBUG ENDPOINT - Remove in production"""
    try:
        users = User.query.all()
        return jsonify({
            "total_users": len(users),
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "mobile": u.mobile,
                    "full_name": u.full_name,
                    "created_at": u.created_at.isoformat(),
                }
                for u in users
            ]
        }), 200
    except Exception as e:
        logger.error(f"DEBUG error: {e}")
        return jsonify({"error": str(e)}), 500


# ── DEBUG ENDPOINT: Test password hash ─────────────────────────────────────────
@auth_bp.route("/debug/test-hash", methods=["POST"])
def debug_test_hash():
    """DEBUG ENDPOINT - Test if a password hashes correctly"""
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username", "")
        password = data.get("password", "")
        
        if not username or not password:
            return jsonify({"error": "username and password required"}), 400
        
        user = User.query.filter(User.username.ilike(username)).first()
        if not user:
            return jsonify({"error": f"User '{username}' not found"}), 404
        
        is_valid = check_password_hash(user.password_hash, password)
        
        return jsonify({
            "username": user.username,
            "password_provided": password,
            "password_hash_valid": is_valid,
            "hash_length": len(user.password_hash),
            "message": "Password is correct!" if is_valid else "Password is incorrect!"
        }), 200
    except Exception as e:
        logger.error(f"DEBUG error: {e}")
        return jsonify({"error": str(e)}), 500


# ── PUT /profile ──────────────────────────────────────────────────────────────
@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    user_id, err = _decode_token(request)
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    logger.info(f"PROFILE PUT  id={user_id}  payload_keys={list(data.keys())}")

    # Updatable fields (email/password excluded from this endpoint)
    updatable = ["full_name", "mobile", "dob", "gender",
                 "blood_type", "emergency_contact", "allergies", "medications"]

    for field in updatable:
        if field in data:
            value = (data[field] or "").strip() or None
            setattr(user, field, value)
            logger.info(f"  SET {field} = {value!r}")

    try:
        db.session.commit()
        logger.info(f"PROFILE updated  id={user.id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"PROFILE commit failed: {e}")
        return jsonify({"error": "Database error saving profile"}), 500

    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()})
