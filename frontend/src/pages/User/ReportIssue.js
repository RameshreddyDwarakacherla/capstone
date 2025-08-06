import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { 
  MapPin, 
  Camera, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Loader,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import ImageUpload from '../../components/UI/ImageUpload';
import MapComponent from '../../components/Map/MapComponent';
import useGeolocation from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../services/locationService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ISSUE_CATEGORIES = [
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

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', description: 'Minor issues that can wait' },
  { value: 'medium', label: 'Medium Priority', description: 'Standard issues requiring attention' },
  { value: 'high', label: 'High Priority', description: 'Issues that need quick resolution' },
  { value: 'urgent', label: 'Urgent', description: 'Safety hazards requiring immediate attention' }
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [autoAddress, setAutoAddress] = useState(null);
  
  const { location, loading: locationLoading, getCurrentLocation } = useGeolocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    trigger
  } = useForm({
    defaultValues: {
      category: '',
      priority: 'medium',
      title: '',
      description: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    }
  });

  const watchedCategory = watch('category');

  // Auto-fill location when GPS location is obtained
  useEffect(() => {
    if (location) {
      setSelectedLocation({
        lat: location.lat,
        lng: location.lng
      });
      fetchAddressFromCoordinates(location.lat, location.lng);
    }
  }, [location]);

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      setAddressLoading(true);
      const address = await reverseGeocode(lat, lng);
      setAutoAddress(address);
      
      // Auto-fill form fields
      setValue('address.street', address.street || '');
      setValue('address.city', address.city || '');
      setValue('address.state', address.state || '');
      setValue('address.zipCode', address.zipCode || '');
      
      toast.success('Address automatically detected!');
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Could not detect address from location');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleLocationSelect = (coordinates) => {
    setSelectedLocation({
      lat: coordinates.lat,
      lng: coordinates.lng
    });
    fetchAddressFromCoordinates(coordinates.lat, coordinates.lng);
  };

  const handleStepValidation = async (step) => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = await trigger(['category', 'title', 'description']);
        break;
      case 2:
        isValid = selectedLocation !== null;
        if (!isValid) {
          toast.error('Please select a location for the issue');
        }
        break;
      case 3:
        // Images are optional, so always valid
        isValid = true;
        break;
    }
    
    if (isValid) {
      setCurrentStep(step + 1);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedLocation) {
      toast.error('Please select a location for the issue');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare form data
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('priority', data.priority);
      
      // Add location data
      const locationData = {
        type: 'Point',
        coordinates: [selectedLocation.lng, selectedLocation.lat]
      };
      formData.append('location', JSON.stringify(locationData));
      
      // Add address data
      const addressData = {
        street: data.address.street || '',
        city: data.address.city || '',
        state: data.address.state || '',
        zipCode: data.address.zipCode || '',
        formatted: autoAddress?.formatted || `${data.address.street || ''}, ${data.address.city || ''}, ${data.address.state || ''} ${data.address.zipCode || ''}`.trim()
      };
      formData.append('address', JSON.stringify(addressData));
      
      // Add images
      images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      const response = await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        toast.success('Issue reported successfully!');
        navigate('/my-issues');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      
      // Show detailed validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const firstError = error.response.data.errors[0];
        toast.error(`Validation Error: ${firstError.message} (${firstError.field})`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit issue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Issue Details
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us about the civic issue you'd like to report.
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Issue Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ISSUE_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      watchedCategory === category.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      value={category.value}
                      {...register('category', { required: 'Please select a category' })}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Title */}
            <Input
              label="Issue Title"
              placeholder="Brief title describing the issue"
              required
              error={errors.title?.message}
              {...register('title', {
                required: 'Title is required',
                maxLength: {
                  value: 200,
                  message: 'Title cannot exceed 200 characters'
                }
              })}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                placeholder="Provide detailed description of the issue..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                {...register('description', {
                  required: 'Description is required',
                  maxLength: {
                    value: 2000,
                    message: 'Description cannot exceed 2000 characters'
                  }
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Priority Level
              </label>
              <div className="space-y-2">
                {PRIORITY_LEVELS.map((priority) => (
                  <label
                    key={priority.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-500"
                      value={priority.value}
                      defaultChecked={priority.value === 'medium'}
                      {...register('priority')}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {priority.label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {priority.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Location Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Help us locate the issue by providing the exact location.
              </p>
            </div>

            {/* Get Current Location Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={getCurrentLocation}
                leftIcon={Navigation}
                isLoading={locationLoading}
                variant="outline"
              >
                Use Current Location
              </Button>
              {selectedLocation && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Location selected
                </div>
              )}
            </div>

            {/* Map */}
            <div>
              <MapComponent
                height="300px"
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
                currentLocation={selectedLocation}
                onLocationChange={handleLocationSelect}
                clickable={true}
                onMapClick={handleLocationSelect}
                draggableMarker={true}
              />
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Address Details
                </h3>
                {addressLoading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader className="w-4 h-4 mr-1 animate-spin" />
                    Detecting address...
                  </div>
                )}
              </div>

              <Input
                label="Street Address"
                placeholder="Enter street address"
                {...register('address.street')}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="City"
                  placeholder="City"
                  {...register('address.city')}
                />
                <Input
                  label="State"
                  placeholder="State"
                  {...register('address.state')}
                />
                <Input
                  label="ZIP Code"
                  placeholder="ZIP Code"
                  {...register('address.zipCode')}
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Upload Images
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add photos to help us better understand the issue. Images will be analyzed by AI to provide additional insights.
              </p>
            </div>

            <ImageUpload
              onImagesChange={setImages}
              maxImages={5}
              maxSize={5 * 1024 * 1024} // 5MB
            />

            {images.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {images.length} image{images.length !== 1 ? 's' : ''} selected. 
                    AI will analyze these images to provide automatic descriptions and categorization.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Review Your Report
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {ISSUE_CATEGORIES.find(cat => cat.value === watchedCategory)?.label || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Title:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {watch('title') || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {PRIORITY_LEVELS.find(p => p.value === watch('priority'))?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Location:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedLocation ? 'Selected' : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Images:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {images.length} uploaded
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
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
            Report Civic Issue
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Help improve your community by reporting infrastructure issues and public concerns.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Issue Details</span>
            <span>Location</span>
            <span>Images & Review</span>
          </div>
        </motion.div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    Previous
                  </Button>
                )}
              </div>
              
              <div>
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => handleStepValidation(currentStep)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    leftIcon={FileText}
                  >
                    Submit Report
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ReportIssue;