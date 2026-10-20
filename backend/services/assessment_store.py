"""
services/assessment_store.py — persist a rule-based screening result.

Writes the legacy `user_profiles` row (so existing plan/nutrition/chat features keep working)
plus the full structured response in `assessment_results`.

Honesty rules for the legacy columns:
  * unknown optional answers are stored as "unknown"  — never an invented value
  * risk_percentage is stored as NULL: the rule-based result is not a percentage or a probability
  * assessment_results.score holds the NUMBER OF RISK FACTORS found (not a probability)
"""

import json
from typing import Optional

from extensions import db
from models_db.user_model import UserProfile, AssessmentResult


_ACTIVITY_LEGACY = {"regular": "active", "occasional": "moderate", "inactive": "sedentary"}
_CALCIUM_LEGACY = {"adequate": "adequate", "possibly_inadequate": "low"}
_VITD_LEGACY = {"adequate": "sufficient", "deficient": "insufficient"}
_RISK_SCORE_LEGACY = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def save_assessment(user_id: Optional[int], result: dict) -> UserProfile:
    inp = result["inputs_used"]
    category = result["prediction"]["category"]
    female = inp["gender"] == "female"
    profile = UserProfile(
        user_id=user_id,
        age=int(inp["age"]),
        gender=inp["gender"],
        hormonal_changes=(inp.get("menopause_status") or "unknown") if female else "not_applicable",
        family_history=inp.get("parent_hip_fracture") or "unknown",   # parent hip fracture
        body_weight=result["bmi"]["category"],
        calcium_intake=_CALCIUM_LEGACY.get(inp.get("calcium_intake"), "unknown"),
        vitamin_d_intake=_VITD_LEGACY.get(inp.get("vitamin_d_status"), "unknown"),
        physical_activity=_ACTIVITY_LEGACY.get(inp.get("physical_activity"), "unknown"),
        risk_score=_RISK_SCORE_LEGACY[category],      # legacy 0/1/2 scale
        risk_level=category,
        risk_percentage=None,                         # rule-based result is not a percentage
    )
    db.session.add(profile)
    db.session.flush()  # get profile.id
    db.session.add(AssessmentResult(
        profile_id=profile.id,
        model_version=result["model"]["version"],
        score=float(result["explanation"]["factor_count"]),   # number of risk factors found
        response_json=json.dumps(result),
    ))
    return profile


def load_saved_result(profile_id: int) -> Optional[dict]:
    row = AssessmentResult.query.filter_by(profile_id=profile_id).first()
    return json.loads(row.response_json) if row else None
