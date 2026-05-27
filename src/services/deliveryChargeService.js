import axiosInstance from '../lib/axios';

/**
 * Get active delivery charges (Public - for cart/checkout)
 * Returns all active rules ordered by minOrderValue descending
 */
export const getActiveDeliveryCharges = async () => {
  try {
    const response = await axiosInstance.get('/api/settings/delivery-charges/active');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching delivery charges:', error);
    return [];
  }
};
