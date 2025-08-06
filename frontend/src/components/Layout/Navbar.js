import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  SunIcon, 
  MoonIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navigationItems = isAuthenticated 
    ? isAdmin 
      ? [
          { name: 'Dashboard', href: '/admin', icon: HomeIcon },
          { name: 'All Issues', href: '/admin/issues', icon: ClipboardDocumentListIcon },
          { name: 'Map View', href: '/admin/map', icon: MapIcon },
        ]
      : [
          { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
          { name: 'Report Issue', href: '/report-issue', icon: PlusCircleIcon },
          { name: 'My Issues', href: '/my-issues', icon: ClipboardDocumentListIcon },
        ]
    : [
        { name: 'Home', href: '/', icon: HomeIcon },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-sm">CR</span>
            </motion.div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Civic Reporter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.href)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </motion.button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                    console.log('Profile menu toggled:', !isProfileMenuOpen);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileMenuOpen(false);
                            console.log('Navigating to Profile');
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileMenuOpen(false);
                            console.log('Navigating to Settings');
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Signing out');
                            handleLogout();
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login-user"
                  className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup-user"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActivePath(item.href)
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {!isAuthenticated && (
                <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/login-user"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup-user"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menus */}
      {(isMobileMenuOpen || isProfileMenuOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsProfileMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;