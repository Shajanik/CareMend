import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const M  = '#800000';
const ML = '#fdf0f0';

const TAGLINES = ['Bone Health, Simplified.', 'Your Wellness Journey Starts Here.', 'Stronger Bones. Better Life.'];

const SplashScreen: React.FC = () => {
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'bar' | 'exit'>('logo');
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 800);
    const t2 = setTimeout(() => { setTaglineIdx(1); }, 1600);
    const t3 = setTimeout(() => { setTaglineIdx(2); }, 2400);
    const t4 = setTimeout(() => setPhase('bar'), 2800);
    const t5 = setTimeout(() => setPhase('exit'), 3600);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[100] overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Soft radial glow behind logo */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 480, height: 480, background: `radial-gradient(circle, ${ML} 0%, transparent 70%)` }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Pulsing ring */}
      <motion.div
        className="absolute rounded-full border-2 pointer-events-none"
        style={{ width: 320, height: 320, borderColor: `${M}18` }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.15, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full border pointer-events-none"
        style={{ width: 220, height: 220, borderColor: `${M}25` }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        {/* SVG logo mark */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 200 200" width="120" height="120">
            <defs>
              <path id="sp-tcp" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
              <radialGradient id="sp-iy" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fbc02d" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="white" />
            <circle cx="100" cy="100" r="90" fill="none" stroke={M} strokeWidth="2" strokeOpacity="0.12" />
            <path d="M100 150 C100 150 45 115 45 75 C45 50 65 40 80 40 C95 40 100 50 100 50 C100 50 105 40 120 40 C135 40 155 50 155 75 C155 115 100 150 100 150"
              fill="url(#sp-iy)" stroke={M} strokeWidth="8" strokeLinejoin="round" />
            <g transform="translate(100,95) scale(0.9)">
              <path d="M-5 45 C-20 30 -50 0 -45 -25 C-40 -45 -20 -50 -10 -40 C0 -30 10 -10 10 -10 C10 -10 20 -30 30 -40 C40 -50 60 -45 65 -25 C70 0 40 35 25 50 L10 60 Z"
                fill="white" stroke={M} strokeWidth="4" transform="translate(-10,-10)" />
              <path d="M-5 -10 Q5 -30 25 -20" fill="none" stroke={M} strokeWidth="4" strokeLinecap="round" />
              <path d="M-5 0 Q10 -20 30 -10"  fill="none" stroke={M} strokeWidth="4" strokeLinecap="round" />
              <path d="M-5 10 Q15 -10 35 0"   fill="none" stroke={M} strokeWidth="4" strokeLinecap="round" />
            </g>
            <text fill={M} fontSize="10.5" fontWeight="900" letterSpacing="0.5">
              <textPath xlinkHref="#sp-tcp" startOffset="0%">FIND SUPPORT, FIND BALANCE, FIND YOU</textPath>
            </text>
          </svg>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, letterSpacing: '0.05em' }}
          animate={{ opacity: 1, letterSpacing: '0.18em' }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl font-black uppercase"
          style={{ color: M }}
        >
          CAREMEND
        </motion.div>

        {/* Animated tagline */}
        <div className="h-5 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase !== 'logo' && (
              <motion.p
                key={taglineIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="text-xs font-semibold uppercase tracking-[0.22em] text-center"
                style={{ color: `${M}99` }}
              >
                {TAGLINES[taglineIdx]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Loading bar */}
      <AnimatePresence>
        {(phase === 'bar' || phase === 'exit') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 flex flex-col items-center gap-3"
          >
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: `${M}18` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: M }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ color: `${M}60` }}
            >
              Loading...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating particles */}
      {[
        { x: '15%', y: '20%', size: 6, delay: 0 },
        { x: '80%', y: '15%', size: 4, delay: 0.3 },
        { x: '10%', y: '70%', size: 5, delay: 0.6 },
        { x: '85%', y: '75%', size: 4, delay: 0.9 },
        { x: '50%', y: '85%', size: 3, delay: 1.2 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: M, opacity: 0.15 }}
          animate={{ y: [0, -10, 0], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  );
};

export default SplashScreen;
