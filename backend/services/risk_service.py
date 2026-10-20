"""
services/risk_service.py — Build human-readable explanations
for a risk prediction result.
"""


def build_explanation(encoded: dict, risk_level: str) -> dict:
    """
    Parameters
    ----------
    encoded    : numeric dict from encoder.encode_input()
    risk_level : "LOW" | "MEDIUM" | "HIGH"

    Returns
    -------
    dict with:
        risk_factors    : list[str]  — why the risk is what it is
        recommendations : list[str]  — what the user should do
    """
    age       = encoded.get("age", 0)
    hormonal  = encoded.get("hormonal_changes", 0)
    family    = encoded.get("family_history", 0)
    weight    = encoded.get("body_weight", 0)
    calcium   = encoded.get("calcium_intake", 0)
    vitamin_d = encoded.get("vitamin_d_intake", 0)
    activity  = encoded.get("physical_activity", 0)

    factors = []
    recs    = []

    # ── Risk factors ──────────────────────────────────────────────────────────
    if age >= 65:
        factors.append(f"Age {age} — bone density drops significantly after 65")
    elif age >= 50:
        factors.append(f"Age {age} — natural bone loss has started")

    if hormonal == 1:
        factors.append("Post-menopausal hormonal changes reduce bone-protective estrogen")

    if family == 1:
        factors.append("Family history of osteoporosis raises genetic risk")

    if weight == 1:
        factors.append("Being underweight reduces bone-protective body mass")

    if calcium == 1:
        factors.append("Low calcium intake weakens bone mineral density")
        recs.append("Increase calcium: milk, paneer, ragi, sesame seeds (til)")

    if vitamin_d == 1:
        factors.append("Insufficient vitamin D reduces calcium absorption")
        recs.append("Get 15–20 min morning sunlight; include egg yolks in diet")

    if activity == 1:
        factors.append("Sedentary lifestyle reduces bone-stimulating mechanical load")
        recs.append("Start with 30 min brisk walking daily")

    if not factors:
        factors.append("No major risk factors detected — your profile looks healthy")

    # ── Risk-level specific recommendations ───────────────────────────────────
    if risk_level == "HIGH":
        recs.append("Consult a doctor within 2 weeks to discuss bone medications")
        recs.append("Strict diet: 3 glasses milk + 100 g paneer + ragi roti daily")
        recs.append("Exercise: 20–30 min gentle walking + chair yoga daily")
    elif risk_level == "MEDIUM":
        recs.append("Get an annual bone density (DEXA) scan")
        recs.append("Diet: 2 glasses milk + curd + almonds + ragi 3×/week")
        recs.append("Exercise: brisk walk 30–45 min, 5 days/week + yoga")
    else:
        recs.append("Maintain 1000 mg calcium/day from food")
        recs.append("Stay active: walking, sports, or strength training")
        recs.append("15–20 min morning sunlight for vitamin D")

    return {"risk_factors": factors, "recommendations": recs}
