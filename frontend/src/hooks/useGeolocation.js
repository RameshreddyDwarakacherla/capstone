import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    ...options
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const err = new Error('Geolocation is not supported by this browser');
      setError(err);
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now()
        });
        setLoading(false);
        toast.success('Location obtained successfully');
      },
      (err) => {
        let message = 'Failed to get location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out.';
            break;
          default:
            message = 'An unknown error occurred while retrieving location.';
            break;
        }
        
        setError(err);
        setLoading(false);
        toast.error(message);
      },
      defaultOptions
    );
  };

  const watchLocation = () => {
    if (!navigator.geolocation) {
      const err = new Error('Geolocation is not supported by this browser');
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now()
        });
        setLoading(false);
      },
      (err) => {
        let message = 'Failed to watch location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out.';
            break;
          default:
            message = 'An unknown error occurred while watching location.';
            break;
        }
        
        setError(err);
        setLoading(false);
        toast.error(message);
      },
      defaultOptions
    );

    return watchId;
  };

  const clearWatch = (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  // Auto-get location on mount if requested
  useEffect(() => {
    if (options.autoGet) {
      getCurrentLocation();
    }
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
    isSupported: !!navigator.geolocation
  };
};

export default useGeolocation;