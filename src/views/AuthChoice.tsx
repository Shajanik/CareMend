
import React from 'react';
import CaremendLogo from '../components/CaremendLogo';
import CustomButton from '../components/CustomButton';
import { motion } from 'framer-motion';

interface Props {
  onLogin: () => void;
  onSignUp: () => void;
}

// Staggered fade-in-up variant
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut' as const, delay },
});

const AuthChoice: React.FC<Props> = ({ onLogin, onSignUp }) => {
  return (
    <div className="w-full flex flex-col md:flex-row min-h-screen">

      {/* ══════════════════════════════════════
          LEFT PANEL — Branding
      ══════════════════════════════════════ */}
      <div className="hidden md:flex md:w-1/2 bg-[#a32626] items-center justify-center p-16 text-white">
        <div className="w-full max-w-sm flex flex-col items-center gap-10 text-center">

          {/* Brand unit — icon + wordmark side-by-side, vertically centered */}
          <motion.div className="flex items-center gap-4" {...fadeUp(0)}>
            <div className="w-[72px] h-[72px] shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <path id="lp-tcp" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
                  <radialGradient id="lp-iy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbc02d" stopOpacity="0.6" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="90" fill="white" opacity="0.95" />
                <path
                  d="M100 150 C100 150 45 115 45 75 C45 50 65 40 80 40 C95 40 100 50 100 50 C100 50 105 40 120 40 C135 40 155 50 155 75 C155 115 100 150 100 150"
                  fill="url(#lp-iy)" stroke="#a32626" strokeWidth="8" strokeLinejoin="round"
                />
                <g transform="translate(100,95) scale(0.9)">
                  <path d="M-5 45 C-20 30 -50 0 -45 -25 C-40 -45 -20 -50 -10 -40 C0 -30 10 -10 10 -10 C10 -10 20 -30 30 -40 C40 -50 60 -45 65 -25 C70 0 40 35 25 50 L10 60 Z"
                    fill="white" stroke="#a32626" strokeWidth="4" transform="translate(-10,-10)" />
                  <path d="M-5 -10 Q5 -30 25 -20" fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
                  <path d="M-5 0 Q10 -20 30 -10"  fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
                  <path d="M-5 10 Q15 -10 35 0"   fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
                </g>
                <text fill="#a32626" fontSize="10.5" fontWeight="900" letterSpacing="0.5">
                  <textPath xlinkHref="#lp-tcp" startOffset="0%">FIND SUPPORT, FIND BALANCE, FIND YOU</textPath>
                </text>
              </svg>
            </div>
            {/* CAREMEND — flat white, clear letter-spacing, aligned center with icon */}
            <span
              className="text-[2rem] font-black leading-none select-none"
              style={{ color: '#fff', letterSpacing: '0.2em', textShadow: 'none' }}
            >
              CAREMEND
            </span>
          </motion.div>

          {/* Main headline — large bold focal point */}
          <motion.h1
            className="font-black uppercase leading-[1.15]"
            style={{ fontSize: 'clamp(2.4rem, 4vw, 3.2rem)', letterSpacing: '-0.02em' }}
            {...fadeUp(0.1)}
          >
            Your Bone Health
            <br />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Our Priority.</span>
          </motion.h1>

          {/* Description — larger, more readable */}
          <motion.p
            className="font-semibold uppercase leading-[2] text-center"
            style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)', letterSpacing: '0.12em', maxWidth: 300 }}
            {...fadeUp(0.2)}
          >
            Empowering individuals with osteoporosis through specialized care, community support, and expert guidance.
          </motion.p>

          {/* Pagination dots — centered */}
          <motion.div className="flex items-center justify-center gap-3" {...fadeUp(0.3)}>
            <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.65)' }}></div>
            <div className="w-3 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}></div>
            <div className="w-3 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}></div>
          </motion.div>

        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL — Actions
      ══════════════════════════════════════ */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 bg-white">

        {/* Mobile logo */}
        <div className="md:hidden mb-10">
          <CaremendLogo className="w-48" />
        </div>

        <div className="w-full max-w-sm flex flex-col gap-10">

          {/* Header */}
          <motion.div className="flex flex-col gap-3" {...fadeUp(0.05)}>
            <h2
              className="font-black uppercase tracking-tighter leading-none"
              style={{ fontSize: 'clamp(2.4rem, 4vw, 3rem)', color: '#a32626' }}
            >
              Get Started
            </h2>
            <p
              className="font-bold uppercase leading-relaxed"
              style={{ fontSize: '0.72rem', color: '#a3a3a3', letterSpacing: '0.14em' }}
            >
              Welcome to CareMend. Please choose an option to continue.
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div className="flex flex-col gap-5" {...fadeUp(0.15)}>
            <CustomButton label="Log in to your account" onClick={onLogin} />

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-neutral-200"></div>
              <span
                className="font-black uppercase"
                style={{ fontSize: '0.65rem', color: '#d4d4d4', letterSpacing: '0.18em' }}
              >
                or
              </span>
              <div className="flex-1 border-t border-neutral-200"></div>
            </div>

            <CustomButton label="Create new account" onClick={onSignUp} />
          </motion.div>

          {/* Footer */}
          <motion.p
            className="text-center font-bold uppercase leading-relaxed"
            style={{ fontSize: '0.65rem', color: '#a3a3a3', letterSpacing: '0.12em' }}
            {...fadeUp(0.25)}
          >
            By continuing, you agree to our <br />
            <span className="cursor-pointer hover:underline" style={{ color: '#a32626' }}>Terms of Service</span>
            {' '}and{' '}
            <span className="cursor-pointer hover:underline" style={{ color: '#a32626' }}>Privacy Policy</span>
          </motion.p>

        </div>
      </div>
    </div>
  );
};

export default AuthChoice;
