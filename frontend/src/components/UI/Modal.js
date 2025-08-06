import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen = false,
  onClose = () => {},
  title = '',
  children,
  footer = null,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={`
              relative w-full ${sizeClasses[size]} max-h-[90vh] 
              bg-white dark:bg-gray-800 rounded-lg shadow-xl 
              flex flex-col overflow-hidden
              ${className}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-end space-x-4">
                  {footer}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document root
  return createPortal(modalContent, document.body);
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger', 'warning', 'info'
  isLoading = false
}) => {
  const typeConfig = {
    danger: {
      icon: '⚠️',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: '⚠️',
      confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: 'ℹ️',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={config.confirmClass}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-4">
        <div className="text-2xl flex-shrink-0">
          {config.icon}
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          {message}
        </div>
      </div>
    </Modal>
  );
};

export default Modal;