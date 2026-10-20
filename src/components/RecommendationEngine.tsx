import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface RecommendationEngineProps {
  riskLevel?: RiskLevel;
  confidenceLevel?: ConfidenceLevel;
  age?: number;
  bmi?: number;
  hasFractureHistory?: boolean;
  hasLifestyleRisk?: boolean;
  className?: string;
}

// ── Static clinical data ──────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'exercise',
    icon: 'fa-person-walking',
    label: 'Movement & Exercise',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'nutrition',
    icon: 'fa-flask',
    label: 'Calcium & Vitamin D',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    id: 'lifestyle',
    icon: 'fa-shield-halved',
    label: 'Lifestyle Habits',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    id: 'sleep',
    icon: 'fa-moon',
    label: 'Sleep & Stress',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionTab: React.FC<{
  section: typeof SECTIONS[0];
  active: boolean;
  onClick: () => void;
}> = ({ section, active, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap"
    style={{
      background: active ? section.color : '#f9fafb',
      color: active ? '#fff' : '#6b7280',
      border: `1.5px solid ${active ? section.color : '#e5e7eb'}`,
    }}
  >
    <i className={`fas ${section.icon}`} style={{ fontSize: 13 }} />
    {section.label}
  </button>
);

const BulletRow: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <li className="flex items-start gap-3">
    <span
      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
    <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
  </li>
);

const AvoidRow: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-start gap-3">
    <i className="fas fa-ban text-red-400 mt-0.5 flex-shrink-0" style={{ fontSize: 13 }} />
    <span className="text-sm text-red-700 leading-relaxed">{text}</span>
  </li>
);

const ClinicalNote: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
    <i className="fas fa-stethoscope text-blue-500 mt-0.5 flex-shrink-0" style={{ fontSize: 13 }} />
    <p className="text-xs text-blue-800 leading-relaxed font-medium">{text}</p>
  </div>
);

const SubHeading: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <p
    className="text-[10px] font-black uppercase tracking-[0.18em] mb-2 mt-5 first:mt-0"
    style={{ color }}
  >
    {text}
  </p>
);

// ── Section content renderers ─────────────────────────────────────────────────
const ExerciseContent: React.FC<{ riskLevel: RiskLevel; color: string }> = ({ riskLevel, color }) => (
  <div>
    <SubHeading text="Recommended Activities" color={color} />
    <ul className="space-y-2">
      <BulletRow color={color} text="Weight-bearing aerobic exercise (walking, stair climbing): ≥30 min/day, 5 days/week" />
      <BulletRow color={color} text="Resistance training targeting major muscle groups: 2–3 sessions/week with progressive load" />
      <BulletRow color={color} text="Balance training (Tai Chi, single-leg stands, heel-to-toe walking): ≥3 days/week" />
      <BulletRow color={color} text="Postural training and spinal extension exercises to reduce kyphosis risk" />
    </ul>

    {(riskLevel === 'HIGH' || riskLevel === 'MEDIUM') && (
      <>
        <SubHeading text="Contraindications — High-Risk Individuals" color="#dc2626" />
        <ul className="space-y-2">
          <AvoidRow text="High-impact activities (running on hard surfaces, jumping, contact sports)" />
          <AvoidRow text="Deep spinal flexion exercises (sit-ups, toe-touches, forward bends)" />
          <AvoidRow text="Unsupported twisting movements of the spine" />
        </ul>
      </>
    )}

    <ClinicalNote text="Per WHO Physical Activity Guidelines 2020: adults should accumulate ≥150 min/week of moderate-intensity aerobic activity. Resistance training is independently associated with a 40–60% reduction in fall-related fracture risk." />
  </div>
);

const NutritionContent: React.FC<{ color: string }> = ({ color }) => (
  <div>
    <SubHeading text="Standardized Daily Intake Targets" color={color} />
    <div className="grid grid-cols-2 gap-3 mb-4">
      {[
        { label: 'Calcium', value: '1000–1200 mg/day', note: 'Age/sex adjusted' },
        { label: 'Vitamin D', value: '800–1000 IU/day', note: 'Endocrine Society' },
      ].map(item => (
        <div
          key={item.label}
          className="rounded-xl p-3 border"
          style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{item.label}</p>
          <p className="text-base font-black" style={{ color }}>{item.value}</p>
          <p className="text-[10px] text-gray-400 font-semibold">{item.note}</p>
        </div>
      ))}
    </div>

    <SubHeading text="Dietary Sources" color={color} />
    <ul className="space-y-2">
      <BulletRow color={color} text="Calcium: milk, curd, paneer, ragi, sesame seeds, fortified plant-based beverages" />
      <BulletRow color={color} text="Vitamin D: sunlight exposure (15–20 min on arms/legs, 10:00–14:00 hrs), fatty fish (salmon, mackerel), egg yolk" />
    </ul>

    <ClinicalNote text="Supplements should be initiated only when dietary intake is consistently insufficient. Serum 25(OH)D and urinary calcium should be assessed before supplementation in high-risk individuals (Endocrine Society Clinical Practice Guideline, 2011)." />
  </div>
);

const LifestyleContent: React.FC<{ color: string }> = ({ color }) => (
  <div>
    <SubHeading text="Risk-Modifying Behaviours" color={color} />
    <ul className="space-y-2">
      <BulletRow color={color} text="Smoking cessation: tobacco use reduces estrogen levels and impairs intestinal calcium absorption" />
      <BulletRow color={color} text="Alcohol limitation: ≤1 standard drink/day for women; ≤2 standard drinks/day for men" />
      <BulletRow color={color} text="Moderate caffeine intake: <3 cups of coffee/day; excess caffeine increases urinary calcium excretion" />
      <BulletRow color={color} text="Reduced dietary sodium: high salt intake increases renal calcium loss; target <2300 mg sodium/day" />
      <BulletRow color={color} text="Maintain healthy body weight: BMI 20–25 kg/m² provides optimal mechanical loading for bone" />
    </ul>

    <ClinicalNote text="Smoking is an independent risk factor for osteoporosis (OR 1.25–1.5). Alcohol intake >2 units/day is associated with a 20–30% increase in fracture risk. These are modifiable factors with measurable impact on bone mineral density (BMD)." />
  </div>
);

const SleepContent: React.FC<{ color: string }> = ({ color }) => (
  <div>
    <SubHeading text="Sleep Recommendations" color={color} />
    <ul className="space-y-2">
      <BulletRow color={color} text="Target 7–8 hours of uninterrupted sleep per night with a consistent sleep-wake schedule" />
      <BulletRow color={color} text="Avoid screen exposure ≥1 hour before bedtime; maintain a cool, dark sleep environment" />
    </ul>

    <SubHeading text="Stress Management" color={color} />
    <ul className="space-y-2">
      <BulletRow color={color} text="Daily mindfulness meditation or diaphragmatic breathing: 10–15 minutes/session" />
      <BulletRow color={color} text="Progressive muscle relaxation or guided imagery for cortisol regulation" />
    </ul>

    <ClinicalNote text="Chronic psychological stress elevates cortisol, which suppresses osteoblast activity and accelerates bone resorption. Sleep deprivation disrupts growth hormone secretion — a key regulator of bone remodelling. Both are independently associated with reduced BMD (Journal of Bone and Mineral Research, 2018)." />
  </div>
);

// ── Personalization banner ────────────────────────────────────────────────────
const PersonalizationBanner: React.FC<{
  riskLevel: RiskLevel;
  confidenceLevel?: ConfidenceLevel;   // omitted when the model gives no defensible confidence
  age?: number;
  bmi?: number;
  hasFractureHistory?: boolean;
  hasLifestyleRisk?: boolean;
}> = ({ riskLevel, confidenceLevel, age, bmi, hasFractureHistory, hasLifestyleRisk }) => {
  const riskColors: Record<RiskLevel, { bg: string; text: string; badge: string; badgeText: string }> = {
    LOW:    { bg: '#f0fdf4', text: '#166534', badge: '#dcfce7', badgeText: '#15803d' },
    MEDIUM: { bg: '#fffbeb', text: '#92400e', badge: '#fef3c7', badgeText: '#b45309' },
    HIGH:   { bg: '#fff1f2', text: '#9f1239', badge: '#fee2e2', badgeText: '#dc2626' },
  };
  const confColors: Record<ConfidenceLevel, string> = {
    LOW: '#6b7280', MEDIUM: '#b45309', HIGH: '#15803d',
  };
  const rc = riskColors[riskLevel];

  const factors = [
    age ? `Age: ${age} yrs` : null,
    bmi ? `BMI: ${bmi.toFixed(1)} kg/m²` : null,
    hasFractureHistory ? 'Fracture history: Yes' : null,
    hasLifestyleRisk ? 'Lifestyle risk factors: Present' : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className="rounded-2xl border p-5 mb-6"
      style={{ background: rc.bg, borderColor: rc.badge }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1">
            Recommendations based on
          </p>
          <div className="flex flex-wrap gap-2">
            {factors.length > 0
              ? factors.map(f => (
                  <span
                    key={f}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: rc.badge, color: rc.text }}
                  >
                    {f}
                  </span>
                ))
              : (
                <span className="text-xs text-gray-500 font-medium">
                  Age, BMI, fracture history, lifestyle factors
                </span>
              )
            }
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Risk level */}
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Risk</p>
            <span
              className="px-3 py-1 rounded-lg text-xs font-black"
              style={{ background: rc.badge, color: rc.text }}
            >
              {riskLevel}
            </span>
          </div>
          {/* Confidence — only shown when a defensible confidence exists (the ML demo has none) */}
          {confidenceLevel && (
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Confidence</p>
              <span
                className="px-3 py-1 rounded-lg text-xs font-black"
                style={{ background: '#f3f4f6', color: confColors[confidenceLevel] }}
              >
                {confidenceLevel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  riskLevel = 'MEDIUM',
  confidenceLevel,
  age,
  bmi,
  hasFractureHistory,
  hasLifestyleRisk,
  className = '',
}) => {
  const [activeSection, setActiveSection] = useState('exercise');
  const active = SECTIONS.find(s => s.id === activeSection)!;

  return (
    <div className={`w-full ${className}`}>

      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <i className="fas fa-notes-medical text-[#800000]" style={{ fontSize: 16 }} />
          <h2 className="text-xl font-black text-gray-900">Bone Health Optimization Plan</h2>
        </div>
        <p className="text-sm text-gray-500 font-medium">
          General bone-health lifestyle guidance. It is not personalised medical advice — please check with your doctor.
        </p>
      </div>

      {/* ── Personalization banner ── */}
      <PersonalizationBanner
        riskLevel={riskLevel}
        confidenceLevel={confidenceLevel}
        age={age}
        bmi={bmi}
        hasFractureHistory={hasFractureHistory}
        hasLifestyleRisk={hasLifestyleRisk}
      />

      {/* ── Section tabs ── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {SECTIONS.map(s => (
          <SectionTab
            key={s.id}
            section={s}
            active={activeSection === s.id}
            onClick={() => setActiveSection(s.id)}
          />
        ))}
      </div>

      {/* ── Section card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
          className="rounded-2xl border p-6"
          style={{ background: active.bg, borderColor: active.border }}
        >
          {/* Card header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: active.border }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: active.color }}
            >
              <i className={`fas ${active.icon} text-white`} style={{ fontSize: 16 }} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">{active.label}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                General guidance for your {riskLevel} result
              </p>
            </div>
          </div>

          {/* Section body */}
          {activeSection === 'exercise'   && <ExerciseContent  riskLevel={riskLevel} color={active.color} />}
          {activeSection === 'nutrition'  && <NutritionContent color={active.color} />}
          {activeSection === 'lifestyle'  && <LifestyleContent color={active.color} />}
          {activeSection === 'sleep'      && <SleepContent     color={active.color} />}
        </motion.div>
      </AnimatePresence>

      {/* ── Disclaimer ── */}
      <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <i className="fas fa-circle-info text-gray-400 mt-0.5 flex-shrink-0" style={{ fontSize: 13 }} />
        <p className="text-xs text-gray-500 leading-relaxed">
          This plan is generated for informational purposes only and does not constitute medical advice.
          Consult a qualified healthcare professional before initiating any new exercise, supplement, or dietary regimen.
        </p>
      </div>
    </div>
  );
};

export default RecommendationEngine;
