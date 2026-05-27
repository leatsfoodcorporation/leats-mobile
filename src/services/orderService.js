import axiosInstance from '../lib/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Order Service
 * Handles all order-related API calls
 */
const orderService = {
  /**
   * Create new order
   * @param {Object} data - Order data
   * @param {string} data.deliveryAddressId - Delivery address ID
   * @param {string} data.paymentMethod - Payment method (cod, razorpay, stripe)
   * @param {string} data.couponCode - Coupon code (optional)
   * @returns {Promise} Created order or payment details
   */
  createOrder: async (data) => {
    const response = await axiosInstance.post('/api/online/orders', data);
    return response.data;
  },

  /**
   * Get user's orders
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Order status filter
   * @returns {Promise} Orders list
   */
  getOrders: async (params = {}) => {
    const response = await axiosInstance.get('/api/online/my-orders', { params });
    return response.data;
  },

  /**
   * Get order by order number
   * @param {string} orderNumber - Order number
   * @returns {Promise} Order details
   */
  getOrderById: async (orderNumber) => {
    const userId = await AsyncStorage.getItem('userId');
    const userData = await AsyncStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const actualUserId = user?.id || userId;
    
    const response = await axiosInstance.get(`/api/online/my-orders/${orderNumber}`, {
      params: { userId: actualUserId }
    });
    return response.data;
  },

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Cancellation response
   */
  cancelOrder: async (orderId, reason) => {
    const response = await axiosInstance.post(`/api/online/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  /**
   * Track order
   * @param {string} orderId - Order ID
   * @returns {Promise} Order tracking information
   */
  trackOrder: async (orderId) => {
    const response = await axiosInstance.get(`/api/online/orders/${orderId}/track`);
    return response.data;
  },

  /**
   * Verify payment (for Razorpay/Stripe)
   * @param {Object} data - Payment verification data
   * @returns {Promise} Verification response
   */
  verifyPayment: async (data) => {
    const response = await axiosInstance.post('/api/payment-gateway/verify', data);
    return response.data;
  },

  /**
   * Confirm order after payment
   * @param {Object} data - Confirmation data
   * @returns {Promise} Confirmation response
   */
  confirmOrder: async (data) => {
    const response = await axiosInstance.post('/api/online/orders/confirm', data);
    return response.data;
  },
};

export default orderService;