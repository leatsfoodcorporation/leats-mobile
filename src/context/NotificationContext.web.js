import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import toast from '../utils/toast';

const NotificationContext = createContext();
const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [notificationsOptIn, setNotificationsOptIn] = useState(true);
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (!mounted) return;

        if (stored === null) {
          setNotificationsOptIn(true);
        } else {
          setNotificationsOptIn(stored === 'true');
        }
      } catch (error) {
        console.log('⚠️ Failed to load notification preference on web:', error?.message);
        if (mounted) setNotificationsOptIn(true);
      } finally {
        if (mounted) setIsPreferenceLoaded(true);
      }
    };

    loadPreference();
    return () => {
      mounted = false;
    };
  }, []);

  const enableNotifications = useCallback(async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
      setNotificationsOptIn(true);
      toast.info('Notifications are enabled for web (no native push available)');
    } catch (error) {
      console.error('Failed to enable notifications on web:', error);
      throw error;
    }
  }, []);

  const disableNotifications = useCallback(async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setNotificationsOptIn(false);
      toast.info('Notifications are disabled for web');
    } catch (error) {
      console.error('Failed to disable notifications on web:', error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      notificationsOptIn,
      enableNotifications,
      disableNotifications,
      isWeb: true,
      isPreferenceLoaded,
    }),
    [notificationsOptIn, enableNotifications, disableNotifications, isPreferenceLoaded]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
