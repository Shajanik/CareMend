
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CustomDropdownProps {
  placeholder: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ placeholder, value, options, onChange, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`w-full relative ${className}`}>
      <motion.select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full bg-white rounded-2xl border-none focus:outline-none transition-all ${value ? 'text-neutral-700' : 'text-neutral-400'} font-semibold appearance-none cursor-pointer`}
        style={{
          padding: '1rem 1.5rem',
          fontSize: '1rem',
          letterSpacing: '0.02em',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(163, 38, 38, 0.2), 0 0 24px 4px rgba(163, 38, 38, 0.35)'
            : isHovered
            ? '0 2px 16px rgba(163, 38, 38, 0.15)'
            : '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: isFocused ? '2px solid rgba(163, 38, 38, 0.3)' : '2px solid transparent'
        }}
        animate={{
          scale: isHovered || isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </motion.select>
      <motion.div 
        className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#a32626]"
        animate={{
          rotate: isFocused ? 180 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </div>
  );
};

export default CustomDropdown;
