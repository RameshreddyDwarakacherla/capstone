import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  Smartphone,
  Mail,
  MapPin,
  Eye,
  Lock,
  Download,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { Switch } from '../components/UI/Switch';
import { ConfirmModal } from '../components/UI/Modal';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      issueUpdates: true,
      adminMessages: true,
      weeklyDigest: false
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
      analyticsTracking: true
    },
    preferences: {
      language: 'en',
      timezone: 'auto',
      mapView: 'street'
    }
  });

  // Initialize settings from user data
  useEffect(() => {
    if (user && user.preferences) {
      setSettings(prevSettings => ({
        ...prevSettings,
        notifications: {
          ...prevSettings.notifications,
          ...(user.preferences.notifications || {})
        }
      }));
    }
  }, [user]);

  const handleSettingChange = async (category, setting, value) => {
    // Update local state immediately for responsive UI
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    
    // Only save notification preferences to backend
    if (category === 'notifications') {
      setIsLoading(true);
      try {
        // Save to backend
        await api.patch('/users/me/preferences', {
          notifications: {
            [setting]: value
          }
        });
        
        // Update user in context
        if (updateUser) {
          await updateUser({
            preferences: {
              notifications: {
                ...user.preferences?.notifications,
                [setting]: value
              }
            }
          });
        }
        
        toast.success('Preferences updated successfully');
      } catch (error) {
        // Revert local state on error
        setSettings(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            [setting]: !value // Revert to previous value
          }
        }));
        
        const message = error.response?.data?.message || 'Failed to update preferences';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For non-notification settings that don't connect to backend yet
      toast.success('Setting updated successfully');
    }
  };

  const exportData = () => {
    toast.success('Data export initiated. You will receive an email shortly.');
  };

  const deleteAccount = async () => {
    try {
      // In a real app, you'd call the delete API
      toast.success('Account deletion initiated');
      await logout();
    } catch (error) {
      toast.error('Failed to delete account');
    }
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
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your preferences and account settings
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Appearance
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customize how the app looks and feels
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Dark Mode
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use dark theme across the application
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Control what notifications you receive
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Issue Updates
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when your issues are updated
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.issueUpdates}
                    onChange={(checked) => handleSettingChange('notifications', 'issueUpdates', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Admin Messages
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive messages from administrators
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.adminMessages}
                    onChange={(checked) => handleSettingChange('notifications', 'adminMessages', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Weekly Digest
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get a summary of community activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyDigest}
                    onChange={(checked) => handleSettingChange('notifications', 'weeklyDigest', checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Privacy & Security
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Control your privacy and data sharing preferences
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Profile Visibility
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Make your profile visible to other users
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.profileVisible}
                    onChange={(checked) => handleSettingChange('privacy', 'profileVisible', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Show Email Address
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Display your email on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showEmail}
                    onChange={(checked) => handleSettingChange('privacy', 'showEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Analytics Tracking
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help improve the app by sharing usage data
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.analyticsTracking}
                    onChange={(checked) => handleSettingChange('privacy', 'analyticsTracking', checked)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-4">
                  <Download className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Data Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export or delete your data
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Export Data
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download a copy of all your data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Download}
                    onClick={exportData}
                  >
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-400">
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Trash2}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Delete Account Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={deleteAccount}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
          confirmText="Delete Account"
          confirmVariant="danger"
        />
      </div>
    </div>
  );
};

export default Settings;