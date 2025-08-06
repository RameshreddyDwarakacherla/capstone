import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin, 
  Calendar,
  User,
  Camera,
  MessageSquare,
  Edit,
  Flag,
  Share2,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import MapComponent from '../components/Map/MapComponent';
import Modal from '../components/UI/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminNote: '',
    noteIsPublic: false
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchIssueDetails();
  }, [id]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/issues/${id}`);
      setIssue(response.data.data.issue);
      
      // Fetch comments if available
      try {
        const commentsResponse = await api.get(`/issues/${id}/comments`);
        setComments(commentsResponse.data.data.comments || []);
      } catch (error) {
        // Comments endpoint might not exist, that's okay
        console.log('Comments not available');
      }
    } catch (error) {
      console.error('Error fetching issue details:', error);
      if (error.response?.status === 404) {
        toast.error('Issue not found');
        navigate('/');
      } else {
        toast.error('Failed to load issue details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!updateData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      const payload = { status: updateData.status };
      
      if (updateData.adminNote.trim()) {
        payload.adminNote = updateData.adminNote.trim();
        payload.noteIsPublic = updateData.noteIsPublic;
      }

      await api.put(`/issues/${id}`, payload);
      toast.success('Issue updated successfully');
      setShowUpdateModal(false);
      fetchIssueDetails(); // Refresh data
    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: issue.title,
          text: issue.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'in_progress':
        return AlertTriangle;
      case 'resolved':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Issue Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The issue you're looking for doesn't exist or has been removed.
          </p>
          <Button as={Link} to="/">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(issue.status);
  const canEdit = isAdmin || (user && user._id === issue.reportedBy?._id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                leftIcon={ArrowLeft}
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Issue Details
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  ID: {issue._id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={Share2}
                onClick={handleShare}
              >
                Share
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Edit}
                  onClick={() => {
                    setUpdateData({
                      status: issue.status,
                      adminNote: '',
                      noteIsPublic: false
                    });
                    setShowUpdateModal(true);
                  }}
                >
                  Update
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {issue.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>
                          {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{issue.views || 0} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={issue.status} />
                    <StatusBadge priority={issue.priority} />
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* AI Analysis */}
                {issue.aiAnalysis && (
                  <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                      AI Analysis
                    </h3>
                    <p className="text-purple-800 dark:text-purple-300 text-sm">
                      {issue.aiAnalysis.description || 'Analysis pending...'}
                    </p>
                    {issue.aiAnalysis.suggestedCategory && (
                      <p className="text-purple-700 dark:text-purple-400 text-xs mt-2">
                        Suggested category: {issue.aiAnalysis.suggestedCategory}
                      </p>
                    )}
                  </div>
                )}

                {/* Location */}
                <div className="mt-6 flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{issue.address?.formatted || 'Address not available'}</span>
                </div>
              </Card>
            </motion.div>

            {/* Images */}
            {issue.images && issue.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <div className="flex items-center mb-4">
                    <Camera className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Images ({issue.images.length})
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {issue.images.map((image, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => handleImageClick(image)}
                      >
                        <img
                          src={image.url}
                          alt={`Issue image ${index + 1}`}
                          className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        />
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Admin Notes */}
            {isAdmin && issue.adminNotes && issue.adminNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <div className="flex items-center mb-4">
                    <MessageSquare className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Admin Notes
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {issue.adminNotes.map((note, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          note.isPublic 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {note.addedBy?.firstName} {note.addedBy?.lastName}
                          </span>
                          <div className="flex items-center space-x-2">
                            {note.isPublic && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                Public
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Status Timeline
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      issue.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Reported</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(issue.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {issue.status !== 'pending' && (
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        issue.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">In Progress</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {issue.statusUpdatedAt ? new Date(issue.statusUpdatedAt).toLocaleString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {issue.status === 'resolved' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">Resolved</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Issue Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Issue Details
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {issue.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <StatusBadge priority={issue.priority} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reporter:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                    </span>
                  </div>
                  {issue.assignedTo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Assigned to:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {issue.assignedTo.firstName} {issue.assignedTo.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Location Map */}
            {issue.location && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Location
                  </h3>
                  
                  <MapComponent
                    height="200px"
                    center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                    issues={[issue]}
                    zoom={16}
                    className="rounded-lg"
                  />
                  
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>{issue.address?.formatted}</p>
                    <p className="text-xs mt-1">
                      {issue.location.coordinates[1].toFixed(6)}, {issue.location.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        <Modal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          size="xl"
          title="Issue Image"
        >
          {selectedImage && (
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt="Issue image"
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
              <div className="mt-4 flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  leftIcon={Download}
                  onClick={() => window.open(selectedImage.url, '_blank')}
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </Modal>

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
              <Button onClick={handleStatusUpdate} isLoading={updating}>
                Update Issue
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Admin Note (Optional)</label>
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
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="noteIsPublic" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Make note visible to reporter
                </label>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default IssueDetails;