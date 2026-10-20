import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomDropdown from '../components/CustomDropdown';
import { HealthData, AssessmentResult } from '../types';
import { buildAssessmentPayload, FIELD_LABELS, calculateBMI } from '../utils/assessmentPayload';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser } from '../config/authService';

// ── API base URL ──────────────────────────────────────────────────────────────
// Production (Vercel): VITE_API_URL = https://caremend-u0ua.onrender.com
// Local dev: leave VITE_API_URL empty and the Vite proxy handles /api/...
// The trailing slash is stripped so we never produce "//api/...".
const API_BASE: string = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');

// ── Theme ─────────────────────────────────────────────────────────────────────
const M  = '#a32626';
const ML = '#fdf2f2';

interface Props {
  onShowError: (m: string) => void;
  onComplete:  (data: HealthData) => void;
}

// ── Reusable field wrapper — label on top, input below, consistent spacing ────
const Field: React.FC<{
  label: string;
  error?: boolean;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label
      className="font-black uppercase tracking-widest"
      style={{ fontSize: '0.68rem', color: error ? '#dc2626' : '#9ca3af' }}
    >
      {label}
      {error && <span className="ml-1 text-red-500">*</span>}
    </label>
    <div className={error ? 'ring-2 ring-red-400 rounded-2xl' : ''}>
      {children}
    </div>
  </div>
);

// ── Step meta ─────────────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Basic Information',    subtitle: 'Your physical profile'     },
  { title: 'Lifestyle & Nutrition', subtitle: 'Your daily habits'         },
  { title: 'Medical History',      subtitle: 'Your clinical background'  },
];

// ── Main component ────────────────────────────────────────────────────────────
const RiskAssessment: React.FC<Props> = ({ onShowError, onComplete }) => {
  const [step, setStep]   = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Server-side problem shown in the form (validation details or a failure message). Never replaced by a made-up result.
  const [serverError, setServerError] = useState<string[] | null>(null);
  const [data, setData]   = useState<HealthData>({
    age: '', gender: '', menopauseStatus: '', height: '', weight: '',
    activityLevel: '', smoking: '', alcohol: '', calciumLevel: '', vitaminDLevel: '',
    familyHistory: '', previousFractures: '', corticosteroids: '', rheumatoidArthritis: '', dxaResult: '',
  });

  const total    = STEPS.length;
  const progress = (step / total) * 100;
  const err      = (f: string) => errors.includes(f);

  const update = (k: keyof HealthData) => (v: string) => {
    setData(d => ({ ...d, [k]: v }));
    if (errors.length) setErrors([]);
    if (serverError) setServerError(null);
  };

  // Required: age, sex, and every lifestyle / medical-history question has an answer
  // ("Not sure" is allowed and is reported back, never guessed). Menopause status is asked of females only.
  // Optional: height + weight (together) and a previous DXA result.
  const validate = (s: number) => {
    const missing: string[] = [];
    if (s === 1) {
      const age = Number(data.age);
      if (!data.age || !Number.isInteger(age) || age < 18 || age > 100) missing.push('Age (18–100)');
      if (!data.gender) missing.push('Sex');
      if (data.gender === 'Female' && !data.menopauseStatus) missing.push('Menopause status');
      const hasH = data.height.trim() !== '', hasW = data.weight.trim() !== '';
      if (hasH !== hasW) missing.push('Height and weight (enter both or leave both empty)');
      if (hasH && hasW) {
        const bmi = calculateBMI(data.height, data.weight);
        if (bmi === null || bmi < 10 || bmi > 70) missing.push('Height / weight (check the values)');
      }
    } else if (s === 2) {
      if (!data.activityLevel) missing.push('Physical activity');
      if (!data.smoking)       missing.push('Smoking');
      if (!data.alcohol)       missing.push('Alcohol');
      if (!data.calciumLevel)  missing.push('Calcium intake');
      if (!data.vitaminDLevel) missing.push('Vitamin D');
    } else {
      if (!data.previousFractures)   missing.push('Previous fracture');
      if (!data.familyHistory)       missing.push('Parent hip fracture');
      if (!data.corticosteroids)     missing.push('Corticosteroids');
      if (!data.rheumatoidArthritis) missing.push('Rheumatoid arthritis');
    }
    return missing;
  };

  const handleNext = async () => {
    const missing = validate(step);
    if (missing.length) {
      setErrors(missing);
      onShowError(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    setErrors([]);

    if (step < total) {
      setStep(s => s + 1);
    } else {
      // Final step - submit to backend
      await submitAssessment();
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    setServerError(null);

    try {
      // Current user (either storage key used elsewhere in the app)
      let user = getStoredUser();
      if (!user) {
        try {
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) user = JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing currentUser from localStorage:', e);
        }
      }
      if (!user || !user.id) {
        onShowError('User not authenticated. Please log in again.');
        return;
      }

      const payload = buildAssessmentPayload(data, user.id);

      // Full backend URL in production; relative URL in local dev (Vite proxy).
      const url = `${API_BASE}/api/assessment/submit`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // Network failure: report it. No locally-invented result is ever shown.
        console.error('Assessment request failed:', url, e);
        setServerError(['Could not reach the server. It may be waking up, so please wait a moment and try again.']);
        return;
      }

      let body: any = null;
      try { body = await response.json(); } catch { /* non-JSON error body */ }

      if (response.status === 400 && Array.isArray(body?.details)) {
        setServerError(body.details.map((d: { field: string; message: string }) =>
          `${FIELD_LABELS[d.field] ?? d.field}: ${d.message}`));
        return;
      }
      if (!response.ok || !body?.prediction) {
        setServerError([body?.error || `The server could not complete your assessment (error ${response.status}). Please try again.`]);
        return;
      }

      const result = body as AssessmentResult;
      onComplete({
        ...data,
        riskLevel: result.prediction.category,
        riskFactors: result.explanation.risk_factors.map(f => f.label),
        recommendations: [],
        assessment: result,
      });
    } catch (error) {
      console.error('Assessment submission error:', error);
      setServerError(['Something went wrong while submitting your assessment. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => { setErrors([]); setStep(s => s - 1); };

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ background: '#F8F9FA' }}
    >

      {/* ── NAV ── */}
      <motion.nav
        className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-xl font-black tracking-widest" style={{ color: M }}>CAREMEND</span>

        {/* Step dots */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wider" style={{ color: M }}>
            Step {step} of {total}
          </span>
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i + 1 === step ? 24 : 10,
                  height:     10,
                  background: i + 1 <= step ? M : '#d1d5db',
                }}
              />
            ))}
          </div>
        </div>
      </motion.nav>

      {/* ── PROGRESS BAR ── */}
      <div className="w-full h-1 bg-gray-200">
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${M} 0%, #800000 100%)` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* ── CENTERED CONTENT ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">

        {/* ── CARD — fixed width, white bg, soft shadow ── */}
        <motion.div
          key={step}
          className="w-full bg-white rounded-3xl flex flex-col overflow-hidden"
          style={{
            maxWidth: 520,           // consistent across all steps
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >

          {/* ── Card header ── */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 text-center">
            {/* Step badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: ML, color: M }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[10px]"
                style={{ background: M }}
              >
                {step}
              </span>
              Step {step} of {total}
            </div>

            <h2
              className="font-black uppercase tracking-tight leading-tight"
              style={{ fontSize: '1.6rem', color: M }}
            >
              {STEPS[step - 1].title}
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              {STEPS[step - 1].subtitle}
            </p>
          </div>

          {/* ── Form fields — scrollable if needed ── */}
          <div className="px-8 py-6 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '55vh' }}>

            {/* Validation error banner */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-red-700 text-sm font-bold mb-1">
                    <i className="fas fa-exclamation-triangle text-xs" />
                    Please complete:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {errors.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Server / network error (retry by pressing the button again) */}
            {serverError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-red-700 text-sm font-bold mb-1">We could not get your result</div>
                <ul className="text-red-700 text-xs list-disc pl-4 space-y-0.5">
                  {serverError.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}

            {/* ── STEP 1: Basic Information ── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Age" error={err('Age (18–100)')}>
                      <CustomInput placeholder="e.g. 45" value={data.age} onChange={update('age')} />
                    </Field>
                    <Field label="Sex" error={err('Sex')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.gender}
                        options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]}
                        onChange={update('gender')}
                      />
                    </Field>
                  </div>

                  {data.gender === 'Female' && (
                    <Field label="Menopause status" error={err('Menopause status')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.menopauseStatus}
                        options={[
                          { label: 'Not yet (still having periods)', value: 'Premenopausal' },
                          { label: 'Yes (periods have stopped)',      value: 'Postmenopausal' },
                          { label: 'Not sure',                        value: 'Not sure' },
                        ]}
                        onChange={update('menopauseStatus')}
                      />
                    </Field>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Height (cm) — optional" error={err('Height and weight (enter both or leave both empty)') || err('Height / weight (check the values)')}>
                      <CustomInput placeholder="e.g. 165" value={data.height} onChange={update('height')} />
                    </Field>
                    <Field label="Weight (kg) — optional" error={err('Height and weight (enter both or leave both empty)') || err('Height / weight (check the values)')}>
                      <CustomInput placeholder="e.g. 60" value={data.weight} onChange={update('weight')} />
                    </Field>
                  </div>
                  <p className="text-xs text-gray-400">Height and weight are used to work out your BMI. Skipping them is fine; it just won't be counted.</p>
                </motion.div>
              )}

              {/* ── STEP 2: Lifestyle & Nutrition ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  <Field label="Physical activity" error={err('Physical activity')}>
                    <CustomDropdown
                      placeholder="Select"
                      value={data.activityLevel}
                      options={[
                        { label: 'Regular (weight-bearing exercise most days)', value: 'Regular' },
                        { label: 'Occasional',                                  value: 'Occasional' },
                        { label: 'Inactive',                                    value: 'Inactive' },
                      ]}
                      onChange={update('activityLevel')}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Current smoker" error={err('Smoking')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.smoking}
                        options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                        onChange={update('smoking')}
                      />
                    </Field>
                    <Field label="Alcohol" error={err('Alcohol')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.alcohol}
                        options={[
                          { label: 'None or low',              value: 'None / low' },
                          { label: 'About 3+ drinks a day',    value: 'Higher (about 3+ drinks a day)' },
                        ]}
                        onChange={update('alcohol')}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Calcium intake" error={err('Calcium intake')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.calciumLevel}
                        options={[
                          { label: 'Adequate',            value: 'Adequate' },
                          { label: 'Possibly inadequate', value: 'Possibly inadequate' },
                          { label: 'Not sure',            value: 'Not sure' },
                        ]}
                        onChange={update('calciumLevel')}
                      />
                    </Field>
                    <Field label="Vitamin D" error={err('Vitamin D')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.vitaminDLevel}
                        options={[
                          { label: 'Adequate',  value: 'Adequate' },
                          { label: 'Deficient', value: 'Deficient' },
                          { label: 'Not sure',  value: 'Not sure' },
                        ]}
                        onChange={update('vitaminDLevel')}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-gray-400">
                    Choose “Not sure” if you don't know. Those answers are not guessed or counted, and the result page will list them.
                  </p>
                </motion.div>
              )}

              {/* ── STEP 3: Medical History ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  <Field label="Broken a bone from a minor fall or knock? (fragility fracture)" error={err('Previous fracture')}>
                    <CustomDropdown
                      placeholder="Select"
                      value={data.previousFractures}
                      options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }, { label: 'Not sure', value: 'Not sure' }]}
                      onChange={update('previousFractures')}
                    />
                  </Field>
                  <Field label="Did a parent break their hip?" error={err('Parent hip fracture')}>
                    <CustomDropdown
                      placeholder="Select"
                      value={data.familyHistory}
                      options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }, { label: 'Not sure', value: 'Not sure' }]}
                      onChange={update('familyHistory')}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Steroid tablets for 3+ months?" error={err('Corticosteroids')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.corticosteroids}
                        options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }, { label: 'Not sure', value: 'Not sure' }]}
                        onChange={update('corticosteroids')}
                      />
                    </Field>
                    <Field label="Rheumatoid arthritis?" error={err('Rheumatoid arthritis')}>
                      <CustomDropdown
                        placeholder="Select"
                        value={data.rheumatoidArthritis}
                        options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }, { label: 'Not sure', value: 'Not sure' }]}
                        onChange={update('rheumatoidArthritis')}
                      />
                    </Field>
                  </div>
                  <Field label="Previous bone-density (DXA) result — optional">
                    <CustomDropdown
                      placeholder="Select if you have had one"
                      value={data.dxaResult}
                      options={[
                        { label: 'Normal (T-score −1.0 or higher)',     value: 'Normal' },
                        { label: 'Osteopenia (−1.0 to −2.5)',           value: 'Osteopenia' },
                        { label: 'Osteoporosis (−2.5 or lower)',        value: 'Osteoporosis' },
                        { label: 'No DXA scan / not sure',              value: 'No DXA scan / not sure' },
                      ]}
                      onChange={update('dxaResult')}
                    />
                  </Field>

                  <p className="text-xs text-gray-400">
                    CareMend is an experimental student project. This is a preliminary rule-based screening based on
                    recognised risk factors. It is not a diagnosis and has not been clinically validated.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer — Back + Next/Submit ── */}
          <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
            {step > 1 ? (
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl font-bold uppercase text-sm border-2 transition-all"
                style={{ borderColor: M, color: M }}
              >
                <i className="fas fa-arrow-left mr-2 text-xs" />
                Back
              </motion.button>
            ) : (
              <div />
            )}

            <motion.button
              onClick={handleNext}
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.04, boxShadow: '0 8px 24px rgba(163,38,38,0.4)' } : {}}
              whileTap={!submitting ? { scale: 0.97 } : {}}
              className={`px-8 py-3 rounded-xl font-bold uppercase text-sm text-white ml-auto ${
                submitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${M} 0%, #800000 100%)`,
                boxShadow: '0 4px 16px rgba(163,38,38,0.3)',
                letterSpacing: '0.08em',
              }}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2 text-xs" />
                  Analysing...
                </>
              ) : step === total ? (
                <><i className="fas fa-calculator mr-2 text-xs" />{serverError ? 'Try Again' : 'Get Result'}</>
              ) : (
                <>Next Step <i className="fas fa-arrow-right ml-2 text-xs" /></>
              )}
            </motion.button>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default RiskAssessment;
