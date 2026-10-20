
import React from 'react';
import CustomButton from '../components/CustomButton';
import { motion } from 'framer-motion';

interface Props {
  onProceed: () => void;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay },
});

const RiskIntro: React.FC<Props> = ({ onProceed }) => {
  return (
    <div className="w-full flex flex-col lg:flex-row h-screen overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#a32626] items-center justify-center p-16 text-white relative overflow-hidden">
        {/* Subtle decorative rings */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full border-[50px] border-white opacity-[0.06] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full border-[70px] border-white opacity-[0.06] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center">

          {/* Brand unit */}
          <motion.div className="flex items-center gap-4" {...fadeUp(0)}>
            <div className="w-[72px] h-[72px] shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <path id="ri-tcp" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
                  <radialGradient id="ri-iy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbc02d" stopOpacity="0.6" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="90" fill="white" opacity="0.95" />
                <path d="M100 150 C100 150 45 115 45 75 C45 50 65 40 80 40 C95 40 100 50 100 50 C100 50 105 40 120 40 C135 40 155 50 155 75 C155 115 100 150 100 150"
                  fill="url(#ri-iy)" stroke="#a32626" strokeWidth="8" strokeLinejoin="round" />
                <g transform="translate(100,95) scale(0.9)">
                  <path d="M-5 45 C-20 30 -50 0 -45 -25 C-40 -45 -20 -50 -10 -40 C0 -30 10 -10 10 -10 C10 -10 20 -30 30 -40 C40 -50 60 -45 65 -25 C70 0 40 35 25 50 L10 60 Z"
                    fill="white" stroke="#a32626" strokeWidth="4" transform="translate(-10,-10)" />
                  <path d="M-5 -10 Q5 -30 25 -20" fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
                  <path d="M-5 0 Q10 -20 30 -10"  fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
                  <path d="M-5 10 Q15 -10 35 0"   fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
                </g>
                <text fill="#a32626" fontSize="10.5" fontWeight="900" letterSpacing="0.5">
                  <textPath xlinkHref="#ri-tcp" startOffset="0%">FIND SUPPORT, FIND BALANCE, FIND YOU</textPath>
                </text>
              </svg>
            </div>
            <span className="text-[2rem] font-black leading-none select-none"
              style={{ color: '#fff', letterSpacing: '0.2em', textShadow: 'none' }}>
              CAREMEND
            </span>
          </motion.div>

          <motion.h1
            className="font-black uppercase leading-[1.15]"
            style={{ fontSize: 'clamp(2.4rem, 4vw, 3.2rem)', letterSpacing: '-0.02em' }}
            {...fadeUp(0.1)}
          >
            Bone Health<br />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Matters.</span>
          </motion.h1>

          <motion.p
            className="font-semibold uppercase leading-[2] text-center"
            style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)', letterSpacing: '0.12em', maxWidth: 300 }}
            {...fadeUp(0.2)}
          >
            Early detection and risk assessment are the first steps toward a stronger, more resilient future.
          </motion.p>

          <motion.div className="flex items-center justify-center gap-3" {...fadeUp(0.3)}>
            <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.65)' }} />
            <div className="w-3 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
            <div className="w-3 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL — fade in, fully centered ── */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 bg-white"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <div className="w-12 h-12">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="90" fill="white" style={{ filter: 'drop-shadow(0 0 6px rgba(163,38,38,0.2))' }} />
              <path d="M100 150 C100 150 45 115 45 75 C45 50 65 40 80 40 C95 40 100 50 100 50 C100 50 105 40 120 40 C135 40 155 50 155 75 C155 115 100 150 100 150"
                fill="#fbc02d" stroke="#a32626" strokeWidth="8" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-black" style={{ color: '#a32626', letterSpacing: '0.18em' }}>CAREMEND</span>
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-10 text-center">

          {/* Badge */}
          <motion.div {...fadeUp(0.05)}>
            <span
              className="inline-block px-5 py-2 rounded-full font-black uppercase"
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: '#a32626',
                background: '#fdf0f0',
                border: '1px solid rgba(163,38,38,0.12)',
              }}
            >
              Specialized Assessment
            </span>
          </motion.div>

          {/* Main headline — bold focal point */}
          <motion.h2
            className="font-black uppercase tracking-tighter leading-[1.05] text-center"
            style={{ fontSize: 'clamp(2.8rem, 5vw, 4rem)', color: '#1a1a1a' }}
            {...fadeUp(0.1)}
          >
            Osteoporosis<br />
            <span style={{ color: '#a32626' }}>Evaluation</span>
          </motion.h2>

          {/* Description — larger, readable */}
          <motion.p
            className="font-semibold leading-[1.8] text-center"
            style={{ fontSize: '1rem', color: '#6b7280', maxWidth: 380 }}
            {...fadeUp(0.18)}
          >
            A specialized clinical tool to evaluate your risk for bone density loss and fractures using evidence-based parameters.
          </motion.p>

          {/* Divider */}
          <motion.div className="flex items-center gap-4 w-full justify-center" {...fadeUp(0.24)}>
            <div className="flex-1 h-px max-w-[60px]" style={{ background: '#e5e7eb' }} />
            <span className="font-black uppercase" style={{ fontSize: '0.65rem', color: '#d1d5db', letterSpacing: '0.22em' }}>
              Clinical Evaluation Framework
            </span>
            <div className="flex-1 h-px max-w-[60px]" style={{ background: '#e5e7eb' }} />
          </motion.div>

          {/* CTA button */}
          <motion.div className="w-full" {...fadeUp(0.3)}>
            <CustomButton label="Start Assessment" onClick={onProceed} />
          </motion.div>

          {/* Stats — larger, evenly distributed */}
          <motion.div
            className="w-full grid grid-cols-3 pt-6"
            style={{ borderTop: '1px solid #f3f4f6' }}
            {...fadeUp(0.38)}
          >
            {[
              { value: '10+',   label: 'Markers'  },
              { value: '2 min', label: 'Duration' },
              { value: '100%',  label: 'Clinical' },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 py-4"
                style={{ borderRight: i < 2 ? '1px solid #f3f4f6' : 'none' }}
              >
                <span className="font-black" style={{ fontSize: '1.6rem', color: '#a32626', lineHeight: 1 }}>
                  {stat.value}
                </span>
                <span className="font-black uppercase" style={{ fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.2em' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default RiskIntro;
