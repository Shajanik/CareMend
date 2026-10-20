"""
Frontend <-> backend contract + end-to-end assessment test.

Compiles the REAL src/utils/assessmentPayload.ts with esbuild, runs it under node for every
answer option (and a seeded random sample of combinations) found in src/views/RiskAssessment.tsx, and sends the produced
payloads to the real backend validator / API. Skipped (not failed) if node_modules is absent
(run `npm install` in the repo root first).
"""
import itertools
import json
import os
import re
import shutil
import subprocess

import pytest

from conftest import BACKEND
from services import risk_screening as rs

ROOT = os.path.dirname(BACKEND)
ESBUILD = os.path.join(ROOT, "node_modules", ".bin", "esbuild")
TSX = os.path.join(ROOT, "src", "views", "RiskAssessment.tsx")
TYPES = os.path.join(ROOT, "src", "types.ts")
PAYLOAD_TS = os.path.join(ROOT, "src", "utils", "assessmentPayload.ts")

needs_node = pytest.mark.skipif(not (os.path.exists(ESBUILD) and shutil.which("node")),
                                reason="node/esbuild not installed (run npm install)")

# questionnaire field (HealthData key) the form asks for
QUESTIONNAIRE_FIELDS = {"age", "gender", "menopauseStatus", "height", "weight", "activityLevel", "smoking",
                        "alcohol", "calciumLevel", "vitaminDLevel", "familyHistory", "previousFractures",
                        "corticosteroids", "rheumatoidArthritis", "dxaResult"}


def _tsx():
    return open(TSX).read()


def _dropdown_options():
    """{HealthData key: [option values]} parsed from every <CustomDropdown> in the questionnaire."""
    out = {}
    for key, body in re.findall(r"value=\{data\.(\w+)\}\s*options=\{\[(.*?)\]\}", _tsx(), re.S):
        out[key] = re.findall(r"value:\s*'([^']*)'", body)
    return out


def test_questionnaire_asks_exactly_the_fields_the_screening_uses():
    asked = set(re.findall(r"update\('(\w+)'\)", _tsx()))
    assert asked == QUESTIONNAIRE_FIELDS, f"questionnaire mismatch: {asked ^ QUESTIONNAIRE_FIELDS}"


def test_every_backend_feature_is_covered_by_the_frontend_field_list():
    src = open(PAYLOAD_TS).read()
    for name in rs.FEATURE_NAMES:
        assert f"'{name}'" in src, name


def test_dropdown_values_are_parseable():
    d = _dropdown_options()
    assert set(d) == {"gender", "menopauseStatus", "activityLevel", "smoking", "alcohol", "calciumLevel",
                      "vitaminDLevel", "familyHistory", "previousFractures", "corticosteroids",
                      "rheumatoidArthritis", "dxaResult"}, d


@pytest.fixture(scope="module")
def built_payloads(tmp_path_factory):
    if not (os.path.exists(ESBUILD) and shutil.which("node")):
        pytest.skip("node/esbuild not installed")
    tmp = tmp_path_factory.mktemp("fe")
    mod = tmp / "payload.mjs"
    subprocess.run([ESBUILD, PAYLOAD_TS, "--bundle", "--format=esm", f"--outfile={mod}"],
                   check=True, capture_output=True, cwd=ROOT)
    import random
    opts = _dropdown_options()
    keys = list(opts)
    base = {k: opts[k][0] for k in keys}
    combos = []
    bodies = [("", ""), ("160", "40"), ("170", "70"), ("160", "90")]
    for k in keys:                                   # every single answer option at least once
        for v in opts[k]:
            for hw in bodies:
                combos.append({**base, k: v, "age": "62", "height": hw[0], "weight": hw[1]})
    rng = random.Random(7)                           # plus a seeded random sample of full combinations
    for _ in range(200):
        combos.append({**{k: rng.choice(opts[k]) for k in keys}, "age": "62", **dict(zip(("height", "weight"), rng.choice(bodies)))})
    runner = tmp / "run.mjs"
    runner.write_text(
        "import {buildAssessmentPayload, MODEL_FIELDS} from './payload.mjs';\n"
        "import fs from 'fs';\n"
        "const combos = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));\n"
        "console.log(JSON.stringify({fields: MODEL_FIELDS, payloads: combos.map(c => buildAssessmentPayload(c, 7))}));\n")
    (tmp / "combos.json").write_text(json.dumps(combos))
    res = subprocess.run(["node", str(runner), str(tmp / "combos.json")], check=True, capture_output=True, text=True)
    return json.loads(res.stdout), combos


@needs_node
def test_frontend_field_names_equal_backend_feature_names(built_payloads):
    out, _ = built_payloads
    assert sorted(out["fields"]) == sorted(rs.FEATURE_NAMES)
    for p in out["payloads"][:5]:
        assert set(p) == set(rs.FEATURE_NAMES) | {"userId"}


@needs_node
def test_every_answer_combination_is_accepted_by_backend_validation(built_payloads):
    out, combos = built_payloads
    assert len(out["payloads"]) > 100
    for p, c in zip(out["payloads"], combos):
        clean, _ = rs.validate_input(p)                  # raises if names/types/values mismatch
        assert clean["age"] == 62
        if c["height"] == "":                            # blank height/weight must stay unknown (no made-up BMI)
            assert clean["height_cm"] is None and clean["weight_kg"] is None
        if c["calciumLevel"] == "Not sure":
            assert clean["calcium_intake"] is None
        if c["gender"] == "Male":
            assert clean["menopause_status"] is None


@needs_node
def test_answer_mapping_and_bmi(built_payloads):
    out, combos = built_payloads
    for p, c in zip(out["payloads"], combos):
        r = rs.predict(p)
        if (c["height"], c["weight"]) == ("160", "40"):
            assert r["bmi"]["category"] == "underweight"       # BMI 15.6
        if (c["height"], c["weight"]) == ("170", "70"):
            assert r["bmi"]["category"] == "normal"            # BMI 24.2
        if c["previousFractures"] == "Yes":
            assert r["prediction"]["category"] == "HIGH"       # never downgraded by other answers
        if c["dxaResult"] == "Osteoporosis":
            assert r["prediction"]["category"] == "HIGH"
        if c["activityLevel"] == "Inactive":
            assert p["physical_activity"] == "inactive"


@needs_node
def test_end_to_end_assessment_flow_matches_frontend_types(client, user_id, built_payloads):
    """Frontend payload -> real endpoint -> response contains every key the TS AssessmentResult type declares."""
    out, combos = built_payloads
    ts = open(TYPES).read()
    iface = ts[ts.index("export interface AssessmentResult"):ts.index("export interface HealthData")]
    top_keys = re.findall(r"^  (\w+)\??:", iface, re.M)
    assert {"prediction", "explanation", "bmi", "disclaimer", "limitations"} <= set(top_keys)
    for p in out["payloads"][:: max(1, len(out["payloads"]) // 12)]:
        r = client.post("/api/assessment/submit", data=json.dumps({**p, "userId": user_id}), content_type="application/json")
        assert r.status_code == 200, r.get_json()
        j = r.get_json()
        assert set(top_keys) <= set(j), set(top_keys) - set(j)
        pred_keys = set(re.findall(r"^    (\w+)\??:", iface[iface.index("prediction:"):iface.index("explanation:")], re.M))
        assert pred_keys <= set(j["prediction"])
        expl_keys = set(re.findall(r"^    (\w+)\??:", iface[iface.index("explanation:"):iface.index("bmi:")], re.M))
        assert expl_keys <= set(j["explanation"]), expl_keys - set(j["explanation"])


def test_result_page_has_no_local_scoring_and_no_percent_claims():
    src = open(os.path.join(ROOT, "src", "views", "RiskResult.tsx")).read()
    assert "riskEngine" not in src and "RiskAssessmentEngine" not in src
    assert "prediction.score" not in src and "decision_threshold" not in src
    assert not os.path.exists(os.path.join(ROOT, "src", "utils", "riskEngine.ts"))
    assert "generateMockRiskAssessment" not in _tsx()          # no invented fallback result in the questionnaire
