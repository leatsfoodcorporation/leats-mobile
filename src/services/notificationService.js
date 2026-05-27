import axiosInstance from '../lib/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Notification Service
 * Handles FCM token management and notification API calls
 * Matches frontend lib/fcmTokenService.ts patterns
 */

// Storage keys
const FCM_TOKEN_KEY = 'fcm_token';
const FCM_TOKEN_SAVED_KEY = 'fcm_token_saved';

/**
 * Get device information for FCM token registration
 */
const getDeviceInfo = () => {
  const brand = Device.brand || 'Unknown';
  const modelName = Device.modelName || 'Unknown';
  const osName = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const osVersion = Platform.Version;
  
  return `${brand} ${modelName} (${osName} ${osVersion})`;
};

/**
 * Save FCM token to backend
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM device token
 * @param {string} userType - 'user' or 'admin'
 */
export const saveFCMToken = async (userId, fcmToken, userType = 'user') => {
  try {
    if (!userId || !fcmToken) {
      console.log('⚠️ Missing userId or fcmToken');
      return { success: false, error: 'Missing userId or fcmToken' };
    }

    // Check if token already saved for this user
    const savedTokenKey = `${FCM_TOKEN_SAVED_KEY}_${userId}_${userType}`;
    const savedToken = await AsyncStorage.getItem(savedTokenKey);
    
    if (savedToken === fcmToken) {
      console.log('✅ FCM token already saved for this user, skipping...');
      return { success: true, totalDevices: 1 };
    }

    const deviceInfo = getDeviceInfo();
    console.log('📱 Device Info:', deviceInfo);

    const response = await axiosInstance.post('/api/auth/fcm-token', {
      userId,
      fcmToken,
      userType,
      deviceInfo,
    });

    if (response.data.success) {
      const totalDevices = response.data.data?.totalDevices || 1;
      console.log(`✅ FCM token saved to backend - Total devices: ${totalDevices}`);
      
      // Cache the token to prevent duplicate saves
      await AsyncStorage.setItem(savedTokenKey, fcmToken);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      
      return { success: true, totalDevices };
    } else {
      console.error('❌ Failed to save FCM token:', response.data.error);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove FCM token from backend (on logout)
 * @param {string} userId - User ID
 * @param {string} userType - 'user' or 'admin'
 * @param {string} fcmToken - Optional specific token to remove
 */
export const removeFCMToken = async (userId, userType = 'user', fcmToken = null) => {
  try {
    const data = { userId, userType };
    
    if (fcmToken) {
      data.fcmToken = fcmToken;
      console.log('🔓 Logging out from current device only');
    } else {
      // Get stored token if not provided
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken) {
        data.fcmToken = storedToken;
      }
      console.log('🔓 Logging out from current device');
    }

    const response = await axiosInstance.delete('/api/auth/fcm-token', { data });

    if (response.data.success) {
      console.log('✅ FCM token removed from backend');
      
      // Clear cached tokens
      const savedTokenKey = `${FCM_TOKEN_SAVED_KEY}_${userId}_${userType}`;
      await AsyncStorage.removeItem(savedTokenKey);
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      
      return { success: true };
    } else {
      console.error('❌ Failed to remove FCM token:', response.data.error);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get stored FCM token
 */
export const getStoredFCMToken = async () => {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Error getting stored FCM token:', error);
    return null;
  }
};

/**
 * Clear all notification data
 */
export const clearNotificationData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const fcmKeys = keys.filter(key => 
      key.startsWith(FCM_TOKEN_SAVED_KEY) || key === FCM_TOKEN_KEY
    );
    await AsyncStorage.multiRemove(fcmKeys);
    console.log('✅ Notification data cleared');
  } catch (error) {
    console.error('❌ Error clearing notification data:', error);
  }
};

export default {
  saveFCMToken,
  removeFCMToken,
  getStoredFCMToken,
  clearNotificationData,
  getDeviceInfo,
};