import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPinIcon, 
  CameraIcon, 
  BoltIcon, 
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const features = [
    {
      icon: CameraIcon,
      title: 'AI-Powered Reporting',
      description: 'Upload photos and let AI automatically analyze and categorize civic issues with smart descriptions.'
    },
    {
      icon: MapPinIcon,
      title: 'Location Intelligence',  
      description: 'Automatic geolocation capture with precise mapping to help authorities find and resolve issues quickly.'
    },
    {
      icon: BoltIcon,
      title: 'Real-time Updates',
      description: 'Track your reported issues from submission to resolution with live status updates and notifications.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with role-based access control to protect citizen data and maintain privacy.'
    },
    {
      icon: UserGroupIcon,
      title: 'Community Impact',
      description: 'Join thousands of citizens making their communities better by reporting and tracking infrastructure issues.'
    },
    {
      icon: ClockIcon,
      title: 'Fast Resolution',
      description: 'Streamlined admin workflows ensure reported issues are prioritized and resolved efficiently.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Issues Reported' },
    { number: '85%', label: 'Resolution Rate' },
    { number: '24h', label: 'Avg Response Time' },
    { number: '50+', label: 'Cities Covered' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Report. Track. 
              <span className="text-primary-600 dark:text-primary-400"> Transform.</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Empower your community with AI-powered civic issue reporting. 
              From potholes to broken streetlights, make your voice heard and drive real change.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link
                to="/signup-user"
                className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
              >
                Start Reporting Issues
              </Link>
              
              <Link
                to="/login-admin"
                className="btn-outline text-lg px-8 py-4 w-full sm:w-auto"
              >
                Admin Dashboard
              </Link>
            </motion.div>
          </div>

          {/* Hero Image/Animation */}
          <motion.div 
            className="mt-16 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    How It Works
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <span className="text-gray-700 dark:text-gray-300">Snap a photo of the issue</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <span className="text-gray-700 dark:text-gray-300">AI analyzes and categorizes automatically</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <span className="text-gray-700 dark:text-gray-300">Location is captured instantly</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <span className="text-gray-700 dark:text-gray-300">Track progress until resolution</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl p-6 text-center">
                  <CameraIcon className="w-20 h-20 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                  <p className="text-primary-800 dark:text-primary-200 font-medium">
                    Smart AI-powered reporting makes civic engagement effortless
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Modern Cities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built with cutting-edge technology to make civic reporting seamless, efficient, and impactful.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-soft hover:shadow-medium transition-shadow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of citizens who are actively improving their communities. 
              Your reports lead to real change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup-user"
                className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Report Your First Issue
              </Link>
              <Link
                to="/login-user"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CR</span>
              </div>
              <span className="text-xl font-bold">Civic Reporter</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering communities through technology and civic engagement.
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Civic Reporter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;