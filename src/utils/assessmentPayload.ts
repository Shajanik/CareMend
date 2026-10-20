/**
 * utils/assessmentPayload.ts
 * ---------------------------------------------------------------------------
 * Maps the questionnaire (HealthData) to the JSON the backend screening expects.
 *
 * The field names below MUST equal the names in backend/services/risk_screening.py
 * (served by GET /api/model/schema). backend/tests/test_frontend_contract.py compiles
 * this file and checks names and values against the backend validator.
 * Unanswered optional questions are sent as "unknown"; nothing is defaulted or invented.
 */
import { HealthData } from '../types';

export const MODEL_FIELDS = [
  'age', 'gender', 'menopause_status', 'height_cm', 'weight_kg',
  'fragility_fracture', 'parent_hip_fracture', 'smoking', 'alcohol', 'physical_activity',
  'calcium_intake', 'vitamin_d_status', 'corticosteroids_long_term', 'rheumatoid_arthritis', 'dxa_result',
] as const;

export type ModelField = typeof MODEL_FIELDS[number];

const UNKNOWN = 'unknown';
export const UNDERWEIGHT_BMI = 18.5;

export const calculateBMI = (height: string, weight: string): number | null => {
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  if (!(h > 0) || !(w > 0)) return null;
  return w / (h * h);
};

const lower = (v: string | undefined): string => (v ?? '').trim().toLowerCase();

/** 'Yes' / 'No' / 'Not sure' / '' → 'yes' | 'no' | 'unknown'. */
const yesNo = (v: string | undefined): string => {
  const x = lower(v);
  return x === 'yes' || x === 'no' ? x : UNKNOWN;
};

/** Maps a display answer to the backend token; anything not in `map` becomes 'unknown'. */
const pick = (v: string | undefined, map: Record<string, string>): string => map[lower(v)] ?? UNKNOWN;

const num = (v: string): number | string => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : UNKNOWN;
};

export interface AssessmentPayload {
  userId: number | string;
  age: number;
  gender: string;
  menopause_status: string;
  height_cm: number | string;
  weight_kg: number | string;
  fragility_fracture: string;
  parent_hip_fracture: string;
  smoking: string;
  alcohol: string;
  physical_activity: string;
  calcium_intake: string;
  vitamin_d_status: string;
  corticosteroids_long_term: string;
  rheumatoid_arthritis: string;
  dxa_result: string;
}

export const buildAssessmentPayload = (data: HealthData, userId: number | string): AssessmentPayload => {
  const gender = lower(data.gender);
  const hasBody = num(data.height) !== UNKNOWN && num(data.weight) !== UNKNOWN;
  return {
    userId,
    age: parseInt(data.age, 10),
    gender,
    menopause_status: gender === 'female'
      ? pick(data.menopauseStatus, { 'premenopausal': 'premenopausal', 'postmenopausal': 'postmenopausal', 'not sure': 'unknown' })
      : UNKNOWN,
    height_cm: hasBody ? num(data.height) : UNKNOWN,
    weight_kg: hasBody ? num(data.weight) : UNKNOWN,
    fragility_fracture: yesNo(data.previousFractures),
    parent_hip_fracture: yesNo(data.familyHistory),
    smoking: yesNo(data.smoking),
    alcohol: pick(data.alcohol, { 'none / low': 'none_low', 'higher (about 3+ drinks a day)': 'higher' }),
    physical_activity: pick(data.activityLevel, { regular: 'regular', occasional: 'occasional', inactive: 'inactive' }),
    calcium_intake: pick(data.calciumLevel, { adequate: 'adequate', 'possibly inadequate': 'possibly_inadequate', 'not sure': 'unknown' }),
    vitamin_d_status: pick(data.vitaminDLevel, { adequate: 'adequate', deficient: 'deficient', 'not sure': 'unknown' }),
    corticosteroids_long_term: yesNo(data.corticosteroids),
    rheumatoid_arthritis: yesNo(data.rheumatoidArthritis),
    dxa_result: pick(data.dxaResult, { 'normal': 'normal', 'osteopenia': 'osteopenia', 'osteoporosis': 'osteoporosis', 'no dxa scan / not sure': 'unknown' }),
  };
};

/** Friendly labels for backend field names (used to show server-side validation errors). */
export const FIELD_LABELS: Record<string, string> = {
  age: 'Age', gender: 'Sex', menopause_status: 'Menopause status', height_cm: 'Height / weight',
  weight_kg: 'Height / weight', fragility_fracture: 'Previous fracture', parent_hip_fracture: 'Parent hip fracture',
  smoking: 'Smoking', alcohol: 'Alcohol', physical_activity: 'Physical activity', calcium_intake: 'Calcium',
  vitamin_d_status: 'Vitamin D', corticosteroids_long_term: 'Corticosteroids',
  rheumatoid_arthritis: 'Rheumatoid arthritis', dxa_result: 'DXA result',
};
