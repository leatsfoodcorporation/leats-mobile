import axiosInstance from '../lib/axios';

/**
 * Wishlist Service
 * Handles all wishlist-related API calls
 */
const wishlistService = {
  /**
   * Get user's wishlist
   * @param {string} userId - User ID
   * @returns {Promise} Wishlist items
   */
  getWishlist: async (userId) => {
    const response = await axiosInstance.get('/api/online/wishlist', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Add product to wishlist
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {Object} productData - Product data to cache
   * @returns {Promise} Updated wishlist
   */
  addToWishlist: async (userId, productId, productData) => {
    const response = await axiosInstance.post('/api/online/wishlist', {
      userId,
      productId,
      productData
    });
    return response.data;
  },

  /**
   * Remove product from wishlist
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise} Updated wishlist
   */
  removeFromWishlist: async (userId, productId) => {
    const response = await axiosInstance.delete(`/api/online/wishlist/${productId}`, {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Check if product is in wishlist
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise} Boolean response
   */
  isInWishlist: async (userId, productId) => {
    const response = await axiosInstance.get(`/api/online/wishlist/check/${productId}`, {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Clear entire wishlist
   * @param {string} userId - User ID
   * @returns {Promise} Empty wishlist response
   */
  clearWishlist: async (userId) => {
    const response = await axiosInstance.delete('/api/online/wishlist', {
      params: { userId }
    });
    return response.data;
  },
};

export default wishlistService;