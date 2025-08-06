import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Filter, 
  Search,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import MapComponent from '../../components/Map/MapComponent';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ISSUE_CATEGORIES = [
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' }
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const MapView = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    updateURLParams();
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      // Fetch all issues with location data for map display
      const allIssues = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore && currentPage <= 10) { // Limit to 10 pages max
        const response = await api.get(`/issues?limit=100&page=${currentPage}&sortBy=createdAt&sortOrder=desc`);
        const { issues, pagination } = response.data.data;
        
        // Only include issues with location data
        const issuesWithLocation = issues.filter(issue => 
          issue.location && 
          issue.location.coordinates && 
          issue.location.coordinates.length === 2
        );
        
        allIssues.push(...issuesWithLocation);
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
      toast.success('Map data refreshed');
    } catch (error) {
      toast.error('Failed to refresh map data');
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

  // Filter issues based on current filters
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !issue.title.toLowerCase().includes(searchLower) &&
          !issue.description.toLowerCase().includes(searchLower) &&
          !issue.category.toLowerCase().includes(searchLower) &&
          !`${issue.reportedBy?.firstName} ${issue.reportedBy?.lastName}`.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && issue.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [issues, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Prepare issues for map (MapComponent expects issues prop, not markers)
  const mapIssues = useMemo(() => {
    return filteredIssues.filter(issue => 
      issue.location && 
      issue.location.coordinates && 
      issue.location.coordinates.length === 2
    );
  }, [filteredIssues]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'in_progress': return 'text-blue-600';
      case 'resolved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading map data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Issues Map View
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Visualize all reported issues on an interactive map
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                leftIcon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
              >
                Filters
              </Button>
              <Button
                variant="outline"
                leftIcon={RefreshCw}
                onClick={refreshIssues}
                isLoading={refreshing}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card className="p-4">
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mapIssues.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mapIssues.filter(i => i.status === 'pending').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <RefreshCw className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mapIssues.filter(i => i.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mapIssues.filter(i => i.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={Search}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {ISSUE_CATEGORIES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <div style={{ height: '70vh', minHeight: '500px' }}>
              <MapComponent
                height="70vh"
                issues={mapIssues}
                selectedIssue={selectedIssue}
                onIssueSelect={(issue) => setSelectedIssue(issue)}
                center={mapIssues.length > 0 ? [
                  mapIssues[0].location.coordinates[1], // lat
                  mapIssues[0].location.coordinates[0]  // lng
                ] : [40.7128, -74.0060]}
                zoom={11}
                className="w-full h-full"
              />
            </div>
          </Card>
        </motion.div>

        {/* Selected Issue Details */}
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedIssue.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Reported by {selectedIssue.reportedBy?.firstName} {selectedIssue.reportedBy?.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <p className={`font-medium capitalize ${getStatusColor(selectedIssue.status)}`}>
                    {selectedIssue.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Priority:</span>
                  <p className={`font-medium capitalize ${getPriorityColor(selectedIssue.priority)}`}>
                    {selectedIssue.priority}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                  <p className="font-medium capitalize text-gray-900 dark:text-white">
                    {selectedIssue.category.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                <p className="text-gray-900 dark:text-white mt-1">
                  {selectedIssue.description}
                </p>
              </div>
              
              {selectedIssue.images && selectedIssue.images.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Images:</span>
                  <div className="flex space-x-2 mt-2">
                    {selectedIssue.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`Issue ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MapView;