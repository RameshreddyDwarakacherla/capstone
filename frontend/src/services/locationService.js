import api from './api';

class LocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cache key for coordinates
  getCacheKey(lat, lng) {
    return `${lat.toFixed(6)}_${lng.toFixed(6)}`;
  }

  // Check if cached data is still valid
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Reverse geocode using OpenStreetMap Nominatim API
  async reverseGeocode(lat, lng) {
    const cacheKey = this.getCacheKey(lat, lng);
    const cached = this.cache.get(cacheKey);

    // Return cached result if valid
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      // Use Nominatim reverse geocoding service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CivicReporter/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      // Parse the response
      const address = this.parseNominatimResponse(data);

      // Cache the result
      this.cache.set(cacheKey, {
        data: address,
        timestamp: Date.now()
      });

      return address;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      // Fallback to basic coordinates if service fails
      return {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        coordinates: [lng, lat]
      };
    }
  }

  // Parse Nominatim API response
  parseNominatimResponse(data) {
    const address = data.address || {};
    
    // Extract street information
    const streetNumber = address.house_number || '';
    const streetName = address.road || address.street || address.highway || '';
    const street = `${streetNumber} ${streetName}`.trim();

    // Extract location components
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality || 
                 address.county || '';

    const state = address.state || 
                  address.province || 
                  address.region || '';

    const zipCode = address.postcode || '';
    const country = address.country || 'Unknown';

    // Create formatted address
    const parts = [street, city, state, zipCode].filter(part => part.trim());
    const formatted = parts.length > 0 ? parts.join(', ') : data.display_name || 'Address not found';

    return {
      street,
      city,
      state,
      zipCode,
      country,
      formatted,
      coordinates: [parseFloat(data.lon), parseFloat(data.lat)],
      raw: data // Include raw response for debugging
    };
  }

  // Forward geocoding (address to coordinates)
  async geocode(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CivicReporter/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error('Address not found');
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted: result.display_name,
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)]
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Get current position with improved error handling
  async getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let message = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Convert degrees to radians
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get nearby issues based on location
  async getNearbyIssues(lat, lng, radius = 5000) { // radius in meters
    try {
      const response = await api.get(`/issues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data.data.issues;
    } catch (error) {
      console.error('Error fetching nearby issues:', error);
      throw error;
    }
  }

  // Clear location cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (this.isCacheValid(value)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// Export singleton instance
const locationService = new LocationService();

// Export individual functions for convenience
export const reverseGeocode = (lat, lng) => locationService.reverseGeocode(lat, lng);
export const geocode = (address) => locationService.geocode(address);
export const getCurrentPosition = (options) => locationService.getCurrentPosition(options);
export const calculateDistance = (lat1, lng1, lat2, lng2) => locationService.calculateDistance(lat1, lng1, lat2, lng2);
export const getNearbyIssues = (lat, lng, radius) => locationService.getNearbyIssues(lat, lng, radius);

export default locationService;