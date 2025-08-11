import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  refreshToken: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.tokens.accessToken,
        refreshToken: action.payload.tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.tokens.accessToken,
        refreshToken: action.payload.tokens.refreshToken,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload.user,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');
      const userStr = Cookies.get('user');

      if (token && refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Set tokens in API service
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token is still valid by fetching profile
          console.log('🔐 Verifying stored token...');
          const response = await api.get('/auth/profile');
          console.log('✅ Token verification successful');
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.data.user,
              tokens: { accessToken: token, refreshToken }
            }
          });
        } catch (error) {
          console.error('❌ Token verification failed:', error.response?.data?.message || error.message);
          
          // Try to refresh token if we have a refresh token
          if (refreshToken && error.response?.status === 401) {
            try {
              console.log('🔄 Attempting token refresh...');
              const refreshResponse = await api.post('/auth/refresh-token', { refreshToken });
              const { tokens: newTokens } = refreshResponse.data.data;
              
              // Update cookies
              setAuthCookies(JSON.parse(userStr), newTokens);
              
              // Set new token in API
              api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
              
              console.log('✅ Token refresh successful');
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user: JSON.parse(userStr),
                  tokens: newTokens
                }
              });
              return;
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError.response?.data?.message || refreshError.message);
            }
          }
          
          // Clear invalid tokens
          clearAuthCookies();
          dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Helper function to set auth cookies
  const setAuthCookies = (user, tokens) => {
    const cookieOptions = {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    Cookies.set('accessToken', tokens.accessToken, cookieOptions);
    Cookies.set('refreshToken', tokens.refreshToken, cookieOptions);
    Cookies.set('user', JSON.stringify(user), cookieOptions);
  };

  // Helper function to clear auth cookies
  const clearAuthCookies = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    delete api.defaults.headers.common['Authorization'];
  };

  // Login function
  const login = async (email, password, role = 'user') => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Clear any existing auth cookies before login attempt
      clearAuthCookies();

      const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/login';
      const response = await api.post(endpoint, { email, password });

      const { user, tokens } = response.data.data;

      // Verify user role matches expected role
      if (user.role !== role) {
        throw new Error(`Invalid ${role} credentials`);
      }

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

      // Set cookies
      setAuthCookies(user, tokens);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens }
      });

      toast.success(`Welcome back, ${user.firstName}!`);
      return { success: true, user, role: user.role };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData, role = 'user') => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Clean up userData - remove undefined values
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );

      // Clean up address object if it exists
      if (cleanUserData.address) {
        cleanUserData.address = Object.fromEntries(
          Object.entries(cleanUserData.address).filter(([_, value]) => value !== undefined && value !== '')
        );
        // Remove empty address object
        if (Object.keys(cleanUserData.address).length === 0) {
          delete cleanUserData.address;
        }
      }

      // Admin registration is not allowed through public interface
      if (role === 'admin') {
        throw new Error('Admin registration is not permitted through this interface. Contact your system administrator.');
      }
      
      const endpoint = '/auth/register';
      const payload = { ...cleanUserData, role };
      
      console.log('Registration payload:', JSON.stringify(payload, null, 2)); // Debug log with full JSON
      const response = await api.post(endpoint, payload);

      const { user, tokens } = response.data.data;

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

      // Set cookies
      setAuthCookies(user, tokens);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens }
      });

      toast.success(`Welcome to Civic Reporter, ${user.firstName}!`);
      return { success: true, user, role: user.role };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      
      console.error('Registration error details:', {
        status: error.response?.status,
        data: error.response?.data,
        fullError: error.response?.data || error.message
      }); // Enhanced debug log
      
      let message = 'Registration failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
        
        // If there are validation errors, show them specifically
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          console.error('Validation errors:', error.response.data.errors);
          const validationMessages = error.response.data.errors.map(err => 
            `${err.field}: ${err.message}`
          ).join('\n');
          message = `Validation failed:\n${validationMessages}`;
        }
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        message = error.response.data.errors.map(err => err.message).join(', ');
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.refreshToken) {
        await api.post('/auth/logout', { refreshToken: state.refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthCookies();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Refresh token function
  const refreshTokenFunc = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh-token', { refreshToken });
      const { tokens } = response.data.data;

      // Update cookies
      const user = JSON.parse(Cookies.get('user'));
      setAuthCookies(user, tokens);

      // Update API header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: { tokens }
      });

      return tokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthCookies();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return null;
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      const updatedUser = response.data.data.user;

      // Update cookies
      const tokens = {
        accessToken: state.token,
        refreshToken: state.refreshToken
      };
      setAuthCookies(updatedUser, tokens);

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user: updatedUser }
      });

      toast.success('Profile updated successfully');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      // Logout user to force re-login with new password
      await logout();
      toast.success('Password changed successfully. Please log in again.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!state.user) return false;
    if (requiredRole === 'admin') {
      return state.user.role === 'admin';
    }
    return state.user.role === requiredRole || state.user.role === 'admin';
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    token: state.token,
    
    // Actions
    login,
    register,
    logout,
    refreshToken: refreshTokenFunc,
    updateUser,
    changePassword,
    hasRole,
    
    // Computed values
    isAdmin: state.user?.role === 'admin',
    isUser: state.user?.role === 'user',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;