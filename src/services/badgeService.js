import axiosInstance from '../lib/axios';

/**
 * Badge Service
 * Handles badge-related API calls
 */

/**
 * Get all badges (static + custom)
 * @returns {Promise<{success: boolean, data: {static: Array, custom: Array, all: Array}}>}
 */
export const getAllBadges = async () => {
  try {
    const response = await axiosInstance.get('/api/online/badges');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching badges:', error);
    return { 
      success: false, 
      data: { static: [], custom: [], all: [] } 
    };
  }
};

/**
 * Get homepage badges (sorted by sortOrder, only enabled ones)
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getHomepageBadges = async () => {
  try {
    const response = await axiosInstance.get('/api/online/badges/homepage');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching homepage badges:', error);
    return { success: false, data: [] };
  }
};

export default {
  getAllBadges,
  getHomepageBadges,
};
