import axiosInstance from '../lib/axios';

/**
 * Policy Service
 * Handles all policy-related API calls
 */
const policyService = {
  /**
   * Get policy by slug
   * @param {string} slug - Policy slug
   * @returns {Promise} Policy data or null if not found
   */
  getPolicyBySlug: async (slug) => {
    try {
      const response = await axiosInstance.get(`/api/web/policies/public/${slug}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Policy not found or not published - return null gracefully
        return { success: false, data: null };
      }
      // Re-throw other errors
      throw error;
    }
  },
};

export default policyService;
