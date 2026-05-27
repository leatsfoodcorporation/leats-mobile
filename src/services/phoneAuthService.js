import axiosInstance from '../lib/axios';

/**
 * Phone Authentication Service using Email OTP (No SMS)
 * Handles OTP sending to email based on phone number
 */
const phoneAuthService = {
  /**
   * Send OTP to Email (For resending during registration)
   * @param {string} email - User's email address
   * @returns {Promise} Response with email
   */
  sendSMSOTP: async (email) => {
    try {
      const response = await axiosInstance.post('/api/auth/mobile/resend-otp', {
        email
      });
      
      return {
        success: true,
        confirmation: { email }, // Store email for verification
        message: `OTP sent to ${email}`,
        email: email
      };
    } catch (error) {
      let errorMessage = 'Failed to send OTP';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 404) {
        errorMessage = 'No account found with this email. Please register first.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Verify OTP for Password Reset
   * @param {object} confirmation - Confirmation object with email
   * @param {string} code - 6-digit OTP code
   * @returns {Promise} Verification response
   */
  verifyPasswordResetOTP: async (confirmation, code) => {
    try {
      // Create a temporary endpoint call to verify OTP without resetting password
      // We'll use the reset password endpoint but with a flag to only verify
      const response = await axiosInstance.post('/api/auth/mobile/verify-reset-otp', {
        email: confirmation.email,
        otp: code
      });
      
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      let errorMessage = 'Invalid OTP code';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.expired) {
        errorMessage = 'OTP expired. Please request a new one';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Verify OTP by Email
   * @param {object} confirmation - Confirmation object from sendSMSOTP
   * @param {string} code - 6-digit OTP code
   * @returns {Promise} Verification response with token
   */
  verifySMSOTP: async (confirmation, code) => {
    try {
      const response = await axiosInstance.post('/api/auth/mobile/verify-otp', {
        email: confirmation.email,
        otp: code
      });
      
      return {
        success: true,
        token: response.data.data.token,
        user: response.data.data.user
      };
    } catch (error) {
      let errorMessage = 'Invalid OTP code';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.expired) {
        errorMessage = 'OTP expired. Please request a new one';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Register user with phone verification (Email OTP)
   * @param {object} userData - User registration data
   * @returns {Promise} Backend registration response
   */
  registerWithPhone: async (userData) => {
    try {
      const response = await axiosInstance.post('/api/auth/mobile/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login with email verification (Email OTP)
   * This is handled by verifySMSOTP which returns token
   * @param {string} email - Email address
   * @param {string} token - JWT token from verification
   * @param {object} user - User data from verification
   * @returns {Promise} Login response
   */
  loginWithPhone: async (email, token, user) => {
    return {
      success: true,
      data: {
        token,
        user
      }
    };
  },

  /**
   * Get Firebase ID token from current user
   * Not needed for email OTP flow
   * @returns {Promise<string>} Returns null
   */
  getFirebaseToken: async () => {
    return null;
  },

  /**
   * Sign out from Firebase
   * Not needed for email OTP flow
   */
  signOut: async () => {
    // No-op for email OTP
  },

  /**
   * Reset password with email verification (Email OTP)
   * @param {object} data - Reset password data
   * @param {string} data.email - Email address
   * @param {string} data.newPassword - New password
   * @param {string} data.otp - OTP code
   * @returns {Promise} Backend response
   */
  resetPassword: async (data) => {
    const response = await axiosInstance.post('/api/auth/mobile/reset-password-email-otp', {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword
    });
    
    return response.data;
  }
};

export default phoneAuthService;