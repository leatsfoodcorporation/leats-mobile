import axiosInstance from '../lib/axios';

/**
 * Cart Service
 * Handles all cart-related API calls
 */
const cartService = {
  /**
   * Get user's cart
   * @param {string} userId - User ID
   * @returns {Promise} Cart data with items
   */
  getCart: async (userId) => {
    const response = await axiosInstance.get('/api/online/cart', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Add item to cart
   * @param {Object} data - Cart item data
   * @param {string} data.userId - User ID
   * @param {string} data.inventoryProductId - Inventory Product ID
   * @param {number} data.variantIndex - Variant Index
   * @param {number} data.quantity - Quantity
   * @param {string} data.selectedCuttingStyle - Cutting style (optional)
   * @returns {Promise} Updated cart
   */
  addToCart: async (data) => {
    const response = await axiosInstance.post('/api/online/cart', data);
    return response.data;
  },

  /**
   * Update cart item quantity
   * @param {string} userId - User ID
   * @param {string} inventoryProductId - Inventory Product ID
   * @param {number} variantIndex - Variant Index
   * @param {number} quantity - New quantity
   * @param {string} selectedCuttingStyle - Cutting style (optional)
   * @returns {Promise} Updated cart
   */
  updateCartItem: async (userId, inventoryProductId, variantIndex, quantity, selectedCuttingStyle) => {
    const response = await axiosInstance.put(`/api/online/cart/${inventoryProductId}`, {
      userId,
      variantIndex,
      quantity,
      selectedCuttingStyle
    });
    return response.data;
  },

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} inventoryProductId - Inventory Product ID
   * @param {number} variantIndex - Variant Index
   * @param {string} selectedCuttingStyle - Cutting style (optional)
   * @returns {Promise} Updated cart
   */
  removeFromCart: async (userId, inventoryProductId, variantIndex, selectedCuttingStyle) => {
    const response = await axiosInstance.delete(`/api/online/cart/${inventoryProductId}`, {
      data: {
        userId,
        variantIndex,
        selectedCuttingStyle
      }
    });
    return response.data;
  },

  /**
   * Clear entire cart
   * @param {string} userId - User ID
   * @returns {Promise} Empty cart response
   */
  clearCart: async (userId) => {
    const response = await axiosInstance.delete('/api/online/cart', {
      data: { userId }
    });
    return response.data;
  },

  /**
   * Apply coupon to cart
   * @param {string} userId - User ID
   * @param {string} couponCode - Coupon code
   * @returns {Promise} Cart with applied discount
   */
  applyCoupon: async (userId, couponCode) => {
    const response = await axiosInstance.post('/api/online/cart/apply-coupon', {
      userId,
      couponCode
    });
    return response.data;
  },

  /**
   * Remove coupon from cart
   * @param {string} userId - User ID
   * @returns {Promise} Cart without discount
   */
  removeCoupon: async (userId) => {
    const response = await axiosInstance.delete('/api/online/cart/remove-coupon', {
      data: { userId }
    });
    return response.data;
  },
};

export default cartService;