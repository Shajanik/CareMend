import React from 'react';
import { motion } from 'framer-motion';

const M = '#a32626';

interface Props {
  children: React.ReactNode;
  onBack?: () => void;
  leftPanel?: {
    icon: string;
    title: string;
    subtitle: string;
    stepDots?: [boolean, boolean, boolean]; // [active, active, active]
  };
  showBackButton?: boolean;
}

/**
 * FormLayout — Reusable centered form container
 * 
 * Ensures all multi-step forms have:
 * - Consistent centering (vertical + horizontal)
 * - Fixed max-width (max-w-md = 448px)
 * - Stable positioning across steps
 * - Optional left branding panel
 * - Optional back button
 */
const FormLayout: React.FC<Props> = ({ 
  children, 
  onBack, 
  leftPanel, 
  showBackButton = true 
}) => {
  return (
    <div className="w-full flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      
      {/* ── LEFT PANEL (optional) ── */}
      {leftPanel && (
        <div className="hidden lg:flex lg:w-1/2 bg-[#a32626] relative items-center justify-center p-16 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-black/10 rounded-full blur-2xl" />
          
          {/* Content — centered with fixed max-width */}
          <div className="relative z-10 text-center space-y-8 max-w-sm w-full">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 12 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto border border-white/20 shadow-2xl"
            >
              <i className={`fas ${leftPanel.icon} text-white text-4xl`} />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-white text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                {leftPanel.title.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {word}
                  </React.Fragment>
                ))}
              </h1>
              <p className="text-white/60 font-bold text-sm uppercase tracking-[0.3em] leading-relaxed">
                {leftPanel.subtitle}
              </p>
            </motion.div>

            {/* Step dots */}
            {leftPanel.stepDots && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-10 flex justify-center space-x-4"
              >
                {leftPanel.stepDots.map((active, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ background: active ? 'white' : 'rgba(255,255,255,0.3)' }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── RIGHT PANEL — Form Container ── */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 bg-white relative"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ minHeight: '100vh' }}
      >
        {/* Back button */}
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="absolute top-10 left-6 md:left-10 w-11 h-11 flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors z-10"
            style={{ color: M }}
          >
            <i className="fas fa-arrow-left text-xl" />
          </button>
        )}

        {/* Form content — ALWAYS centered with fixed max-width */}
        <div 
          className="w-full flex flex-col items-center"
          style={{ 
            maxWidth: '448px',  // max-w-md equivalent (28rem = 448px)
            minHeight: '400px', // prevents collapse on small content
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default FormLayout;
