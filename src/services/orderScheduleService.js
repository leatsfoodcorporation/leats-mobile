import axiosInstance from '../lib/axios';

/**
 * Order Schedule Service
 * Handles fetching active scheduling settings and slots
 */
const orderScheduleService = {
  /**
   * Get active order scheduling settings and delivery slots
   * @returns {Promise} Scheduling settings
   */
  getActiveSettings: async () => {
    try {
      const response = await axiosInstance.get('/api/online/order-schedule/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching order schedule settings:', error);
      return { success: false, error: error.message };
    }
  }
};

export default orderScheduleService;
