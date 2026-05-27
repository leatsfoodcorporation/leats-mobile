import axiosInstance from '../lib/axios';

/**
 * Fetch web settings (logo, favicon, etc.)
 */
export const getWebSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/web/web-settings');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching web settings:', error);
    throw error;
  }
};

/**
 * Fetch company settings
 */
export const getCompanySettings = async () => {
  try {
    const response = await axiosInstance.get('/api/web/company');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching company settings:', error);
    throw error;
  }
};