import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Card = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  shadow = 'sm',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const classes = clsx(
    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
    shadowClasses[shadow],
    paddingClasses[padding],
    className
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2, shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' }}
        transition={{ duration: 0.2 }}
        className={classes}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;