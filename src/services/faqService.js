import axiosInstance from '../lib/axios';

/**
 * FAQ Service
 * Handles all FAQ-related API calls
 */
const faqService = {
  /**
   * Get all active FAQs
   * @returns {Promise} FAQ items
   */
  getActiveFaqs: async () => {
    const response = await axiosInstance.get('/api/web/faqs/active');
    return response.data;
  },
};

export default faqService;
