import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  MapPin,
  BarChart3,
  Settings,
  Eye,
  Filter,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import StatusBadge from '../../components/UI/StatusBadge';
import MapComponent from '../../components/Map/MapComponent';
import WeeklyReportCard from '../../components/Admin/WeeklyReportCard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    totalUsers: 0,
    todayIssues: 0,
    avgResolutionTime: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all issues for stats and display
      const issuesResponse = await api.get('/issues?limit=100');
      const allIssuesData = issuesResponse.data.data.issues;
      setAllIssues(allIssuesData);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const stats = {
        totalIssues: allIssuesData.length,
        pendingIssues: allIssuesData.filter(issue => issue.status === 'pending').length,
        inProgressIssues: allIssuesData.filter(issue => issue.status === 'in_progress').length,
        resolvedIssues: allIssuesData.filter(issue => issue.status === 'resolved').length,
        todayIssues: allIssuesData.filter(issue => new Date(issue.createdAt) >= todayStart).length,
        totalUsers: 0 // Will be updated if we have user stats endpoint
      };

      // Calculate average resolution time for resolved issues
      const resolvedIssues = allIssuesData.filter(issue => issue.status === 'resolved' && issue.actualResolutionTime);
      if (resolvedIssues.length > 0) {
        const totalResolutionTime = resolvedIssues.reduce((sum, issue) => sum + issue.actualResolutionTime, 0);
        stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedIssues.length);
      }

      setStats(stats);

      // Set recent issues (last 10)
      const sortedByDate = [...allIssuesData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentIssues(sortedByDate.slice(0, 10));

      // Set urgent issues
      setUrgentIssues(allIssuesData.filter(issue => 
        issue.priority === 'urgent' && issue.status !== 'resolved'
      ));

      // Try to fetch user stats if endpoint exists
      try {
        const usersResponse = await api.get('/users/stats');
        setStats(prev => ({ ...prev, totalUsers: usersResponse.data.data.totalUsers }));
      } catch (error) {
        // User stats endpoint might not exist, that's okay
        console.log('User stats not available');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await api.put(`/issues/${issueId}`, { status: newStatus });
      toast.success('Issue status updated successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast.error('Failed to update issue status');
    }
  };

  const filteredIssues = statusFilter === 'all' 
    ? allIssues 
    : allIssues.filter(issue => issue.status === statusFilter);

  const statCards = [
    {
      title: 'Total Issues',
      value: stats.totalIssues,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      trend: `+${stats.todayIssues} today`
    },
    {
      title: 'Pending',
      value: stats.pendingIssues,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      trend: 'Needs attention'
    },
    {
      title: 'In Progress',
      value: stats.inProgressIssues,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      trend: 'Being resolved'
    },
    {
      title: 'Resolved',
      value: stats.resolvedIssues,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      trend: stats.avgResolutionTime > 0 ? `Avg: ${stats.avgResolutionTime}h` : 'Great work!'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
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
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back, {user?.firstName}. Here's an overview of civic issues.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <Button
                as={Link}
                to="/admin/issues"
                variant="outline"
                leftIcon={Eye}
              >
                View All Issues
              </Button>
              <Button
                as={Link}
                to="/admin/settings"
                variant="outline"
                leftIcon={Settings}
              >
                Settings
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
              className={`${stat.bgColor} ${stat.borderColor} border cursor-pointer`}
              hover={true}
              onClick={() => setStatusFilter(stat.title.toLowerCase().replace(' ', '_'))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Urgent Issues Alert */}
        {urgentIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200">
                    {urgentIssues.length} Urgent Issue{urgentIssues.length !== 1 ? 's' : ''} Require Immediate Attention
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    These issues have been marked as urgent and need immediate resolution.
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/admin/issues?priority=urgent"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                >
                  View Urgent Issues
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Issues */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Issues
                </h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <Button
                    as={Link}
                    to="/admin/issues"
                    variant="outline"
                    size="sm"
                  >
                    View All
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentIssues.slice(0, 8).map((issue) => (
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {issue.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {issue.address?.city || 'Location not available'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            By {issue.reportedBy?.firstName} {issue.reportedBy?.lastName} • {new Date(issue.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <StatusBadge status={issue.status} size="sm" />
                          {issue.priority === 'urgent' && (
                            <StatusBadge priority={issue.priority} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {issue.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(issue._id, 'in_progress');
                          }}
                        >
                          Start
                        </Button>
                      )}
                      {issue.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(issue._id, 'resolved');
                          }}
                        >
                          Resolve
                        </Button>
                      )}
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
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Issues Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Issues Overview Map
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredIssues.length} issues displayed
                </p>
              </div>

              <MapComponent
                height="400px"
                issues={filteredIssues}
                selectedIssue={selectedIssue}
                onIssueSelect={(issue) => {
                  setSelectedIssue(issue);
                  window.open(`/issue/${issue._id}`, '_blank');
                }}
                className="rounded-lg"
              />
            </Card>
          </motion.div>
        </div>

        {/* Weekly Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 weekly-report-section"
        >
          <WeeklyReportCard />
        </motion.div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Admin Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/admin/issues?status=pending"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  onClick={() => toast.success(`Viewing ${stats.pendingIssues} pending issues`)}
                >
                  <Clock className="w-8 h-8 mb-2 text-yellow-600" />
                  <span className="font-medium">Review Pending</span>
                  <span className="text-xs text-gray-500 mt-1">{stats.pendingIssues} issues</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/admin/issues?priority=urgent"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => toast.success(`Viewing ${urgentIssues.length} urgent issues`)}
                >
                  <AlertTriangle className="w-8 h-8 mb-2 text-red-600" />
                  <span className="font-medium">Urgent Issues</span>
                  <span className="text-xs text-gray-500 mt-1">{urgentIssues.length} urgent</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/admin/map"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => toast.success('Opening geographic map view')}
                >
                  <MapPin className="w-8 h-8 mb-2 text-blue-600" />
                  <span className="font-medium">Map View</span>
                  <span className="text-xs text-gray-500 mt-1">Geographic overview</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  as={Link}
                  to="/admin/issues"
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  onClick={() => toast.success(`Viewing all ${stats.totalIssues} issues`)}
                >
                  <Eye className="w-8 h-8 mb-2 text-purple-600" />
                  <span className="font-medium">All Issues</span>
                  <span className="text-xs text-gray-500 mt-1">{stats.totalIssues} total</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto w-full border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => {
                    const reportSection = document.querySelector('.weekly-report-section');
                    if (reportSection) {
                      reportSection.scrollIntoView({ behavior: 'smooth' });
                      toast.success('Generating weekly AI report');
                    }
                  }}
                >
                  <FileText className="w-8 h-8 mb-2 text-green-600" />
                  <span className="font-medium">Weekly Report</span>
                  <span className="text-xs text-gray-500 mt-1">AI-generated insights</span>
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;