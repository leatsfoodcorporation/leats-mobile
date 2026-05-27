import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Get FCM token and remove from backend before clearing local storage
      const fcmToken = await AsyncStorage.getItem('fcm_token');
      if (user?.id && fcmToken) {
        try {
          const { removeFCMToken } = await import('../services/notificationService');
          await removeFCMToken(user.id, 'user', fcmToken);
          console.log('✅ FCM token removed from backend');
        } catch (fcmError) {
          console.error('⚠️ Failed to remove FCM token:', fcmError);
        }
      }

      // Clear all auth-related data
      await AsyncStorage.multiRemove(['token', 'user', 'fcm_token']);
      
      // Clear FCM token saved keys
      const keys = await AsyncStorage.getAllKeys();
      const fcmKeys = keys.filter(key => key.startsWith('fcm_token_saved_'));
      if (fcmKeys.length > 0) {
        await AsyncStorage.multiRemove(fcmKeys);
      }

      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('❌ Update user error:', error);
    }
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUserData: checkAuth,
  }), [user, isLoading, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
