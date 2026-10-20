"""Rule-set tests: the LOW / MEDIUM / HIGH framework, never-downgrade guard, unknown handling."""
import pytest

from services import risk_screening as rs

HEALTHY = {
    "age": 29, "gender": "female", "menopause_status": "premenopausal", "height_cm": 165, "weight_kg": 60,
    "fragility_fracture": "no", "parent_hip_fracture": "no", "smoking": "no", "alcohol": "none_low",
    "physical_activity": "regular", "calcium_intake": "adequate", "vitamin_d_status": "adequate",
    "corticosteroids_long_term": "no", "rheumatoid_arthritis": "no", "dxa_result": "unknown",
}


def cat(**patch):
    return rs.predict(dict(HEALTHY, **patch))["prediction"]["category"]


def test_healthy_young_person_is_low_not_high():
    r = rs.predict(HEALTHY)
    assert r["prediction"]["category"] == "LOW"
    assert r["explanation"]["factor_count"] == 0 and r["explanation"]["answers_complete"]
    assert "not confirmation of healthy bones" in r["prediction"]["meaning"]


@pytest.mark.parametrize("patch", [
    {"smoking": "yes"}, {"alcohol": "higher"}, {"physical_activity": "inactive"},
    {"calcium_intake": "possibly_inadequate"}, {"vitamin_d_status": "deficient"},
    {"parent_hip_fracture": "yes"}, {"corticosteroids_long_term": "yes"}, {"rheumatoid_arthritis": "yes"},
    {"height_cm": 170, "weight_kg": 48}, {"age": 70}, {"dxa_result": "osteopenia"},
    {"menopause_status": "postmenopausal"},
])
def test_single_risk_factor_is_medium(patch):
    assert cat(**patch) == "MEDIUM"


def test_occasional_activity_and_normal_or_high_bmi_are_not_risk_factors():
    assert cat(physical_activity="occasional") == "LOW"
    assert cat(height_cm=160, weight_kg=90) == "LOW"        # obese is not a bone risk factor here


def test_three_factors_is_high_two_is_medium():
    assert cat(smoking="yes", alcohol="higher") == "MEDIUM"
    assert cat(smoking="yes", alcohol="higher", physical_activity="inactive") == "HIGH"


@pytest.mark.parametrize("patch", [{"fragility_fracture": "yes"}, {"dxa_result": "osteoporosis"}])
def test_fracture_or_dxa_osteoporosis_is_always_high_and_never_downgraded(patch):
    # everything else is as reassuring as possible
    r = rs.predict(dict(HEALTHY, **patch))
    assert r["prediction"]["category"] == "HIGH"
    assert r["explanation"]["strong_indicators"]


def test_unknown_answers_are_not_counted_and_are_reported():
    r = rs.predict({"age": 40, "gender": "male"})
    assert r["prediction"]["category"] == "LOW"
    assert not r["explanation"]["answers_complete"]
    fields = {u["field"] for u in r["explanation"]["unanswered"]}
    assert {"fragility_fracture", "smoking", "height_cm"} <= fields and "menopause_status" not in fields


def test_unknown_fracture_answer_is_not_treated_as_no_or_yes():
    r = rs.predict(dict(HEALTHY, fragility_fracture="unknown"))
    assert r["prediction"]["category"] == "LOW"
    assert "fragility_fracture" in {u["field"] for u in r["explanation"]["unanswered"]}


def test_male_menopause_answer_is_ignored_with_warning():
    r = rs.predict(dict(HEALTHY, gender="male", menopause_status="postmenopausal"))
    assert r["input_warnings"] and r["prediction"]["category"] == "LOW"


@pytest.mark.parametrize("h,w,expected", [(170, 50, "underweight"), (170, 65, "normal"),
                                          (170, 78, "overweight"), (170, 95, "obese")])
def test_bmi_categories(h, w, expected):
    assert rs.bmi_info(h, w)["category"] == expected


@pytest.mark.parametrize("patch,field", [
    ({"age": 12}, "age"), ({"gender": "robot"}, "gender"), ({"smoking": "maybe"}, "smoking"),
    ({"alcohol": "lots"}, "alcohol"), ({"physical_activity": "sedentary"}, "physical_activity"),
    ({"height_cm": None}, "height_cm"), ({"dxa_result": "bad"}, "dxa_result"),
])
def test_invalid_inputs_rejected(patch, field):
    with pytest.raises(rs.InputValidationError) as e:
        rs.predict(dict(HEALTHY, **patch))
    assert any(d["field"] == field for d in e.value.errors)


def test_result_has_no_score_or_probability():
    r = rs.predict(HEALTHY)
    assert "score" not in r["prediction"] and "decision_threshold" not in r["prediction"]
    assert r["prediction"]["clinically_validated"] is False
