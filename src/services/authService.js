import axiosInstance from '../lib/axios';

/**
 * Authentication Service
 * Handles all auth-related API calls
 * Uses mobile-specific endpoints with OTP verification
 */
const authService = {
  /**
   * Register new user (Mobile - OTP based)
   * @param {Object} data - Registration data
   * @param {string} data.name - User's full name
   * @param {string} data.email - User's email
   * @param {string} data.phoneNumber - User's phone number
   * @param {string} data.password - User's password
   * @returns {Promise} Registration response with OTP sent
   */
  register: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/register', data);
    return response.data;
  },

  /**
   * Login user (Mobile)
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email or phone
   * @param {string} credentials.password - User's password
   * @param {string} credentials.fcmToken - FCM token for push notifications
   * @returns {Promise} Login response with token and user data
   */
  login: async (credentials) => {
    const response = await axiosInstance.post('/api/auth/mobile/login', credentials);
    return response.data;
  },

  /**
   * Logout user
   * @param {string} fcmToken - FCM token to remove
   * @returns {Promise} Logout response
   */
  logout: async (fcmToken) => {
    const response = await axiosInstance.post('/api/auth/logout', { fcmToken });
    return response.data;
  },

  /**
   * Verify OTP (Mobile)
   * @param {Object} data - OTP verification data
   * @param {string} data.email - User's email
   * @param {string} data.otp - 6-digit OTP code
   * @returns {Promise} Verification response
   */
  verifyOTP: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/verify-otp', data);
    return response.data;
  },

  /**
   * Resend OTP (Mobile)
   * @param {Object} data - Resend OTP data
   * @param {string} data.email - User's email
   * @returns {Promise} Resend response
   */
  resendOTP: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/resend-otp', data);
    return response.data;
  },

  /**
   * Google OAuth Login (Mobile - No Auto-Registration)
   * @param {Object} data - Google auth data
   * @param {string} data.googleId - Google user ID
   * @param {string} data.email - User's email
   * @param {string} data.name - User's name
   * @param {string} data.image - User's profile image URL
   * @param {string} data.fcmToken - FCM token for push notifications
   * @returns {Promise} Login response with token and user data
   */
  googleLogin: async (data) => {
    const response = await axiosInstance.post('/api/auth/google/callback', {
      ...data,
      isMobile: true, // Flag to indicate mobile request
    });
    return response.data;
  },

  /**
   * Forgot password - Send reset OTP
   * @param {string} email - User's email
   * @returns {Promise} Response
   */
  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/api/auth/mobile/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {Object} data - Reset password data
   * @param {string} data.token - Reset token from OTP verification
   * @param {string} data.password - New password
   * @returns {Promise} Reset response
   */
  resetPassword: async (data) => {
    const response = await axiosInstance.post('/api/auth/reset-password', data);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} User profile data
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} data - Profile update data
   * @returns {Promise} Updated profile data
   */
  updateProfile: async (data) => {
    const response = await axiosInstance.put('/api/auth/profile', data);
    return response.data;
  },

  /**
   * Get user statistics
   * @returns {Promise} User stats data
   */
  getUserStats: async () => {
    const response = await axiosInstance.get('/api/auth/stats');
    return response.data;
  },

  /**
   * Save FCM token for push notifications
   * @param {Object} data - FCM token data
   * @param {string} data.userId - User ID
   * @param {string} data.fcmToken - FCM token
   * @param {string} data.userType - User type ('user' or 'admin')
   * @param {string} data.deviceInfo - Device information
   * @returns {Promise} Save response
   */
  saveFCMToken: async (data) => {
    const response = await axiosInstance.post('/api/auth/fcm-token', data);
    return response.data;
  },

  /**
   * Remove FCM token
   * @param {Object} data - FCM token removal data
   * @param {string} data.userId - User ID
   * @param {string} data.fcmToken - FCM token to remove
   * @param {string} data.userType - User type ('user' or 'admin')
   * @returns {Promise} Remove response
   */
  removeFCMToken: async (data) => {
    const response = await axiosInstance.delete('/api/auth/fcm-token', { data });
    return response.data;
  },

  /**
   * Send OTP to Email based on Phone Number (No SMS)
   * @param {Object} data - Phone data
   * @param {string} data.phoneNumber - User's phone number with country code
   * @returns {Promise} Response with masked email
   */
  sendOTPByPhone: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/send-otp-phone', data);
    return response.data;
  },

  /**
   * Verify OTP by Phone Number (Login)
   * @param {Object} data - Verification data
   * @param {string} data.phoneNumber - User's phone number
   * @param {string} data.otp - 6-digit OTP code
   * @returns {Promise} Login response with token
   */
  verifyOTPByPhone: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/verify-otp-phone', data);
    return response.data;
  },

  /**
   * Reset Password using Phone Number and OTP
   * @param {Object} data - Reset data
   * @param {string} data.phoneNumber - User's phone number
   * @param {string} data.otp - 6-digit OTP code
   * @param {string} data.newPassword - New password
   * @returns {Promise} Reset response
   */
  resetPasswordPhoneOTP: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/reset-password-phone-otp', data);
    return response.data;
  },

  /**
   * Get user addresses
   * @returns {Promise} List of user addresses
   */
  getAddresses: async () => {
    const response = await axiosInstance.get('/api/auth/addresses');
    return response.data;
  },

  /**
   * Add new address
   * @param {Object} data - Address data
   * @param {string} data.type - Address type (home, work, other)
   * @param {string} data.name - Recipient name
   * @param {string} data.phone - Contact phone
   * @param {string} data.address - Street address
   * @param {string} data.city - City
   * @param {string} data.state - State
   * @param {string} data.zipCode - Zip/Postal code
   * @param {string} data.country - Country
   * @param {boolean} data.isDefault - Set as default address
   * @returns {Promise} Created address
   */
  addAddress: async (data) => {
    const response = await axiosInstance.post('/api/auth/addresses', data);
    return response.data;
  },

  /**
   * Update existing address
   * @param {string} id - Address ID
   * @param {Object} data - Updated address data
   * @returns {Promise} Updated address
   */
  updateAddress: async (id, data) => {
    const response = await axiosInstance.put(`/api/auth/addresses/${id}`, data);
    return response.data;
  },

  /**
   * Delete address
   * @param {string} id - Address ID
   * @returns {Promise} Delete response
   */
  deleteAddress: async (id) => {
    const response = await axiosInstance.delete(`/api/auth/addresses/${id}`);
    return response.data;
  },

  /**
   * Delete user account (App Store / Play Store compliance)
   * @param {string} email - User's email to delete
   * @returns {Promise} Delete response
   */
  deleteAccount: async (email) => {
    const response = await axiosInstance.post('/api/auth/delete-account', { email });
    return response.data;
  },
};

export default authService;