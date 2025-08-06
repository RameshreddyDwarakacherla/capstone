import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card from '../components/UI/Card';
import { ConfirmModal } from '../components/UI/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfileValue('firstName', user.firstName || '');
      setProfileValue('lastName', user.lastName || '');
      setProfileValue('email', user.email || '');
      setProfileValue('phone', user.phone || '');
      setProfileValue('address', user.address || '');
    }
  }, [user, setProfileValue]);

  const onUpdateProfile = async (data) => {
    setIsUpdating(true);
    try {
      const response = await api.put('/auth/profile', {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address
      });

      if (response.data.success) {
        await updateUser(response.data.data.user);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      toast.success('Password changed successfully');
      setShowChangePassword(false);
      resetPassword();
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsUpdating(true);
    try {
      await api.delete('/auth/profile');
      toast.success('Account deleted successfully');
      // The auth context should handle logout automatically
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    resetProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="text-center">
                {/* Avatar */}
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* User Info */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {user?.email}
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Shield className="w-4 h-4 mr-1" />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </div>

                {/* Account Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user?.issueCount || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Issues Reported
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user?.resolvedCount || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Resolved
                      </p>
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Member since {new Date(user?.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Personal Information */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Edit}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={X}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={Save}
                      isLoading={isUpdating}
                      onClick={handleProfileSubmit(onUpdateProfile)}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    leftIcon={User}
                    disabled={!isEditing}
                    error={profileErrors.firstName?.message}
                    {...registerProfile('firstName', {
                      required: 'First name is required'
                    })}
                  />
                  <Input
                    label="Last Name"
                    leftIcon={User}
                    disabled={!isEditing}
                    error={profileErrors.lastName?.message}
                    {...registerProfile('lastName', {
                      required: 'Last name is required'
                    })}
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  leftIcon={Mail}
                  disabled={true} // Email cannot be changed
                  {...registerProfile('email')}
                  className="bg-gray-50 dark:bg-gray-700"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  leftIcon={Phone}
                  disabled={!isEditing}
                  placeholder="(555) 123-4567"
                  error={profileErrors.phone?.message}
                  {...registerProfile('phone')}
                />

                <Input
                  label="Address"
                  leftIcon={MapPin}
                  disabled={!isEditing}
                  placeholder="123 Main St, City, State 12345"
                  error={profileErrors.address?.message}
                  {...registerProfile('address')}
                />
              </form>
            </Card>

            {/* Security Settings */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Security Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Password
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last updated {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                  >
                    Change Password
                  </Button>
                </div>

                {/* Change Password Form */}
                {showChangePassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                      <div className="relative">
                        <Input
                          label="Current Password"
                          type={showPasswords.current ? 'text' : 'password'}
                          error={passwordErrors.currentPassword?.message}
                          {...registerPassword('currentPassword', {
                            required: 'Current password is required'
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          label="New Password"
                          type={showPasswords.new ? 'text' : 'password'}
                          error={passwordErrors.newPassword?.message}
                          {...registerPassword('newPassword', {
                            required: 'New password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                              message: 'Password must contain uppercase, lowercase, number, and special character'
                            }
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          label="Confirm New Password"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          error={passwordErrors.confirmPassword?.message}
                          {...registerPassword('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (value) =>
                              value === watchPassword('newPassword') || 'Passwords do not match'
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowChangePassword(false);
                            resetPassword();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          isLoading={isUpdating}
                        >
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-6">
                Danger Zone
              </h3>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-200">
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including reported issues."
          confirmText="Delete Account"
          type="danger"
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
};

export default Profile;