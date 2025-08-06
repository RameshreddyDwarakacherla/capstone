import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  MapPin, 
  Calendar,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import StatusBadge from '../../components/UI/StatusBadge';
import Modal from '../../components/UI/Modal';
import MapComponent from '../../components/Map/MapComponent';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyIssues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' }
  ];

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterAndSortIssues();
  }, [issues, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/issues?reportedBy=${user._id}&limit=100`);
      setIssues(response.data.data.issues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load your issues');
    } finally {
      setLoading(false);
    }
  };

  const refreshIssues = async () => {
    try {
      setRefreshing(true);
      await fetchIssues();
      toast.success('Issues refreshed');
    } catch (error) {
      toast.error('Failed to refresh issues');
    } finally {
      setRefreshing(false);
    }
  };

  const filterAndSortIssues = () => {
    let filtered = [...issues];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredIssues(filtered);
  };

  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
  };

  const IssueCard = ({ issue, isGridView = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`cursor-pointer ${isGridView ? '' : 'mb-4'}`}
      onClick={() => handleViewIssue(issue)}
    >
      <Card className={`transition-all duration-200 hover:shadow-lg ${isGridView ? 'h-full' : ''}`}>
        <div className={`${isGridView ? 'space-y-4' : 'flex items-center space-x-4'}`}>
          {/* Image */}
          {issue.images && issue.images.length > 0 && (
            <div className={`${isGridView ? 'w-full h-32' : 'w-16 h-16'} flex-shrink-0`}>
              <img
                src={issue.images[0].url}
                alt={issue.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className={`${isGridView ? '' : 'flex-1 min-w-0'}`}>
            <div className={`${isGridView ? 'space-y-2' : 'flex items-start justify-between'}`}>
              <div className={`${isGridView ? '' : 'flex-1 min-w-0'}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {issue.title}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 ${isGridView ? 'text-sm line-clamp-2' : 'text-sm truncate'}`}>
                  {issue.description}
                </p>
              </div>
              
              {!isGridView && (
                <div className="flex items-center space-x-2 ml-4">
                  <StatusBadge status={issue.status} size="sm" />
                  <StatusBadge priority={issue.priority} size="sm" />
                </div>
              )}
            </div>

            {/* Meta Information */}
            <div className={`${isGridView ? 'space-y-2' : 'mt-2 flex items-center justify-between'}`}>
              <div className={`${isGridView ? 'space-y-1' : 'flex items-center space-x-4'} text-sm text-gray-500 dark:text-gray-400`}>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate">
                    {issue.address?.city || 'Location not available'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                {issue.aiAnalysis?.description && (
                  <div className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    AI Analyzed
                  </div>
                )}
              </div>

              {isGridView && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={issue.status} size="sm" />
                    <StatusBadge priority={issue.priority} size="sm" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    as={Link}
                    to={`/issue/${issue._id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {!isGridView && (
                <Button
                  variant="ghost"
                  size="sm"
                  as={Link}
                  to={`/issue/${issue._id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your issues...</p>
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
                My Issues
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track and manage your reported civic issues
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <Button
                onClick={refreshIssues}
                isLoading={refreshing}
                variant="outline"
                leftIcon={RefreshCw}
                size="sm"
              >
                Refresh
              </Button>
              <Button
                onClick={() => setShowMapModal(true)}
                variant="outline"
                leftIcon={MapPin}
                size="sm"
              >
                Map View
              </Button>
              <Button
                as={Link}
                to="/report-issue"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Report New Issue
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={Search}
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Sort Order */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredIssues.length} of {issues.length} issues
          </p>
        </motion.div>

        {/* Issues List/Grid */}
        {filteredIssues.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue._id} issue={issue} isGridView={false} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue._id} issue={issue} isGridView={true} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No matching issues found' : 'No issues reported yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by reporting your first civic issue'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button as={Link} to="/report-issue">
                Report Your First Issue
              </Button>
            )}
          </motion.div>
        )}

        {/* Map Modal */}
        <Modal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          title="Issues Map View"
          size="xl"
        >
          <MapComponent
            height="500px"
            issues={filteredIssues}
            selectedIssue={selectedIssue}
            onIssueSelect={(issue) => {
              setSelectedIssue(issue);
              setShowMapModal(false);
              window.open(`/issue/${issue._id}`, '_blank');
            }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default MyIssues;