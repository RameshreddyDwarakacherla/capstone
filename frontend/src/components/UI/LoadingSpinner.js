import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium', text = '', className = '' }) => {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        className={`${sizes[size]} border-4 border-gray-200 border-t-primary-600 rounded-full`}
        variants={spinnerVariants}
        animate="animate"
      />
      {text && (
        <motion.p
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Full screen loading overlay
export const LoadingOverlay = ({ isVisible, text = 'Loading...' }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <LoadingSpinner size="large" text={text} />
      </motion.div>
    </motion.div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  children, 
  isLoading, 
  disabled, 
  className = '', 
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`relative ${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
    >
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LoadingSpinner size="small" />
        </motion.div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

export default LoadingSpinner;