import React from 'react';
import { motion } from 'framer-motion';

export const Switch = ({ 
  checked = false, 
  onChange, 
  disabled = false,
  size = 'md',
  className = '',
  ...props 
}) => {
  const sizes = {
    sm: {
      switch: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    md: {
      switch: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6'
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  };

  const sizeClasses = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={`
        relative inline-flex items-center ${sizeClasses.switch} rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        ${checked 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        ${className}
      `}
      {...props}
    >
      <motion.span
        className={`
          inline-block ${sizeClasses.thumb} rounded-full bg-white shadow-lg
          transform transition-transform duration-200 ease-in-out
        `}
        animate={{
          x: checked ? sizeClasses.translate.replace('translate-x-', '') : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </button>
  );
};