import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  ArrowLeft,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';

const NotFound = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const suggestions = [
    {
      icon: Home,
      title: 'Go Home',
      description: 'Return to the homepage',
      href: '/',
      primary: true
    },
    {
      icon: Search,
      title: 'Browse Issues',
      description: 'View all reported issues',
      href: isAdmin ? '/admin/issues' : '/issues'
    },
    {
      icon: MapPin,
      title: 'Report Issue',
      description: 'Report a new civic issue',
      href: '/report-issue',
      show: isAuthenticated && !isAdmin
    },
    {
      icon: AlertTriangle,
      title: 'Admin Dashboard',
      description: 'Go to admin panel',
      href: '/admin',
      show: isAdmin
    }
  ].filter(item => item.show !== false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        {/* 404 Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative">
            {/* Large 404 Text */}
            <motion.h1 
              className="text-9xl font-bold text-gray-200 dark:text-gray-800 select-none"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              404
            </motion.h1>
            
            {/* Floating elements */}
            <motion.div
              className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-8 left-8 w-6 h-6 bg-purple-500 rounded-full"
              animate={{ 
                y: [0, -15, 0],
                x: [0, 10, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute top-16 left-16 w-4 h-4 bg-green-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          {/* Primary Action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              as={Link}
              to="/"
              leftIcon={Home}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Homepage
            </Button>
            <Button
              onClick={() => window.history.back()}
              leftIcon={ArrowLeft}
              variant="outline"
              size="lg"
            >
              Go Back
            </Button>
          </div>

          {/* Suggestions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Or try one of these:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <motion.div
                    key={suggestion.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                  >
                    <Link
                      to={suggestion.href}
                      className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please{' '}
            <a 
              href="mailto:support@civicreporter.com" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              contact support
            </a>
            {' '}or try refreshing the page.
          </p>
        </motion.div>

        {/* Fun Facts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            Did you know?
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            The HTTP 404 error code was named after room 404 at CERN where the original web servers were located. 
            When files couldn't be found, the error referenced this room number!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;