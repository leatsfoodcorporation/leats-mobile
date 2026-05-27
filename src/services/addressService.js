import axiosInstance from '../lib/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get userId from AsyncStorage
 */
const getUserId = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id;
    }
    return null;
  } catch (error) {
    console.error('Error getting userId:', error);
    return null;
  }
};

/**
 * Address Service
 * Handles all address-related API calls
 */
const addressService = {
  /**
   * Get all addresses for authenticated user
   */
  getAddresses: async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.get('/api/online/addresses', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  },

  /**
   * Get address by ID
   */
  getAddressById: async (addressId) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.get(`/api/online/addresses/${addressId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  },

  /**
   * Create new address
   */
  createAddress: async (addressData) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Map form fields to backend fields
      const mappedData = {
        userId,
        name: addressData.name || addressData.fullName,
        phone: addressData.phone || addressData.phoneNumber,
        alternatePhone: addressData.alternatePhone || null,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2 || null,
        landmark: addressData.landmark || null,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode || addressData.zipCode,
        country: addressData.country || 'India',
        addressType: addressData.addressType || addressData.label?.toLowerCase() || 'home',
        isDefault: addressData.isDefault || false,
      };
      
      const response = await axiosInstance.post('/api/online/addresses', mappedData);
      return response.data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },

  /**
   * Update address
   */
  updateAddress: async (addressId, addressData) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Map form fields to backend fields
      const mappedData = {
        userId,
        name: addressData.name || addressData.fullName,
        phone: addressData.phone || addressData.phoneNumber,
        alternatePhone: addressData.alternatePhone || null,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2 || null,
        landmark: addressData.landmark || null,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode || addressData.zipCode,
        country: addressData.country || 'India',
        addressType: addressData.addressType || addressData.label?.toLowerCase() || 'home',
        isDefault: addressData.isDefault || false,
      };
      
      const response = await axiosInstance.put(`/api/online/addresses/${addressId}`, mappedData);
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  /**
   * Delete address
   */
  deleteAddress: async (addressId) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.delete(`/api/online/addresses/${addressId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  /**
   * Set default address
   */
  setDefaultAddress: async (addressId) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.patch(`/api/online/addresses/${addressId}/default`, {
        userId // Send userId in request body
      });
      return response.data;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },

  /**
   * Check pincode serviceability
   */
  checkServiceability: async (pincode) => {
    try {
      const response = await axiosInstance.get(`/api/delivery-zones/check/${pincode}`);
      return response.data;
    } catch (error) {
      console.error('Error checking serviceability:', error);
      return { success: false, serviceable: false };
    }
  },
};

export default addressService;
