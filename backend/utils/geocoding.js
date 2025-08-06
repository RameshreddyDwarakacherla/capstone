const axios = require('axios');

// Reverse geocode coordinates to address
const reverseGeocode = async (longitude, latitude) => {
  try {
    // Using OpenStreetMap Nominatim (free alternative to Google Maps)
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CivicReporter/1.0'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.address) {
      const address = response.data.address;
      
      return {
        street: `${address.house_number || ''} ${address.road || ''}`.trim(),
        city: address.city || address.town || address.village || '',
        state: address.state || address.province || '',
        zipCode: address.postcode || '',
        country: address.country || 'USA',
        formatted: response.data.display_name || ''
      };
    }

    // Fallback if no address found
    return {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      formatted: `${latitude}, ${longitude}`
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    
    // Return basic fallback
    return {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      formatted: `${latitude}, ${longitude}`
    };
  }
};

// Forward geocode address to coordinates
const forwardGeocode = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CivicReporter/1.0'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted: result.display_name,
        confidence: result.importance || 0.5
      };
    }

    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error.message);
    return null;
  }
};

// Validate coordinates
const validateCoordinates = (longitude, latitude) => {
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lng) || isNaN(lat)) {
    return false;
  }

  return (
    lng >= -180 && lng <= 180 &&
    lat >= -90 && lat <= 90
  );
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Find nearby issues (helper for database queries)
const findNearbyCoordinates = (centerLat, centerLon, radiusMeters = 1000) => {
  // Calculate bounding box for initial filtering
  const latDegreeDistance = 111320; // Approximate meters per degree latitude
  const lonDegreeDistance = Math.cos(centerLat * Math.PI / 180) * 111320;

  const latDelta = radiusMeters / latDegreeDistance;
  const lonDelta = radiusMeters / lonDegreeDistance;

  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta,
    center: {
      latitude: centerLat,
      longitude: centerLon
    },
    radius: radiusMeters
  };
};

// Format coordinates for display
const formatCoordinates = (longitude, latitude, precision = 6) => {
  const lng = parseFloat(longitude).toFixed(precision);
  const lat = parseFloat(latitude).toFixed(precision);
  
  return `${lat}, ${lng}`;
};

// Get location timezone (basic implementation)
const getTimezone = async (longitude, latitude) => {
  try {
    // This is a simple approximation - for production, consider using a proper timezone API
    const utcOffset = Math.round(longitude / 15);
    
    return {
      timezone: `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`,
      offset: utcOffset,
      estimated: true
    };
  } catch (error) {
    console.error('Timezone detection error:', error.message);
    
    return {
      timezone: 'UTC',
      offset: 0,
      estimated: true
    };
  }
};

// Validate and normalize address object
const normalizeAddress = (address) => {
  if (!address || typeof address !== 'object') {
    return {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      formatted: ''
    };
  }

  return {
    street: (address.street || '').trim(),
    city: (address.city || '').trim(),
    state: (address.state || '').trim(),
    zipCode: (address.zipCode || '').trim(),
    country: (address.country || 'USA').trim(),
    formatted: (address.formatted || '').trim()
  };
};

module.exports = {
  reverseGeocode,
  forwardGeocode,
  validateCoordinates,
  calculateDistance,
  findNearbyCoordinates,
  formatCoordinates,
  getTimezone,
  normalizeAddress
};