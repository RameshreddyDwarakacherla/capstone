import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';

const LoginAdmin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password, 'admin');
      
      if (result.success) {
        navigate('/admin');
      } else {
        setError('root', { message: result.error });
      }
    } catch (error) {
      setError('root', { message: 'Admin login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to manage civic issues and reports
            </p>
          </div>

          {/* Admin Notice */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Administrative Access
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  This portal is restricted to authorized administrators only.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <Input
              label="Admin Email"
              type="email"
              placeholder="Enter your admin email"
              leftIcon={Mail}
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address'
                }
              })}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={Lock}
                required
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error Message */}
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.root.message}
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              size="lg"
            >
              Sign In as Admin
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-4">
            <div className="text-sm">
              <Link 
                to="/admin/forgot-password" 
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Need admin access? Contact your system administrator for account creation.
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you a regular user?{' '}
                <Link 
                  to="/login-user" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  User Login
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginAdmin;