import axiosInstance from '../lib/axios';

/**
 * Fetch active promotional coupons
 */
export const getPromotionalCoupons = async () => {
  try {
    const response = await axiosInstance.get('/api/online/coupons/promotional');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching promotional coupons:', error);
    throw error;
  }
};

/**
 * Validate and apply coupon
 */
export const validateCoupon = async (code, cartTotal) => {
  try {
    const response = await axiosInstance.post('/api/online/coupons/validate', {
      code,
      cartTotal,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    throw error;
  }
};

/**
 * Get available coupons for user based on cart value
 */
export const getAvailableCoupons = async (userId, orderValue) => {
  try {
    const response = await axiosInstance.get('/api/online/coupons/available', {
      params: {
        userId,
        orderValue
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching available coupons:', error);
    throw error;
  }
};