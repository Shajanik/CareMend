import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const M  = '#800000';
const ML = '#fdf0f0';
const MD = '#5a0000';

interface Props {
  onStartAssessment: () => void;
  onGoToDashboard:   () => void;
  onAbout:           () => void;
  onLogin:           () => void;
}

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

const FEATURES = [
  { icon: 'fa-chart-line',    title: 'Risk Assessment',  desc: 'Hybrid scoring using lifestyle and clinical risk factors related to osteoporosis awareness.' },
  { icon: 'fa-person-walking', title: 'Exercise Tracking', desc: 'Track walking sessions, stretching routines, and consistency over time.' },
  { icon: 'fa-bowl-food',     title: 'Nutrition Guidance',    desc: 'Monitor calcium and vitamin D focused nutrition habits.' },
  { icon: 'fa-spa',           title: 'Wellness Support',      desc: 'Stress-management guidance designed to support overall wellness and healthy lifestyle habits.' },
];

const STEPS = [
  { icon: 'fa-clipboard-list', num: '01', title: 'Input Health Data',    desc: 'Age, gender, lifestyle habits, fracture history, and calcium & vitamin D intake.' },
  { icon: 'fa-brain',          num: '02', title: 'Hybrid Risk Assessment',     desc: 'Rule-based clinical scoring combined with logistic regression estimation.' },
  { icon: 'fa-list-check',     num: '03', title: 'Personalised Guidance', desc: 'Exercise tracking, bone-health diet guidance, meditation support, and lifestyle monitoring.' },
];

const BENEFITS = [
  { icon: 'fa-magnifying-glass-chart', title: 'Early Detection',          desc: 'Identify bone loss risk years before symptoms appear.' },
  { icon: 'fa-sliders',                title: 'Personalised Care',        desc: 'Every plan adapts to your unique health profile.' },
  { icon: 'fa-arrow-trend-up',         title: 'Continuous Monitoring',    desc: 'Track progress and update your plan over time.' },
];

const HomePage: React.FC<Props> = ({ onStartAssessment, onGoToDashboard, onAbout, onLogin }) => {
  const featuresRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════
          NAV — sticky, white, clean
      ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: M }}>
              <i className="fas fa-bone text-white text-xs" />
            </div>
            <span className="text-xl font-black tracking-widest" style={{ color: M }}>CAREMEND</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Home',     action: () => {} },
              { label: 'Features', action: () => featuresRef.current?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'About',    action: onAbout },
            ].map(n => (
              <button key={n.label} onClick={n.action}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors relative group">
                {n.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 rounded-full group-hover:w-full transition-all duration-300"
                  style={{ background: M }} />
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <button onClick={onStartAssessment}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background: M, boxShadow: `0 4px 14px rgba(128,0,0,0.3)` }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO — split background, floating cards
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center">
        {/* Split background: white left, maroon-tinted right */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-full lg:w-1/2 bg-white" />
          <div className="hidden lg:block w-1/2" style={{ background: `linear-gradient(135deg, ${ML} 0%, #f5d5d5 100%)` }} />
        </div>
        {/* Decorative circle top-right (like reference) */}
        <div className="absolute top-8 right-8 w-40 h-40 rounded-full border-2 border-dashed opacity-20 pointer-events-none"
          style={{ borderColor: M }} />
        <div className="absolute top-16 right-16 w-24 h-24 rounded-full border opacity-10 pointer-events-none"
          style={{ borderColor: M }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* LEFT — text content */}
          <div>
            <FadeUp>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                style={{ background: ML, color: M }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: M }} />
                AI-Powered Healthcare
              </span>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h1 className="font-black leading-[1.05] tracking-tight mb-5"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', color: '#1a1a1a' }}>
                AI-Assisted<br />
                <span style={{ color: M }}>Osteoporosis</span><br />
                Risk Assessment
              </h1>
            </FadeUp>

            <FadeUp delay={0.16}>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-8 max-w-md">
                Understand your bone health through lifestyle-based risk analysis and personalised wellness guidance.
              </p>
            </FadeUp>

            <FadeUp delay={0.22}>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={onStartAssessment}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: M, boxShadow: `0 8px 28px rgba(128,0,0,0.35)` }}>
                  <i className="fas fa-play text-xs" />
                  Start Assessment
                </button>
                <button onClick={onAbout}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-sm border-2 transition-all hover:bg-gray-50"
                  style={{ borderColor: M, color: M }}>
                  Learn More
                  <i className="fas fa-arrow-right text-xs" />
                </button>
              </div>
            </FadeUp>

            {/* Stats row */}
            <FadeUp delay={0.3}>
              <div className="flex gap-8">
                {[
                  { val: '15+',   label: 'Risk Factors' },
                  { val: '3',     label: 'Simple Steps' },
                  { val: '5 min', label: 'Assessment' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-black" style={{ color: M }}>{s.val}</div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* RIGHT — dashboard preview with floating cards */}
          <FadeUp delay={0.2} className="relative flex justify-center items-center">
            {/* Main visual card */}
            <div className="relative w-72 h-72 md:w-80 md:h-80">
              <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-4 p-6"
                style={{ background: `linear-gradient(135deg, ${M} 0%, ${MD} 100%)`,
                  boxShadow: `0 24px 64px rgba(128,0,0,0.4)` }}>
                {/* Bone SVG */}
                <svg viewBox="0 0 200 200" className="w-28 h-28" fill="none">
                  <rect x="93" y="18" width="14" height="164" rx="7" fill="white" opacity="0.12" />
                  {[28,52,76,100,124,148].map((y,i) => (
                    <rect key={i} x="79" y={y} width="42" height="13" rx="6.5" fill="white" opacity="0.28" />
                  ))}
                  <ellipse cx="71" cy="118" rx="21" ry="28" fill="white" opacity="0.18" transform="rotate(-14 71 118)" />
                  <ellipse cx="129" cy="118" rx="21" ry="28" fill="white" opacity="0.18" transform="rotate(14 129 118)" />
                  <polyline points="22,172 48,172 60,150 72,188 84,158 96,172 178,172"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
                </svg>
                <div className="text-center">
                  <div className="text-white/60 text-xs font-bold uppercase tracking-widest">Bone Health</div>
                  <div className="text-white text-lg font-black">Assessment Ready</div>
                </div>
              </div>

              {/* Floating card — top right (like reference "Tue, 12:00am") */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-5 -right-6 bg-white rounded-2xl px-4 py-3 shadow-2xl border border-gray-100 min-w-[130px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: ML }}>
                    <i className="fas fa-chart-line text-[10px]" style={{ color: M }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Risk Score</span>
                </div>
                <div className="text-2xl font-black" style={{ color: M }}>Low</div>
                <div className="text-[10px] text-green-600 font-bold mt-0.5">Good Health</div>
              </motion.div>

              {/* Floating card — bottom left (like reference "Meet our doctor") */}
              <motion.div
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-5 -left-6 bg-white rounded-2xl px-4 py-3 shadow-2xl border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex -space-x-1.5">
                    {['fa-running', 'fa-bowl-food', 'fa-spa'].map((ic, i) => (
                      <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                        style={{ background: M }}>
                        <i className={`fas ${ic} text-white`} style={{ fontSize: 7 }} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Your Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-black text-gray-800">Active & Running</span>
                </div>
              </motion.div>

              {/* Floating card — left middle */}
              <motion.div
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-1/2 -left-14 -translate-y-1/2 bg-white rounded-xl px-3 py-2 shadow-xl border border-gray-100"
              >
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Confidence</div>
                <div className="text-base font-black" style={{ color: M }}>HIGH</div>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MAROON STRIP — 3 quick benefits
          (matches the blue strip in reference)
      ══════════════════════════════════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${M} 0%, ${MD} 100%)` }}>
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'fa-shield-halved',  title: 'Free Assessment',      desc: 'No cost, accessible to everyone interested in bone health awareness.' },
            { icon: 'fa-clock',          title: 'Quick Results',        desc: 'Complete your risk evaluation in approximately 5 minutes.' },
            { icon: 'fa-flask',          title: 'Research-Based',       desc: 'Built using established clinical guidelines and risk factor research.' },
          ].map((b, i) => (
            <FadeUp key={b.title} delay={i * 0.1}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${b.icon} text-white text-lg`} />
                </div>
                <div>
                  <h3 className="text-white font-black text-base mb-1">{b.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — 4 cards
      ══════════════════════════════════════════ */}
      <section ref={featuresRef} className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>What We Offer</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Key Features</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              Comprehensive tools for osteoporosis risk assessment and wellness guidance.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.1}>
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full cursor-pointer"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                    style={{ background: ML }}>
                    <i className={`fas ${f.icon} text-xl`} style={{ color: M }} />
                  </div>
                  <h3 className="font-black text-gray-900 mb-2 text-base">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  {/* Hover arrow */}
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: M }}>
                    Learn more <i className="fas fa-arrow-right text-[10px]" />
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — horizontal steps
      ══════════════════════════════════════════ */}
      <section className="py-24" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Simple Process</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-base">AI-powered assessment combined with personalized health recommendations.</p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5"
              style={{ background: `linear-gradient(90deg, ${M}40, ${M}, ${M}40)` }} />

            {STEPS.map((s, i) => (
              <FadeUp key={s.num} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center mb-6 relative z-10 transition-all hover:scale-105"
                    style={{
                      background: i === 1 ? `linear-gradient(135deg, ${M}, ${MD})` : '#fff',
                      border: `2px solid ${i === 1 ? 'transparent' : '#e5e7eb'}`,
                      boxShadow: i === 1 ? `0 12px 32px rgba(128,0,0,0.35)` : '0 4px 16px rgba(0,0,0,0.06)',
                    }}>
                    <i className={`fas ${s.icon} text-xl mb-1`} style={{ color: i === 1 ? '#fff' : M }} />
                    <span className="text-xs font-black" style={{ color: i === 1 ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                      {s.num}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Educational Info Card - Cortisol */}
          <FadeUp delay={0.5} className="mt-12">
            <div className="max-w-2xl mx-auto rounded-2xl p-6 border-2" style={{ borderColor: `${M}25`, background: ML }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-info-circle text-lg" style={{ color: M }} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">What is Cortisol?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Cortisol is a stress hormone produced by the body. Long-term stress may negatively affect bone health 
                    when combined with poor sleep, inactivity, and unhealthy lifestyle habits.
                  </p>
                </div>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.6} className="text-center mt-8">
            <button onClick={onStartAssessment}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 hover:scale-105"
              style={{ background: M, boxShadow: `0 8px 28px rgba(128,0,0,0.3)` }}>
              Start Your Assessment
              <i className="fas fa-arrow-right text-sm" />
            </button>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TECH STACK — implemented technologies
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Built With</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Technology Stack</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Modern, reliable technologies for performance and user experience.
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Frontend', value: 'React + TypeScript', icon: 'fa-react', color: '#61dafb' },
              { label: 'Styling', value: 'Tailwind CSS', icon: 'fa-palette', color: '#06b6d4' },
              { label: 'Backend', value: 'Flask (Python)', icon: 'fa-python', color: '#3776ab' },
              { label: 'Screening', value: 'Rule-based', icon: 'fa-clipboard-check', color: '#f59e0b' },
              { label: 'Database', value: 'SQLite + SQLAlchemy', icon: 'fa-database', color: '#10b981' },
              { label: 'Auth', value: 'JWT Authentication', icon: 'fa-shield-halved', color: '#8b5cf6' },
            ].map((t, i) => (
              <FadeUp key={t.label} delay={i * 0.07}>
                <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${t.color}18` }}>
                    <i className={`fas ${t.icon} text-xl`} style={{ color: t.color }} />
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
          BENEFITS — 3 cards on maroon-light bg
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: ML, color: M }}>Why CareMend</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Built for Better Bone Health</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-base">
              Designed with patients in mind — accessible, accurate, and actionable.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <FadeUp key={b.title} delay={i * 0.12}>
                <div className="rounded-2xl p-8 h-full transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: ML, boxShadow: '0 2px 12px rgba(128,0,0,0.06)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-white shadow-sm">
                    <i className={`fas ${b.icon} text-lg`} style={{ color: M }} />
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${M} 0%, ${MD} 100%)` }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

        <FadeUp className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Take Control of Your<br />Bone Health Today
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Free assessment. Personalised results. No medical background needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={onStartAssessment}
              className="px-10 py-4 rounded-2xl font-black text-base bg-white transition-all hover:opacity-90 hover:scale-105"
              style={{ color: M, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              Start Free Assessment
            </button>
            <button onClick={onAbout}
              className="px-10 py-4 rounded-2xl font-black text-base border-2 border-white/40 text-white transition-all hover:bg-white/10">
              Learn More
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-white py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            {/* Brand */}
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

            {/* Links */}
            <div className="flex flex-wrap gap-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Product</p>
                <div className="space-y-2.5">
                  {['Features', 'How It Works', 'Risk Assessment'].map(l => (
                    <button key={l} onClick={onStartAssessment}
                      className="block text-sm text-gray-400 hover:text-white transition-colors">{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Company</p>
                <div className="space-y-2.5">
                  <button onClick={onAbout} className="block text-sm text-gray-400 hover:text-white transition-colors">About</button>
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

export default HomePage;
