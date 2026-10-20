
export interface UserDetails {
  fullName: string;
  mobile: string;
  dob: string;
  gender: string;
  country: string;
  city: string;
  email: string;
}

export interface UserAccount extends UserDetails {
  id?: number | string;
  username: string;
  password: string;
  assessmentCompleted?: boolean;
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH';
  healthData?: HealthData;
}

/** One risk factor / strong indicator returned by the rule-based screening. */
export interface RiskFactorItem {
  key: string;
  label: string;
  detail: string;
}

/** Structured response of POST /api/assessment/submit (everything shown on the result page comes from here). */
export interface AssessmentResult {
  success: boolean;
  profileId: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  prediction: {
    category: 'LOW' | 'MEDIUM' | 'HIGH';
    meaning: string;
    method: 'rule_based';
    ruleset_version: string;
    clinically_validated: boolean;
  };
  explanation: {
    reasoning: string;
    strong_indicators: RiskFactorItem[];
    risk_factors: RiskFactorItem[];          // strong indicators + counted factors
    factor_count: number;
    high_factor_threshold: number;
    unanswered: { field: string; label: string }[];
    answers_complete: boolean;
  };
  bmi: { value: number | null; category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown' };
  input_warnings: string[];
  inputs_used: Record<string, string | number | null>;
  model: { version: string; type: string; status: string };
  limitations: string[];
  disclaimer: string;
}

export interface HealthData {
  // ── collected by the questionnaire ──
  age: string;
  gender: string;               // 'Male' | 'Female'
  menopauseStatus: string;      // 'Premenopausal' | 'Postmenopausal' | 'Not sure' (females only)
  height: string;               // optional (cm)
  weight: string;               // optional (kg)
  activityLevel: string;        // 'Regular' | 'Occasional' | 'Inactive'
  smoking: string;              // 'Yes' | 'No'
  alcohol: string;              // 'None / low' | 'Higher (about 3+ drinks a day)'
  calciumLevel: string;         // 'Adequate' | 'Possibly inadequate' | 'Not sure'
  vitaminDLevel: string;        // 'Adequate' | 'Deficient' | 'Not sure'
  familyHistory: string;        // parent had a hip fracture: 'Yes' | 'No' | 'Not sure'
  previousFractures: string;    // fragility fracture: 'Yes' | 'No' | 'Not sure'
  corticosteroids: string;      // long-term steroid tablets: 'Yes' | 'No' | 'Not sure'
  rheumatoidArthritis: string;  // 'Yes' | 'No' | 'Not sure'
  dxaResult: string;            // 'Normal' | 'Osteopenia' | 'Osteoporosis' | 'No DXA scan / not sure'
  // ── older stored data (no longer collected) ──
  sunExposure?: string;
  medications?: string;
  balanceIssues?: string;
  // ── results copied from the backend response ──
  riskLevel?: string;      // 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors?: string[];
  recommendations?: string[];
  assessment?: AssessmentResult;
}

export interface Doctor {
  id: string;
  name: string;
  location: string;
  hospital: string;
  specialist: string;
  experience: string;
  disease: 'Osteoporosis';
  distance?: string;
  rating?: number;
  timings?: string;
  phone?: string;
}

export type AuthStage = 
  | 'SPLASH' 
  | 'CHOICE' 
  | 'LOGIN' 
  | 'SIGNUP_DETAILS' 
  | 'SIGNUP_CREDENTIALS' 
  | 'RESET_STEP_1' 
  | 'RESET_STEP_2' 
  | 'RESET_PASSWORD' 
  | 'SUCCESS'
  | 'RISK_INTRO'
  | 'RISK_ASSESSMENT'
  | 'RISK_RESULT'
  | 'DASHBOARD'
  | 'PROFILE'
  | 'HOME'
  | 'ABOUT'
  | 'DOC_CONNECT_DISEASE'
  | 'DOC_CONNECT_LIST'
  | 'DOC_CONNECT_DETAIL'
  | 'DOC_CONNECT_CALENDAR'
  | 'COMMUNITY_SELECT'
  | 'COMMUNITY_FORUM'
  | 'QUERY_CHATBOX'
  | 'SELFCARE_TOOLS'
  | 'MEDITATION'
  | 'HIGHLY_RECOMMENDED'
  | 'SMART_EXERCISE'
  | 'NUTRITION_PLAN'
  | 'WALKING'
  | 'EXERCISE_COACH'
  | 'CARECONNECT'
  | 'CARECONNECT_BOOKING'
  | 'CONTACT';
