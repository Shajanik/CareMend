
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CustomInputProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ placeholder, value, onChange, type = 'text', className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`w-full ${className}`}>
      <motion.input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full bg-white rounded-2xl border-none focus:outline-none transition-all text-neutral-700 font-semibold"
        style={{
          padding: '1rem 1.5rem',
          fontSize: '1rem',
          letterSpacing: '0.02em',
          boxShadow: isFocused 
            ? '0 0 0 3px rgba(163, 38, 38, 0.2), 0 0 24px 4px rgba(163, 38, 38, 0.35)' 
            : '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: isFocused ? '2px solid rgba(163, 38, 38, 0.3)' : '2px solid transparent'
        }}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    </div>
  );
};

export default CustomInput;
