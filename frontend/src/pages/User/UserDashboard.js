import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Eye,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import StatusBadge from '../../components/UI/StatusBadge';
import MapComponent from '../../components/Map/MapComponent';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const [userIssues, setUserIssues] = useState([]);
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's issues
      const userIssuesResponse = await api.get(`/issues?reportedBy=${user._id}&limit=10`);
      const userIssuesData = userIssuesResponse.data.data.issues;
      setUserIssues(userIssuesData);

      // Calculate stats
      const stats = userIssuesData.reduce((acc, issue) => {
        acc.total++;
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, { total: 0, pending: 0, in_progress: 0, resolved: 0 });
      setStats(stats);

      // Fetch nearby issues (example coordinates - you can use user's location)
      try {
        const nearbyResponse = await api.get('/issues?latitude=40.7589&longitude=-73.9851&radius=5000&limit=20');
        setNearbyIssues(nearbyResponse.data.data.issues);
      } catch (error) {
        console.error('Error fetching nearby issues:', error);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track your reported issues and discover what's happening in your community.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                as={Link}
                to="/report-issue"
                leftIcon={Plus}
                size="lg"
                className="w-full sm:w-auto"
              >
                Report New Issue
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat, index) => (
            <Card
              key={stat.title}
              className={`${stat.bgColor} ${stat.borderColor} border`}
              hover={false}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Issues */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Recent Reports
                </h2>
                <Button
                  as={Link}
                  to="/my-issues"
                  variant="outline"
                  size="sm"
                >
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {userIssues.length > 0 ? (
                  userIssues.slice(0, 5).map((issue) => (
                    <motion.div
                      key={issue._id}
                      whileHover={{ x: 4 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer"
                      onClick={() => setSelectedIssue(issue)}
                    >
                      {issue.images && issue.images.length > 0 && (
                        <img
                          src={issue.images[0].url}
                          alt={issue.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {issue.address?.formatted || 'Location not available'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <StatusBadge status={issue.status} size="sm" />
                        <Button
                          variant="ghost"
                          size="sm"
                          as={Link}
                          to={`/issue/${issue._id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No issues reported yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start by reporting your first civic issue.
                    </p>
                    <Button as={Link} to="/report-issue" leftIcon={Plus}>
                      Report Issue
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Community Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Community Issues Map
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {nearbyIssues.length} nearby issues
                </p>
              </div>

              <MapComponent
                height="400px"
                issues={nearbyIssues}
                selectedIssue={selectedIssue}
                onIssueSelect={(issue) => window.open(`/issue/${issue._id}`, '_blank')}
                className="rounded-lg"
              />
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/report-issue"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => toast.success('Opening issue report form')}
                >
                  <Plus className="w-8 h-8 mb-2 text-green-600" />
                  <span className="font-medium">Report New Issue</span>
                  <span className="text-xs text-gray-500 mt-1">Help your community</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/my-issues"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => toast.success(`Viewing your ${stats.total} reports`)}
                >
                  <Eye className="w-8 h-8 mb-2 text-blue-600" />
                  <span className="font-medium">View My Reports</span>
                  <span className="text-xs text-gray-500 mt-1">{stats.total} reports</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/profile"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  onClick={() => toast.success('Opening profile settings')}
                >
                  <User className="w-8 h-8 mb-2 text-purple-600" />
                  <span className="font-medium">Update Profile</span>
                  <span className="text-xs text-gray-500 mt-1">Manage account</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/issues"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => toast.success(`Exploring ${nearbyIssues.length} community issues`)}
                >
                  <MapPin className="w-8 h-8 mb-2 text-orange-600" />
                  <span className="font-medium">Browse All Issues</span>
                  <span className="text-xs text-gray-500 mt-1">{nearbyIssues.length} nearby</span>
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default UserDashboard;