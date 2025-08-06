import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  as: Component = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white shadow-sm',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-400 dark:hover:bg-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-sm'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  const MotionComponent = motion(Component);

  return (
    <MotionComponent
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={classes}
      onClick={onClick}
      disabled={disabled || isLoading}
      type={Component === 'button' ? type : undefined}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading...
        </div>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 mr-2" />}
          {children}
          {RightIcon && <RightIcon className="w-4 h-4 ml-2" />}
        </>
      )}
    </MotionComponent>
  );
};

export default Button;