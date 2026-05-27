import axios from '../lib/axios';

/**
 * Check if a pincode is serviceable
 * @param {string} pincode - The pincode to check
 * @param {string} country - The country (optional)
 * @param {string} city - The city (optional)
 * @param {string} state - The state (optional)
 * @returns {Promise<{success: boolean, serviceable: boolean, message: string, data: object}>}
 */
export const checkPincodeServiceability = async (pincode, country = null, city = null, state = null) => {
  try {
    const params = {};
    if (country) params.country = country;
    if (city) params.city = city;
    if (state) params.state = state;
    
    const response = await axios.get(`/api/delivery-zones/check/${pincode}`, { params });
    return response.data;
  } catch (error) {
    console.log('Delivery zone check failed:', error.message);
    return {
      success: false,
      serviceable: false,
      message: 'Unable to check delivery availability',
      data: null
    };
  }
};

/**
 * Get list of countries with active delivery zones
 * @returns {Promise<string[]>}
 */
export const getAvailableCountries = async () => {
  try {
    const response = await axios.get('/api/delivery-zones/countries');
    return response.data.data || [];
  } catch (error) {
    console.log('Failed to fetch available countries:', error.message);
    return [];
  }
};

/**
 * Detect location by coordinates using AI reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{success: boolean, serviceable: boolean, message: string, data: object}>}
 */
export const detectLocationByCoords = async (lat, lng) => {
  try {
    const response = await axios.post('/api/delivery-zones/detect-location', { lat, lng });
    return response.data;
  } catch (error) {
    console.log('Location detection failed:', error.message);
    return {
      success: false,
      serviceable: false,
      message: 'Unable to detect location',
      data: null
    };
  }
};

const deliveryZoneService = {
  checkPincodeServiceability,
  getAvailableCountries,
  detectLocationByCoords,
};

export default deliveryZoneService;
