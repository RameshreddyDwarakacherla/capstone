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
  MapPin,
  UserPlus 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';

const SignupUser = () => {
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
      // Prepare user data
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone ? data.phone.replace(/[\s\-\(\)]/g, '') : undefined, // Clean phone number
        address: {
          street: data.street || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zipCode: data.zipCode || undefined
        }
      };

      const result = await registerUser(userData, 'user');
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError('root', { message: result.error });
      }
    } catch (error) {
      setError('root', { message: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
              className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Join Civic Reporter
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create your account to start reporting civic issues
            </p>
          </div>

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
              label="Email Address"
              type="email"
              placeholder="Enter your email"
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

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number (digits only, optional + prefix)"
              leftIcon={Phone}
              error={errors.phone?.message}
              {...register('phone', {
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: 'Please enter a valid phone number (10-15 digits, optional + prefix)'
                }
              })}
            />

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address (Optional)
              </h3>
              
              <Input
                label="Street Address"
                placeholder="Enter your street address"
                error={errors.street?.message}
                {...register('street')}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="City"
                  placeholder="City"
                  error={errors.city?.message}
                  {...register('city')}
                />
                
                <Input
                  label="State"
                  placeholder="State"
                  error={errors.state?.message}
                  {...register('state')}
                />
                
                <Input
                  label="ZIP Code"
                  placeholder="ZIP Code"
                  error={errors.zipCode?.message}
                  {...register('zipCode')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  leftIcon={Lock}
                  required
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\\/`~])/,
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
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                {...register('terms', {
                  required: 'You must accept the terms and conditions'
                })}
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.terms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                to="/login-user" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign in here
              </Link>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you an admin?{' '}
                <Link 
                  to="/signup-admin" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Admin Registration
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupUser;