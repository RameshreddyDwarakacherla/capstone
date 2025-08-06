import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  placeholder,
  className = '',
  labelClassName = '',
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  required = false,
  ...props
}, ref) => {
  const inputClasses = clsx(
    'block w-full rounded-lg border shadow-sm transition-colors duration-200',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    {
      'border-red-300 focus:ring-red-500 focus:border-red-500': error,
      'border-gray-300': !error,
      'pl-10': LeftIcon,
      'pr-10': RightIcon,
      'px-3 py-2': !LeftIcon && !RightIcon
    },
    className
  );

  const labelClasses = clsx(
    'block text-sm font-medium mb-1',
    'text-gray-700 dark:text-gray-300',
    labelClassName
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
        
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <RightIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;