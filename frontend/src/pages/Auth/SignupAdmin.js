import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  Building,
  Shield,
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';

const SignupAdmin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Prepare admin data
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        department: data.department,
        position: data.position,
        employeeId: data.employeeId
      };

      const result = await registerUser(userData, 'admin');
      
      if (result.success) {
        navigate('/admin');
      } else {
        setError('root', { message: result.error });
      }
    } catch (error) {
      setError('root', { message: 'Admin registration failed. Please try again.' });
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
        className="w-full max-w-2xl"
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
              Admin Registration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Request administrative access to manage civic issues
            </p>
          </div>

          {/* Admin Notice */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Admin Account Verification Required
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  All admin registrations require approval from existing administrators. 
                  Please provide accurate information and official contact details.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter your first name"
                leftIcon={User}
                required
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
              />
              
              <Input
                label="Last Name"
                placeholder="Enter your last name"
                leftIcon={User}
                required
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
              />
            </div>

            {/* Contact Information */}
            <Input
              label="Official Email Address"
              type="email"
              placeholder="Enter your official email"
              leftIcon={Mail}
              required
              helperText="Please use your official government or organization email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address'
                }
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your official phone number"
              leftIcon={Phone}
              required
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[\d\s\-\(\)\+]+$/,
                  message: 'Please enter a valid phone number'
                }
              })}
            />

            {/* Official Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5" />
                Official Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Department"
                  placeholder="e.g., Public Works, Transportation"
                  leftIcon={Building}
                  required
                  error={errors.department?.message}
                  {...register('department', {
                    required: 'Department is required'
                  })}
                />
                
                <Input
                  label="Position/Title"
                  placeholder="e.g., Manager, Supervisor, Officer"
                  required
                  error={errors.position?.message}
                  {...register('position', {
                    required: 'Position is required'
                  })}
                />
              </div>
              
              <Input
                label="Employee ID"
                placeholder="Enter your employee ID"
                required
                helperText="This will be used for verification purposes"
                error={errors.employeeId?.message}
                {...register('employeeId', {
                  required: 'Employee ID is required'
                })}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  leftIcon={Lock}
                  required
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 12,
                      message: 'Admin password must be at least 12 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain uppercase, lowercase, number, and special character'
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

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  leftIcon={Lock}
                  required
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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

            {/* Terms and Conditions */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  {...register('terms', {
                    required: 'You must accept the terms and conditions'
                  })}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <Link to="/admin/terms" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
                    Admin Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="verification"
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  {...register('verification', {
                    required: 'You must confirm the accuracy of your information'
                  })}
                />
                <label htmlFor="verification" className="text-sm text-gray-600 dark:text-gray-400">
                  I confirm that all provided information is accurate and I am authorized 
                  to request administrative access on behalf of my organization.
                </label>
              </div>
            </div>

            {errors.terms && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.terms.message}
              </p>
            )}
            {errors.verification && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.verification.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              size="lg"
            >
              Submit Admin Registration
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Already have an admin account?{' '}
              <Link 
                to="/login-admin" 
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                Sign in here
              </Link>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you a regular user?{' '}
                <Link 
                  to="/signup-user" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  User Registration
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupAdmin;