import axiosInstance from '../lib/axios';

let cachedSettings = null;

/**
 * Fetch system settings (admin's default country and currency)
 * @returns {Promise<{defaultCountry: string, defaultCurrency: string}>}
 */
export const getSystemSettings = async () => {
  // Return cached settings if available
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    // Fetch from public currency endpoint (no auth required)
    const response = await axiosInstance.get('/api/auth/currency');
    
    if (response.data?.success && response.data?.data) {
      cachedSettings = {
        defaultCountry: response.data.data.country || 'India',
        defaultCurrency: response.data.data.currency || 'INR',
      };
      return cachedSettings;
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
  }

  // Return default settings if fetch fails
  return {
    defaultCountry: 'India',
    defaultCurrency: 'INR',
  };
};

/**
 * Clear cache when needed (e.g., when admin updates settings)
 */
export const clearSystemSettingsCache = () => {
  cachedSettings = null;
};

export default {
  getSystemSettings,
  clearSystemSettingsCache,
};
