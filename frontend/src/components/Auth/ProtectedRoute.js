import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    const redirectTo = requiredRole === 'admin' ? '/login-admin' : '/login-user';
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-red-600 dark:text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
            {requiredRole === 'admin' && user?.role === 'user' && (
              <span className="block mt-2">
                This page is only accessible to administrators.
              </span>
            )}
          </p>
          <motion.button
            onClick={() => window.history.back()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Role-specific redirects
  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'user' && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // User is authorized, render the protected component
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default ProtectedRoute;