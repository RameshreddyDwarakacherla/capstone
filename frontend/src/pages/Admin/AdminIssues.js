import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  MapPin, 
  Calendar,
  User,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCw,
  MessageSquare,
  Download,
  Plus
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

const AdminIssues = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list');
  const [showMapModal, setShowMapModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    priority: '',
    adminNote: '',
    noteIsPublic: false
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'duplicate', label: 'Duplicate' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'pothole', label: 'Pothole' },
    { value: 'street_light', label: 'Street Light' },
    { value: 'drainage', label: 'Drainage Problem' },
    { value: 'traffic_signal', label: 'Traffic Signal' },
    { value: 'road_damage', label: 'Road Damage' },
    { value: 'sidewalk', label: 'Sidewalk Issue' },
    { value: 'graffiti', label: 'Graffiti' },
    { value: 'garbage', label: 'Garbage/Litter' },
    { value: 'water_leak', label: 'Water Leak' },
    { value: 'park_maintenance', label: 'Park Maintenance' },
    { value: 'noise_complaint', label: 'Noise Complaint' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'category', label: 'Category' }
  ];

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterAndSortIssues();
    updateURLParams();
  }, [issues, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  const fetchIssues = async (page = 1) => {
    try {
      setLoading(true);
      // Use pagination to get all issues for admin - fetch multiple pages
      const allIssues = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore && currentPage <= 10) { // Limit to 10 pages max (1000 issues)
        const response = await api.get(`/issues?limit=100&page=${currentPage}&sortBy=createdAt&sortOrder=desc`);
        const { issues, pagination } = response.data.data;
        
        allIssues.push(...issues);
        hasMore = pagination.hasNextPage;
        currentPage++;
      }
      
      setIssues(allIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
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

  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    setSearchParams(params);
  };

  const filterAndSortIssues = () => {
    let filtered = [...issues];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${issue.reportedBy?.firstName} ${issue.reportedBy?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
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

  const handleUpdateIssue = (issue) => {
    setSelectedIssue(issue);
    setUpdateData({
      status: issue.status,
      priority: issue.priority,
      adminNote: '',
      noteIsPublic: false
    });
    setShowUpdateModal(true);
  };

  const submitUpdate = async () => {
    if (!selectedIssue) return;

    try {
      const updatePayload = {};
      
      if (updateData.status !== selectedIssue.status) {
        updatePayload.status = updateData.status;
      }
      
      if (updateData.priority !== selectedIssue.priority) {
        updatePayload.priority = updateData.priority;
      }
      
      if (updateData.adminNote.trim()) {
        updatePayload.adminNote = updateData.adminNote.trim();
        updatePayload.noteIsPublic = updateData.noteIsPublic;
      }

      await api.put(`/issues/${selectedIssue._id}`, updatePayload);
      
      toast.success('Issue updated successfully');
      setShowUpdateModal(false);
      fetchIssues(); // Refresh the list
    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue');
    }
  };

  const exportIssues = () => {
    // Create CSV content
    const csvContent = [
      // Header
      ['ID', 'Title', 'Category', 'Status', 'Priority', 'Reporter', 'Created', 'Location'].join(','),
      // Data rows
      ...filteredIssues.map(issue => [
        issue._id,
        `"${issue.title}"`,
        issue.category,
        issue.status,
        issue.priority,
        `"${issue.reportedBy?.firstName} ${issue.reportedBy?.lastName}"`,
        new Date(issue.createdAt).toLocaleDateString(),
        `"${issue.address?.formatted || 'N/A'}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civic-issues-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Issues exported successfully');
  };

  const IssueCard = ({ issue, isGridView = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`cursor-pointer ${isGridView ? '' : 'mb-4'}`}
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
                <div className={`${isGridView ? 'space-y-1 mt-2' : 'mt-1 flex items-center space-x-4'} text-xs text-gray-500 dark:text-gray-400`}>
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>{issue.reportedBy?.firstName} {issue.reportedBy?.lastName}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">
                      {issue.address?.city || 'Location not available'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {!isGridView && (
                <div className="flex items-center space-x-2 ml-4">
                  <StatusBadge status={issue.status} size="sm" />
                  <StatusBadge priority={issue.priority} size="sm" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={`${isGridView ? 'mt-4 space-y-2' : 'mt-2 flex items-center justify-between'}`}>
              {isGridView && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={issue.status} size="sm" />
                    <StatusBadge priority={issue.priority} size="sm" />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdateIssue(issue)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {isGridView ? '' : 'Update'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  as={Link}
                  to={`/issue/${issue._id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {isGridView ? '' : 'View'}
                </Button>
                {issue.adminNotes && issue.adminNotes.length > 0 && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs ml-1">{issue.adminNotes.length}</span>
                  </div>
                )}
              </div>
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
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading issues...</p>
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
                Manage Issues
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Review, update, and resolve civic issues reported by citizens
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
                onClick={exportIssues}
                variant="outline"
                leftIcon={Download}
                size="sm"
              >
                Export
              </Button>
              <Button
                onClick={() => setShowMapModal(true)}
                variant="outline"
                leftIcon={MapPin}
                size="sm"
              >
                Map View
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={Search}
              />

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

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
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
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
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
              No matching issues found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        )}

        {/* Update Modal */}
        <Modal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title="Update Issue"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitUpdate}>
                Update Issue
              </Button>
            </>
          }
        >
          {selectedIssue && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {selectedIssue.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIssue.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={updateData.priority}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Admin Note (Optional)</label>
                <textarea
                  rows={3}
                  value={updateData.adminNote}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, adminNote: e.target.value }))}
                  placeholder="Add a note about this update..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="noteIsPublic"
                    checked={updateData.noteIsPublic}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, noteIsPublic: e.target.checked }))}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="noteIsPublic" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Make note visible to reporter
                  </label>
                </div>
              </div>
            </div>
          )}
        </Modal>

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

export default AdminIssues;