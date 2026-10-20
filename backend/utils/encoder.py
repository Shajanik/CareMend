"""
utils/encoder.py — Encode raw string inputs into numeric values
that match the training data encoding used in ml/train_model.py.
"""

ENCODE_MAP = {
    "gender":            {"male": 0, "female": 1},
    "hormonal_changes":  {"normal": 0, "postmenopausal": 1},
    "family_history":    {"no": 0, "yes": 1},
    "body_weight":       {"normal": 0, "underweight": 1},
    "calcium_intake":    {"adequate": 0, "low": 1},
    "vitamin_d_intake":  {"sufficient": 0, "insufficient": 1},
    "physical_activity": {"active": 0, "sedentary": 1},
}


def encode_input(raw: dict) -> dict:
    """
    Convert a dict of raw string values to numeric values.
    Returns a new dict with the same keys but integer values.
    Raises ValueError if an unknown value is encountered.
    """
    encoded = {"age": int(raw["age"])}

    for field, mapping in ENCODE_MAP.items():
        raw_val = str(raw.get(field, "")).lower().strip()
        if raw_val not in mapping:
            raise ValueError(
                f"Invalid value '{raw_val}' for field '{field}'. "
                f"Allowed: {list(mapping.keys())}"
            )
        encoded[field] = mapping[raw_val]

    return encoded
