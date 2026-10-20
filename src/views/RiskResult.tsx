import React from 'react';
import { HealthData } from '../types';
import { motion } from 'framer-motion';
import { calculateBMI } from '../utils/assessmentPayload';
import RecommendationEngine from '../components/RecommendationEngine';

interface Props {
  data: HealthData;
  onProceed: (category: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  onRetake?: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────
// Everything shown here comes from the backend response (data.assessment).
// If it is missing we say so; we never compute a substitute result in the browser.
const RiskResult: React.FC<Props> = ({ data, onProceed, onRetake }) => {
  const a = data.assessment;

  if (!a) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No result available</h2>
          <p className="text-gray-600">We don't have a model result for this assessment. Please retake the assessment.</p>
          {onRetake && (
            <button onClick={onRetake} className="mt-5 px-6 py-2 rounded-lg text-white font-bold" style={{ background: '#800000' }}>
              Retake Assessment
            </button>
          )}
        </div>
      </div>
    );
  }

  const level = a.prediction.category;                       // 'LOW' | 'MEDIUM' | 'HIGH'
  const palette = {
    LOW:    { main: '#10b981', soft: '#d1fae5', text: '#065f46', label: 'Low' },
    MEDIUM: { main: '#f59e0b', soft: '#fef3c7', text: '#92400e', label: 'Medium' },
    HIGH:   { main: '#ef4444', soft: '#fee2e2', text: '#991b1b', label: 'High' },
  } as const;
  const c = palette[level];
  const ex = a.explanation;
  const bmi = calculateBMI(data.height, data.weight);
  const bands: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['LOW', 'MEDIUM', 'HIGH'];

  const nextSteps: Record<typeof level, { title: string; items: string[] }> = {
    LOW: {
      title: 'A low result is not a clean bill of health',
      items: [
        'No major risk factors were found in the answers you gave, but this screening cannot confirm healthy bones',
        'If you have back pain, loss of height, a past fracture or other concerns, speak to a doctor',
        'Keep up bone-friendly habits: weight-bearing activity, calcium, vitamin D, no smoking',
      ],
    },
    MEDIUM: {
      title: 'Consider discussing bone health with a doctor',
      items: [
        'Share the risk factors listed above and ask whether further assessment, such as a DXA scan, is appropriate',
        'Habits you can change (activity, calcium, vitamin D, smoking, alcohol) are a good place to start',
        'Do not start or stop any medicine because of this result',
      ],
    },
    HIGH: {
      title: 'Please arrange a clinical assessment',
      items: [
        'Ask a doctor to assess your bone health and whether a bone-density (DXA) scan or FRAX assessment is appropriate',
        ex.strong_indicators.length
          ? 'A previous fragility fracture or a DXA result in the osteoporosis range should be reviewed by a clinician, whatever your other answers'
          : 'Several risk factors were found together; a clinician can judge what they mean for you',
        'Do not start or stop any medicine because of this result',
      ],
    },
  };
  const ns = nextSteps[level];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0f9ff 0%, #e8f4fd 50%, #f0fdf4 100%)' }}>

      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path d="M100 150 C100 150 45 115 45 75 C45 50 65 40 80 40 C95 40 100 50 100 50 C100 50 105 40 120 40 C135 40 155 50 155 75 C155 115 100 150 100 150"
                  fill="#fbc02d" stroke="#800000" strokeWidth="8" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-widest" style={{ color: '#800000' }}>CAREMEND</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <i className="fas fa-clipboard-check text-blue-500"></i>
            <span className="font-medium">Preliminary screening</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Banner ── */}
        <div role="note" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Experimental student project.</strong> This is a preliminary, rule-based screening built on widely
          recognised risk factors. The rules have not been clinically validated, it is not FRAX, and it is
          <strong> not a diagnosis</strong>.
        </div>

        {/* ── SECTION 1: Result ── */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: c.main }} />
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex flex-col items-center gap-4 flex-shrink-0 w-full md:w-72">
                <div className="px-8 py-4 rounded-2xl text-center w-full" style={{ backgroundColor: c.soft }}>
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: c.text }}>Screening result</div>
                  <div className="text-4xl font-black tracking-wider mt-1" style={{ color: c.main }}>{level}</div>
                </div>
                <div className="flex w-full gap-1.5" aria-hidden="true">
                  {bands.map(b => (
                    <div key={b} className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: b === level ? palette[b].main : '#e5e7eb' }} />
                  ))}
                </div>
                <div className="flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Low</span><span>Medium</span><span>High</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Your Screening Result</h1>
                <p className="text-gray-600 mb-4 leading-relaxed">{a.prediction.meaning}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{ex.reasoning}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-5">
                  <div className="bg-gray-50 rounded-xl px-5 py-3 text-center">
                    <div className="text-xl font-black text-gray-800">{ex.factor_count}</div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Risk factors found</div>
                  </div>
                  {a.bmi.value !== null && (
                    <div className="bg-gray-50 rounded-xl px-5 py-3 text-center">
                      <div className="text-xl font-black text-gray-800">{a.bmi.value}</div>
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">BMI ({a.bmi.category})</div>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl px-5 py-3 text-center">
                    <div className="text-xl font-black text-gray-800">{a.prediction.ruleset_version}</div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Rule set</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: What was found ── */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-list-check text-blue-600"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800">What this result is based on</h2>
              <p className="text-sm text-gray-500">The risk factors found in your answers</p>
            </div>
          </div>

          {ex.risk_factors.length === 0 ? (
            <p className="text-sm text-gray-600">None of the screening risk factors were found in the answers you gave.</p>
          ) : (
            <ul className="space-y-3">
              {ex.risk_factors.map(f => {
                const strong = ex.strong_indicators.some(s => s.key === f.key);
                return (
                  <li key={f.key} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ backgroundColor: strong ? palette.HIGH.soft : c.soft }}>
                      <i className={`fas ${strong ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'} text-xs`}
                         style={{ color: strong ? palette.HIGH.main : c.main }}></i>
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-bold text-gray-800">
                        {f.label}
                        {strong && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-red-600">Always gives HIGH</span>}
                      </div>
                      <p className="text-gray-600">{f.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!ex.answers_complete && (
            <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
              <div className="font-bold mb-1">Not answered, so not counted</div>
              <ul className="list-disc pl-5">
                {ex.unanswered.map(u => <li key={u.field}>{u.label}</li>)}
              </ul>
              <p className="mt-2 text-xs">These were not guessed. Your result could be higher if the answers turn out to be risk factors.</p>
            </div>
          )}

          {a.input_warnings.length > 0 && (
            <ul className="mt-4 text-sm text-amber-800 list-disc pl-5">
              {a.input_warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>

        {/* ── SECTION 3: General wellness guidance ── */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <RecommendationEngine
            riskLevel={level}
            age={parseInt(data.age) || undefined}
            bmi={bmi ?? undefined}
            hasFractureHistory={data.previousFractures === 'Yes'}
            hasLifestyleRisk={data.smoking === 'Yes' || data.alcohol.startsWith('Higher')}
          />
        </div>

        {/* ── Next steps ── */}
        <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: c.soft, backgroundColor: '#ffffff' }}>
          <div className="px-6 py-3 font-bold text-sm uppercase tracking-wide text-white" style={{ backgroundColor: c.main }}>
            {ns.title}
          </div>
          <ul className="p-6 space-y-2 text-sm text-gray-700">
            {ns.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3"><i className="fas fa-circle-check mt-0.5 text-gray-400"></i>{item}</li>
            ))}
          </ul>
        </div>

        {/* ── Limitations & disclaimer ── */}
        <details className="bg-white rounded-2xl shadow p-6">
          <summary className="cursor-pointer font-bold text-gray-800">About this screening and its limitations</summary>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-600">
            {a.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </details>

        {/* ── CTA ── */}
        <div className="flex flex-col items-center gap-4 pb-6">
          <motion.button
            onClick={() => {
              try {
                localStorage.setItem('assessmentData', JSON.stringify(data));
                localStorage.setItem('riskCategory', level);
              } catch { /* storage unavailable: continue anyway */ }
              onProceed(level);
            }}
            className="px-12 py-4 rounded-full font-black text-white text-base uppercase tracking-widest shadow-xl"
            style={{ background: 'linear-gradient(135deg, #800000 0%, #a32626 100%)', boxShadow: '0 8px 32px rgba(128,0,0,0.35)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Go to Dashboard
            <i className="fas fa-arrow-right ml-3"></i>
          </motion.button>
          <p className="text-xs text-gray-500 text-center max-w-md">{a.disclaimer}</p>
        </div>

      </main>
    </div>
  );
};

export default RiskResult;
