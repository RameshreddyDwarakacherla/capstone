const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate access token
const generateAccessToken = (userId, role) => {
  const payload = {
    userId,
    role,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
    issuer: 'civic-reporter',
    audience: 'civic-reporter-client'
  });
};

// Generate refresh token
const generateRefreshToken = (userId, role) => {
  const payload = {
    userId,
    role,
    type: 'refresh',
    jti: crypto.randomUUID() // Unique identifier for this token
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'civic-reporter',
    audience: 'civic-reporter-client'
  });
};

// Generate token pair (access + refresh)
const generateTokenPair = (userId, role, additionalPayload = {}) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role);
  
  // Decode tokens to get expiration times
  const accessDecoded = jwt.decode(accessToken);
  const refreshDecoded = jwt.decode(refreshToken);

  return {
    accessToken,
    refreshToken,
    accessTokenExpires: new Date(accessDecoded.exp * 1000),
    refreshTokenExpires: new Date(refreshDecoded.exp * 1000),
    tokenType: 'Bearer'
  };
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'civic-reporter',
      audience: 'civic-reporter-client'
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return {
      valid: true,
      decoded,
      expired: false
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        decoded: null,
        expired: true,
        error: 'Token expired'
      };
    }

    return {
      valid: false,
      decoded: null,
      expired: false,
      error: error.message
    };
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'civic-reporter',
      audience: 'civic-reporter-client'
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return {
      valid: true,
      decoded,
      expired: false
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        decoded: null,
        expired: true,
        error: 'Refresh token expired'
      };
    }

    return {
      valid: false,
      decoded: null,
      expired: false,
      error: error.message
    };
  }
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
    purpose: 'verify_email'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'civic-reporter',
    audience: 'civic-reporter-client'
  });
};

// Generate password reset token
const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    purpose: 'reset_password',
    nonce: crypto.randomBytes(16).toString('hex') // Prevent token replay
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'civic-reporter',
    audience: 'civic-reporter-client'
  });
};

// Verify special purpose token (email verification, password reset)
const verifySpecialToken = (token, expectedType) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'civic-reporter',
      audience: 'civic-reporter-client'
    });

    if (decoded.type !== expectedType) {
      throw new Error('Invalid token type');
    }

    return {
      valid: true,
      decoded,
      expired: false
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        decoded: null,
        expired: true,
        error: 'Token expired'
      };
    }

    return {
      valid: false,
      decoded: null,
      expired: false,
      error: error.message
    };
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? new Date() >= expiration : true;
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifySpecialToken,
  getTokenExpiration,
  isTokenExpired,
  decodeToken
};