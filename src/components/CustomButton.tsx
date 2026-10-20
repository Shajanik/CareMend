import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;          // FontAwesome class e.g. "fa-arrow-right"
  iconPosition?: 'left' | 'right';
  className?: string;
}

const CustomButton: React.FC<Props> = ({
  label,
  onClick,
  variant = 'primary',
  fullWidth = true,
  disabled = false,
  icon,
  iconPosition = 'right',
  className = '',
}) => {
  // Build class list with proper ordering for text color override
  const baseClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Ensure text-white comes after background classes for proper override
  const cls = [
    baseClasses,
    widthClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cls}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      // Inline style to ensure text color is visible - fallback for critical buttons
      style={{
        color: className?.includes('text-white') ? '#ffffff' : undefined,
      }}
    >
      {icon && iconPosition === 'left' && (
        <i className={`fas ${icon} icon-md`} />
      )}
      {label}
      {icon && iconPosition === 'right' && (
        <i className={`fas ${icon} icon-md`} />
      )}
    </motion.button>
  );
};

export default CustomButton;
