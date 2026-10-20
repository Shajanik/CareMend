import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const M = '#a32626';

interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

/**
 * StepIndicator — horizontal step progress bar
 * Shows numbered circles connected by lines, with labels below.
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ current, total, labels }) => {
  return (
    <div className="w-full flex items-center justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const stepNum  = i + 1;
        const isDone   = stepNum < current;
        const isActive = stepNum === current;

        return (
          <React.Fragment key={i}>
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: isDone || isActive ? M : '#e5e7eb',
                  scale: isActive ? 1.15 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                style={{ color: isDone || isActive ? '#fff' : '#9ca3af' }}
              >
                {isDone ? <i className="fas fa-check text-xs" /> : stepNum}
              </motion.div>
              {labels?.[i] && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: isActive ? M : '#9ca3af' }}
                >
                  {labels[i]}
                </span>
              )}
            </div>

            {/* Connector line between steps */}
            {i < total - 1 && (
              <div className="flex-1 mx-2 mb-5">
                <div className="h-0.5 w-full rounded-full" style={{ background: '#e5e7eb' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: M }}
                    animate={{ width: isDone ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface FormStepProps {
  children: React.ReactNode;
  stepKey: string | number; // unique key per step — triggers animation on change
}

/**
 * FormStep — wraps each step's content with a fade+slide animation.
 * Use a different stepKey per step so AnimatePresence detects the change.
 */
export const FormStep: React.FC<FormStepProps> = ({ children, stepKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        className="w-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

/**
 * FormHeader — consistent title block used at the top of every step.
 */
export const FormHeader: React.FC<FormHeaderProps> = ({ title, subtitle, icon }) => (
  <div className="flex flex-col items-center gap-2 text-center w-full mb-8">
    {icon && (
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
        style={{ background: '#fdf2f2', color: M }}
      >
        <i className={`fas ${icon} text-xl`} />
      </div>
    )}
    <h2
      className="font-black uppercase tracking-tighter leading-none"
      style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: M }}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        className="font-bold uppercase leading-relaxed"
        style={{ fontSize: '0.7rem', color: '#a3a3a3', letterSpacing: '0.16em' }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField — consistent label + input wrapper.
 */
export const FormField: React.FC<FormFieldProps> = ({ label, children, className = '' }) => (
  <div className={`flex flex-col items-center gap-1.5 w-full ${className}`}>
    <label
      className="font-black uppercase text-center"
      style={{ fontSize: '0.68rem', color: '#a3a3a3', letterSpacing: '0.18em' }}
    >
      {label}
    </label>
    {children}
  </div>
);

interface FormFooterProps {
  children: React.ReactNode;
}

/**
 * FormFooter — bottom section of a form step (links, hints, etc.)
 */
export const FormFooter: React.FC<FormFooterProps> = ({ children }) => (
  <div className="flex flex-col items-center gap-2 text-center mt-6 w-full">
    {children}
  </div>
);
