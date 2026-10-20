import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const M  = '#800000';
const MD = '#5a0000';
const ML = '#fdf0f0';

interface Props {
  onBack:            () => void;
  onStartAssessment: () => void;
  onHome:            () => void;
}

// ── Fade-up animation wrapper ─────────────────────────────────────────────────
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.55, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter: React.FC<{ target: string; label: string }> = ({ target, label }) => {
  const ref  = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    const suffix = target.replace(/[0-9.]/g, '');
    let start = 0;
    const steps = 40;
    const inc = num / steps;
    let count = 0;
    const t = setInterval(() => {
      count++;
      start += inc;
      setDisplay((count >= steps ? num : Math.floor(start)) + suffix);
      if (count >= steps) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [inView, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black mb-1" style={{ color: M }}>{display}</div>
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
};

// ── Animated progress bar ─────────────────────────────────────────────────────
const ProgressBar: React.FC<{ label: string; pct: number; delay?: number }> = ({ label, pct, delay = 0 }) => {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="mb-5">
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span className="text-sm font-black" style={{ color: M }}>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${M}, ${MD})` }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'fa-chart-line',     title: 'Risk Assessment',    desc: 'Transparent, rule-based screening built on recognised osteoporosis risk factors. Preliminary and not clinically validated.' },
  { icon: 'fa-person-walking', title: 'Exercise Plans',     desc: 'Evidence-based weight-bearing and resistance exercises tailored to individual risk profiles.' },
  { icon: 'fa-bowl-food',      title: 'Nutrition Guidance', desc: 'Calcium and vitamin D recommendations based on established dietary guidelines.' },
  { icon: 'fa-spa',            title: 'Wellness Support',   desc: 'Stress management and lifestyle recommendations to support overall bone health.' },
  { icon: 'fa-user-md',        title: 'Health Tracking',    desc: 'Personal health dashboard to monitor progress and track wellness goals over time.' },
];

const TECH = [
  { icon: 'fa-react',         label: 'Frontend',  value: 'React + TypeScript', color: '#61dafb' },
  { icon: 'fa-python',        label: 'Backend',   value: 'Flask (Python)',     color: '#3776ab' },
  { icon: 'fa-brain',         label: 'Method',  value: 'Rule-based screening',color: '#f59e0b' },
  { icon: 'fa-database',      label: 'Database',  value: 'SQLite / SQLAlchemy',color: '#10b981' },
  { icon: 'fa-shield-halved', label: 'Auth',      value: 'JWT Tokens',         color: '#8b5cf6' },
  { icon: 'fa-palette',       label: 'Styling',   value: 'Tailwind CSS',       color: '#06b6d4' },
];

const PIPELINE = [
  {
    step: '01', icon: 'fa-clipboard-list', title: 'Health Assessment',
    items: ['Age & lifestyle factors', 'Medical history review', 'Dietary habits analysis', 'Risk factor evaluation'],
    highlight: false,
  },
  {
    step: '02', icon: 'fa-brain', title: 'AI Risk Analysis',
    items: ['Recognised risk-factor questionnaire', 'Transparent Low / Medium / High rules', 'Strong indicators never downgraded', 'Unanswered questions reported, not guessed'],
    highlight: true,
  },
  {
    step: '03', icon: 'fa-list-check', title: 'Personalized Plan',
    items: ['Exercise recommendations', 'Nutrition guidance', 'Lifestyle modifications', 'Progress tracking tools'],
    highlight: false,
  },
];

const VALUES = [
  { icon: 'fa-heart-pulse', title: 'Patient-Focused',     desc: "Design decisions prioritise clarity, accessibility, and practical health awareness." },
  { icon: 'fa-flask',       title: 'Evidence-Inspired',   desc: 'Risk logic is inspired by commonly recognised osteoporosis risk factors and preventive healthcare practices.' },
  { icon: 'fa-lock',        title: 'Privacy-Conscious',   desc: 'User health information should remain secure and handled responsibly.' },
];

const AboutPage: React.FC<Props> = ({ onBack, onStartAssessment, onHome }) => {
  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onHome} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: M }}>
              <i className="fas fa-bone text-white text-xs" />
            </div>
            <span className="text-xl font-black tracking-widest" style={{ color: M }}>CAREMEND</span>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={onHome}
              className="hidden md:block text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </button>
            <button onClick={onStartAssessment}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background: M, boxShadow: `0 4px 14px rgba(128,0,0,0.3)` }}>
              Start Assessment
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO — split layout like reference
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${ML} 0%, #fff 55%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: M, transform: 'translate(30%,-30%)' }} />
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <FadeUp>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
                style={{ background: ML, color: M }}>
                <i className="fas fa-info-circle text-[10px]" /> About CareMend
              </span>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h1 className="font-black leading-tight tracking-tight mb-5"
                style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', color: '#1a1a1a' }}>
                Your Health<br />
                <span style={{ color: M }}>Is Our Priority</span>
              </h1>
            </FadeUp>
            <FadeUp delay={0.16}>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
                CareMend is a preventive healthcare-focused osteoporosis awareness platform designed to help users better understand lifestyle and clinical factors related to bone health.
              </p>
            </FadeUp>
            <FadeUp delay={0.22}>
              <div className="flex flex-wrap gap-4">
                <button onClick={onStartAssessment}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: M, boxShadow: `0 8px 28px rgba(128,0,0,0.35)` }}>
                  <i className="fas fa-play text-xs" /> Start Free Assessment
                </button>
                <button onClick={onHome}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-sm border-2 transition-all hover:bg-gray-50"
                  style={{ borderColor: M, color: M }}>
                  Back to Home <i className="fas fa-arrow-right text-xs" />
                </button>
              </div>
            </FadeUp>
          </div>

          {/* Right — stat cards grid */}
          <FadeUp delay={0.2}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '200M+', label: 'People affected globally',  icon: 'fa-globe' },
                { val: '1in3',  label: 'Women over 50 at risk',     icon: 'fa-person-dress' },
                { val: '80%',   label: 'Cases go undiagnosed',      icon: 'fa-triangle-exclamation' },
                { val: '5min',  label: 'Quick assessment time',     icon: 'fa-clock' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform"
                  style={{ background: i % 2 === 0 ? ML : '#fff', border: '1px solid #f0e0e0',
                    boxShadow: '0 4px 16px rgba(128,0,0,0.06)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: i % 2 === 0 ? '#fff' : ML }}>
                    <i className={`fas ${s.icon} text-base`} style={{ color: M }} />
                  </div>
                  <div className="text-2xl font-black mb-1" style={{ color: M }}>{s.val}</div>
                  <div className="text-xs text-gray-500 font-semibold leading-tight">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OVERVIEW — split with progress bars
          (mirrors reference "We Are Achieve" section)
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — visual panel */}
          <FadeUp>
            <div className="relative rounded-3xl overflow-hidden p-10 flex flex-col justify-between min-h-[360px]"
              style={{ background: `linear-gradient(135deg, ${M} 0%, ${MD} 100%)`,
                boxShadow: `0 24px 64px rgba(128,0,0,0.35)` }}>
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
                style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
                style={{ background: 'white', transform: 'translate(-30%,30%)' }} />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <i className="fas fa-bone text-white text-2xl" />
                </div>
                <h3 className="text-white text-2xl font-black mb-3">Understanding Osteoporosis Risk</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Osteoporosis affects millions worldwide, yet many cases remain undiagnosed until fractures occur. Early assessment and prevention are key.
                </p>
              </div>

              {/* Stat row at bottom */}
              <div className="relative z-10 flex gap-8 mt-8 pt-6 border-t border-white/20">
                {[
                  { val: 'AI', label: 'Powered' },
                  { val: '15+',  label: 'Risk Factors' },
                  { val: 'Free',  label: 'Assessment' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl font-black text-white">{s.val}</div>
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Right — progress bars */}
          <FadeUp delay={0.2}>
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                style={{ background: ML, color: M }}>Our Approach</span>
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                Our Mission:<br />Preventive Bone Health Awareness
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                The platform uses a transparent, rule-based risk-factor screening (not yet clinically validated) to provide educational risk insights and personalised wellness guidance focused on early awareness, lifestyle improvement, habit tracking, and preventive healthcare education.
              </p>
              <ProgressBar label="Assessment Completion Rate"   pct={92} delay={0.1} />
              <ProgressBar label="User Engagement"              pct={88} delay={0.2} />
              <ProgressBar label="Educational Content Quality"  pct={85} delay={0.3} />
              <ProgressBar label="Platform Usability"          pct={90} delay={0.4} />
              <div className="mt-6">
                <button onClick={onStartAssessment}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-black text-white text-sm transition-all hover:opacity-90"
                  style={{ background: M, boxShadow: `0 6px 20px rgba(128,0,0,0.3)` }}>
                  Learn More <i className="fas fa-arrow-right text-xs" />
                </button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — 3-step pipeline
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Under the Hood</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">How CareMend Works</h2>
            <p className="text-gray-500 max-w-lg mx-auto">AI-powered assessment combined with personalized health recommendations.</p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {PIPELINE.map((s, i) => (
              <FadeUp key={s.step} delay={i * 0.15}>
                <div className="rounded-2xl p-6 h-full transition-all hover:-translate-y-1"
                  style={{
                    background: s.highlight ? `linear-gradient(135deg, ${M}, ${MD})` : '#fff',
                    border: s.highlight ? 'none' : '1px solid #f0f0f0',
                    boxShadow: s.highlight ? `0 16px 40px rgba(128,0,0,0.35)` : '0 4px 16px rgba(0,0,0,0.04)',
                  }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: s.highlight ? 'rgba(255,255,255,0.2)' : ML }}>
                      <i className={`fas ${s.icon} text-base`} style={{ color: s.highlight ? '#fff' : M }} />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: s.highlight ? 'rgba(255,255,255,0.55)' : '#9ca3af' }}>Step {s.step}</div>
                      <div className="font-black text-sm" style={{ color: s.highlight ? '#fff' : '#111' }}>{s.title}</div>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {s.items.map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm"
                        style={{ color: s.highlight ? 'rgba(255,255,255,0.82)' : '#6b7280' }}>
                        <i className="fas fa-check-circle text-[11px]"
                          style={{ color: s.highlight ? 'rgba(255,255,255,0.55)' : M }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Formula callout */}
          <FadeUp delay={0.5}>
            <div className="rounded-2xl p-6 border-2 text-center max-w-lg mx-auto"
              style={{ borderColor: `${M}25`, background: ML }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: M }}>
                Assessment Method
              </p>
              <p className="text-xl font-black text-gray-800">
                Screening result generated using <span style={{ color: M }}>transparent risk-factor rules</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Combines established medical criteria with AI analysis for comprehensive risk evaluation
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — 5 cards (like "Easy step" section)
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Capabilities</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Core Features</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Comprehensive tools for osteoporosis risk assessment and health management.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.08}>
                <div className="group flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-transparent hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                    style={{ background: ML }}>
                    <i className={`fas ${f.icon} text-lg`} style={{ color: M }} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TECH STACK — 6 cards
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Built With</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Technology Stack</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Modern, reliable technologies chosen for performance and developer experience.
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH.map((t, i) => (
              <FadeUp key={t.label} delay={i * 0.07}>
                <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${t.color}18` }}>
                    <i className={`fab ${t.icon} text-xl`} style={{ color: t.color }} />
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t.label}</div>
                  <div className="text-xs font-black text-gray-800 leading-tight">{t.value}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COUNTERS STRIP — maroon bg
      ══════════════════════════════════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${M}, ${MD})` }}>
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { target: '15+', label: 'Risk Factors Analyzed' },
            { target: '3',   label: 'Assessment Steps' },
            { target: '5min',  label: 'Average Completion' },
            { target: 'Free',  label: 'Always Available' },
          ].map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.1}>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">{s.target}</div>
                <div className="text-xs text-white/60 font-semibold uppercase tracking-wide">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROJECT CONTEXT — new section for student project
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>About CareMend</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Educational Wellness Platform</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              A comprehensive healthcare awareness project focused on osteoporosis prevention.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Platform Focus</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  CareMend focuses on early awareness, lifestyle improvement, habit tracking, and preventive healthcare education. 
                  The platform uses a transparent, rule-based risk-factor screening (not yet clinically validated) to provide educational 
                  risk insights and personalised wellness guidance.
                </p>
                <div className="space-y-3">
                  {[
                    'Early osteoporosis awareness and education',
                    'Lifestyle-based risk factor assessment',
                    'Personalized wellness guidance and tracking',
                    'Evidence-inspired preventive healthcare approach',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: M }} />
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="rounded-2xl p-8" style={{ background: ML }}>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Educational Purpose</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  This platform is designed as an educational wellness-support tool and not as a replacement for 
                  professional medical diagnosis. It demonstrates how technology can support health awareness and 
                  encourage preventive healthcare practices.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Health Awareness', icon: 'fa-lightbulb' },
                    { label: 'Lifestyle Tracking', icon: 'fa-chart-line' },
                    { label: 'Educational Content', icon: 'fa-book' },
                    { label: 'Wellness Support', icon: 'fa-heart' },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto mb-2">
                        <i className={`fas ${item.icon} text-sm`} style={{ color: M }} />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          VALUES — 3 cards
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Our Principles</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">What We Stand For</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              The values that guide every decision we make at CareMend.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <FadeUp key={v.title} delay={i * 0.12}>
                <div className="rounded-2xl p-8 text-center h-full hover:-translate-y-1 transition-all"
                  style={{ background: ML, boxShadow: '0 4px 16px rgba(128,0,0,0.06)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-white shadow-sm">
                    <i className={`fas ${v.icon} text-xl`} style={{ color: M }} />
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-3">{v.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          VISION — full maroon banner
      ══════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${M} 0%, ${MD} 100%)` }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'white', transform: 'translate(-30%,30%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <FadeUp>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-eye text-white text-2xl" />
            </div>
            <h2 className="text-4xl font-black text-white mb-5">Our Vision</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-4 max-w-2xl mx-auto">
              To encourage early osteoporosis awareness and support healthier lifestyle habits through accessible preventive healthcare technology.
            </p>
            <p className="text-white/60 text-base leading-relaxed mb-10 max-w-xl mx-auto">
              The application is designed as an educational wellness-support platform and not as a replacement for professional medical diagnosis.
            </p>
            <button onClick={onStartAssessment}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-base bg-white transition-all hover:opacity-90 hover:scale-105"
              style={{ color: M, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              Try Assessment <i className="fas fa-arrow-right text-sm" />
            </button>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: M }}>
                  <i className="fas fa-bone text-white text-xs" />
                </div>
                <span className="text-xl font-black tracking-widest" style={{ color: '#f9a8a8' }}>CAREMEND</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered osteoporosis risk assessment tool — educational project for health awareness and prevention.
              </p>
            </div>
            <div className="flex flex-wrap gap-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Navigate</p>
                <div className="space-y-2.5">
                  <button onClick={onHome} className="block text-sm text-gray-400 hover:text-white transition-colors">Home</button>
                  <button onClick={onStartAssessment} className="block text-sm text-gray-400 hover:text-white transition-colors">Assessment</button>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Company</p>
                <div className="space-y-2.5">
                  <button className="block text-sm text-gray-400 hover:text-white transition-colors">Contact</button>
                  <button className="block text-sm text-gray-400 hover:text-white transition-colors">Privacy</button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© 2026 CareMend. Educational project for health awareness.</p>
            <p className="text-xs text-gray-600">Not intended as a substitute for professional medical advice.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default AboutPage;
