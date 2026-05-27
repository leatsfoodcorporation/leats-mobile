import axiosInstance from '../lib/axios';

/**
 * Enquiry Service
 * Handles all enquiry-related API calls
 */
const enquiryService = {
  /**
   * Submit bulk order enquiry
   * @param {Object} data - Bulk order enquiry data
   * @returns {Promise} Response
   */
  submitBulkOrder: async (data) => {
    const response = await axiosInstance.post('/api/enquiry/bulk-order', data);
    return response.data;
  },

  /**
   * Submit catering service enquiry
   * @param {Object} data - Catering service enquiry data
   * @returns {Promise} Response
   */
  submitCateringService: async (data) => {
    const response = await axiosInstance.post('/api/enquiry/catering-service', data);
    return response.data;
  },
};

export default enquiryService;
