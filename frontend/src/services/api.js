import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (skip for login/register endpoints)
api.interceptors.request.use(
  (config) => {
    // Skip adding token for authentication endpoints
    const authEndpoints = ['/auth/login', '/auth/admin/login', '/auth/register', '/auth/admin/register', '/auth/refresh-token'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url.endsWith(endpoint));
    
    if (!isAuthEndpoint) {
      const token = Cookies.get('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken }
          );

          const { tokens } = response.data.data;
          
          // Update cookies
          const cookieOptions = {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          };
          
          Cookies.set('accessToken', tokens.accessToken, cookieOptions);
          Cookies.set('refreshToken', tokens.refreshToken, cookieOptions);
          
          // Update API header
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login
        window.location.href = '/login-user';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (error.response.status === 429) {
      toast.error('Too many requests. Please try again later.');
      return Promise.reject(error);
    }

    // Handle server errors
    if (error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  // User authentication
  loginUser: (credentials) => api.post('/auth/login', credentials),
  registerUser: (userData) => api.post('/auth/register', userData),
  
  // Admin authentication  
  loginAdmin: (credentials) => api.post('/auth/admin/login', credentials),
  
  // Profile management
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  
  // Token management
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  logoutAll: () => api.post('/auth/logout-all'),
};

export const issuesAPI = {
  // Issue management
  createIssue: (issueData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(issueData).forEach(key => {
      if (key !== 'images' && issueData[key] !== null && issueData[key] !== undefined) {
        if (typeof issueData[key] === 'object') {
          formData.append(key, JSON.stringify(issueData[key]));
        } else {
          formData.append(key, issueData[key]);
        }
      }
    });
    
    // Append image files
    if (issueData.images && issueData.images.length > 0) {
      issueData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    return api.post('/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getIssues: (params = {}) => api.get('/issues', { 
    params,
    timeout: 15000 // 15 second timeout for issues
  }),
  getIssueById: (id) => api.get(`/issues/${id}`),
  updateIssue: (id, updateData) => api.put(`/issues/${id}`, updateData),
  deleteIssue: (id) => api.delete(`/issues/${id}`),
  
  // Issue interactions
  voteOnIssue: (id, voteType) => api.post(`/issues/${id}/vote`, { voteType }),
  addComment: (id, commentData) => api.post(`/issues/${id}/comments`, commentData),
  
  // Issue filtering
  getIssuesByLocation: (latitude, longitude, radius = 5000) => 
    api.get('/issues', { 
      params: { latitude, longitude, radius } 
    }),
  
  getIssuesByCategory: (category) => 
    api.get('/issues', { params: { category } }),
    
  getIssuesByUser: (userId) => 
    api.get('/issues', { params: { reportedBy: userId } }),
    
  // Admin specific
  assignIssue: (id, assigneeId) => 
    api.put(`/issues/${id}`, { assignedTo: assigneeId }),
    
  updateIssueStatus: (id, status, adminNote = '') => 
    api.put(`/issues/${id}`, { status, adminNote }),
};

export const usersAPI = {
  // User management (admin only)
  getUsers: (params = {}) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  activateUser: (id) => api.put(`/users/${id}/activate`),
  
  // User stats
  getUserStats: (id) => api.get(`/users/${id}/stats`),
  getAdminStats: () => api.get('/users/admin/stats'),
};

export const utilsAPI = {
  // Geolocation
  reverseGeocode: (latitude, longitude) => 
    api.get(`/utils/reverse-geocode`, { 
      params: { latitude, longitude } 
    }),
  
  // Health check
  healthCheck: () => api.get('/health'),
  
  // File upload (if needed separately)
  uploadImage: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return api.post('/utils/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Utility functions
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'An error occurred';
    const status = error.response.status;
    
    return {
      message,
      status,
      errors: error.response.data?.errors || [],
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      errors: [],
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      errors: [],
    };
  }
};

// Request timeout utility
export const withTimeout = (promise, timeout = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

export default api;