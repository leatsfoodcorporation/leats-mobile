import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { 
  getMessaging, 
  getToken, 
  requestPermission as requestFirebasePermission, 
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  deleteToken as deleteFirebaseToken,
  AuthorizationStatus
} from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import { saveFCMToken, removeFCMToken, getStoredFCMToken } from '../services/notificationService';
import toast from '../utils/toast';

// Lazy-load Notifee so the app still works in environments
// where the native Notifee module isn't available (e.g. Expo Go or
// a dev build before rebuilding with the Notifee plugin).
let notifeeModule = null;
let AndroidImportanceEnum = null;

const getNotifee = () => {
  if (notifeeModule) {
    return { notifee: notifeeModule, AndroidImportance: AndroidImportanceEnum };
  }

  try {
    // First check if the native module is actually linked.
    // If it's not, don't even try to require the JS wrapper, as that will
    // log "Notifee native module not found" as an error.
    // eslint-disable-next-line global-require
    const { NativeModules } = require('react-native');
    const hasNativeNotifee =
      !!(NativeModules && (NativeModules.NotifeeApiModule || NativeModules.NotifeeModule));

    if (!hasNativeNotifee) {
      console.log('⚠️ Notifee native module not linked, skipping system notifications');
      notifeeModule = null;
      AndroidImportanceEnum = null;
      return { notifee: null, AndroidImportance: null };
    }

    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const mod = require('@notifee/react-native');
    const notifee = mod?.default || mod;
    const AndroidImportance = mod?.AndroidImportance || mod?.AndroidImportanceLevels;

    if (!notifee || !AndroidImportance) {
      throw new Error('Notifee JS module loaded but native bindings missing');
    }

    notifeeModule = notifee;
    AndroidImportanceEnum = AndroidImportance;

    console.log('✅ Notifee loaded successfully');
    return { notifee: notifeeModule, AndroidImportance: AndroidImportanceEnum };
  } catch (error) {
    console.log('⚠️ Notifee not available, falling back to toast-only notifications:', error?.message);
    notifeeModule = null;
    AndroidImportanceEnum = null;
    return { notifee: null, AndroidImportance: null };
  }
};

const NotificationContext = createContext();
const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification types that are for users only
const USER_NOTIFICATION_TYPES = [
  'ORDER_UPDATE', 'ORDER_PLACED', 'WELCOME',
  'PRICE_DROP', 'BACK_IN_STOCK', 'ABANDONED_CART', 'OUT_FOR_DELIVERY'
];

export const NotificationProvider = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const messagingInstance = getMessaging();
  const [unreadCount, setUnreadCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const [notificationsOptIn, setNotificationsOptIn] = useState(true);
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false);

  // Load persisted notification preference
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (!mounted) return;
        if (stored === null) {
          // Default: enabled (keeps existing behavior for current users)
          setNotificationsOptIn(true);
        } else {
          setNotificationsOptIn(stored === 'true');
        }
      } catch (e) {
        console.log('⚠️ Failed to load notification preference:', e?.message);
        if (mounted) setNotificationsOptIn(true);
      } finally {
        if (mounted) setIsPreferenceLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Create notification channel for Android (for local/system notifications)
   */
  const createNotificationChannel = async () => {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const { notifee, AndroidImportance } = getNotifee();

      if (!notifee || !AndroidImportance) {
        console.log('⚠️ Notifee not loaded, skipping channel creation');
        return null;
      }

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
        vibration: true,
      });

      console.log('✅ Notification channel ready:', channelId);
      return channelId;
    } catch (error) {
      console.error('❌ Error creating notification channel:', error);
      return null;
    }
  };

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    try {
      const authStatus = await requestFirebasePermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      setHasPermission(enabled);

      if (enabled) {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('⚠️ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  };

  /**
   * Get FCM token
   */
  const getFCMToken = async (retries = 3, backoff = 1000) => {
    try {
      // Check for existing token first
      let token = await getStoredFCMToken();
      
      if (!token) {
        // Try to get token from Firebase with retries for SERVICE_NOT_AVAILABLE
        for (let i = 0; i < retries; i++) {
          try {
            token = await getToken(messagingInstance);
            if (token) break;
          } catch (err) {
            console.log(`FCM Token attempt ${i + 1} failed:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
          }
        }

        if (token) {
          await AsyncStorage.setItem('fcm_token', token);
        }
      }

      setFcmToken(token);
      console.log('📱 FCM Token:', token ? token.substring(0, 20) + '...' : 'None');
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token after retries:', error);
      return null;
    }
  };

  /**
   * Setup notifications for authenticated user
   */
  const setupNotifications = useCallback(async (options = {}) => {
    const force = options?.force === true;

    if (!isAuthenticated || !user?.id) {
      console.log('⚠️ User not logged in, skipping notification setup');
      return;
    }

    if (!force && !notificationsOptIn) {
      console.log('🔕 Notifications disabled by user preference, skipping setup');
      return;
    }

    if (isSetupComplete) {
      console.log('✅ Notifications already setup for this session');
      return;
    }

    try {
      console.log('🔔 Setting up notifications for user:', user.id);
      
      // Create channels
      await createNotificationChannel();

      // Request permission
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        console.log('⚠️ Notification permission not granted');
        // If user tried to enable but permission denied, keep opt-in false
        if (force) {
          setNotificationsOptIn(false);
          await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
        }
        return;
      }

      // Get FCM token (optional - may fail on some devices)
      const token = await getFCMToken();
      if (!token) {
        console.log('⚠️ Failed to get FCM token - continuing without notifications');
        console.log('ℹ️ This may be due to Google Play Services not being available');
        setIsSetupComplete(true); // Mark as complete even without token
        return;
      }

      // Save token to backend
      console.log('💾 Saving FCM token to backend...');
      const result = await saveFCMToken(user.id, token, 'user');
      
      if (result.success) {
        console.log('✅ Notifications enabled successfully');
        console.log(`📱 Total devices: ${result.totalDevices || 1}`);
        setIsSetupComplete(true);
      } else {
        console.error('❌ Failed to save FCM token to backend:', result.error);
        setIsSetupComplete(true); // Mark as complete to prevent retry loop
      }
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
      setIsSetupComplete(true); // Mark as complete to prevent retry loop
    }
  }, [isAuthenticated, user?.id, isSetupComplete, notificationsOptIn]);

  /**
   * Display notification (increments unread count + shows system notification)
   */
  const displayNotification = async (title, body, data = {}) => {
    try {
      console.log('📱 Notification received:', { title, body });

      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Show OS-level notification using Notifee (for foreground messages)
      // Background/quit notifications are already handled by FCM via the `notification` payload.
      try {
        const { notifee } = getNotifee();

        if (!notifee) {
          console.log('⚠️ Notifee not loaded, skipping system notification display');
          return;
        }

        // Ensure permission on platforms that require it (Android 13+, iOS)
        await notifee.requestPermission();

        // Prepare Android channel
        let channelId = null;
        if (Platform.OS === 'android') {
          channelId = await createNotificationChannel();
        }

        // Parse optional vibration pattern from data payload (it arrives as a JSON string)
        let vibrationPattern;
        if (data?.vibrate) {
          try {
            const parsed = typeof data.vibrate === 'string' ? JSON.parse(data.vibrate) : data.vibrate;
            if (Array.isArray(parsed)) {
              // Notifee requires an array with an EVEN number of positive values.
              let numbers = parsed
                .map((v) => Number(v))
                .filter((v) => Number.isFinite(v) && v > 0);

              // Ensure even-length pattern; if odd, drop the last value.
              if (numbers.length % 2 !== 0) {
                numbers = numbers.slice(0, -1);
              }

              if (numbers.length >= 2) {
                vibrationPattern = numbers;
              } else {
                vibrationPattern = undefined;
              }
            }
          } catch (e) {
            console.log('⚠️ Failed to parse vibration pattern, using default', e?.message);
          }
        }

        const androidConfig =
          Platform.OS === 'android'
            ? {
                channelId: channelId || 'default',
                pressAction: { id: 'default' },
                smallIcon: 'ic_launcher', // falls back to app icon if not customised
                // Use backend-provided colors if available
                color: data?.color,
                vibrationPattern: vibrationPattern,
              }
            : undefined;

        await notifee.displayNotification({
          title,
          body,
          android: androidConfig,
          data: {
            // Preserve original data so we can handle taps in a central place later if needed
            ...data,
          },
        });
      } catch (notifeeError) {
        console.error('❌ Error showing system notification with Notifee:', notifeeError);
      }
    } catch (error) {
      console.error('❌ Error processing notification:', error);
      setUnreadCount((prev) => prev + 1);
    }
  };

  /**
   * Handle notification press (navigate to relevant screen)
   * Works for both FCM (onNotificationOpenedApp) and Notifee events.
   */
  const handleNotificationPress = useCallback((data) => {
    const type = data?.type;
    const link = data?.link;
    const orderNumber = data?.orderNumber;

    console.log('📱 Notification pressed:', { type, link, orderNumber });

    // Navigate based on notification type
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_UPDATE':
      case 'OUT_FOR_DELIVERY': {
        // Prefer deep-linking directly to order details if we have orderNumber
        if (orderNumber) {
          router.push({
            pathname: '/(stack)/order-details/[orderNumber]',
            params: { orderNumber },
          });
        } else {
          router.push('/(stack)/orders');
        }
        break;
      }

      case 'PRICE_DROP':
      case 'BACK_IN_STOCK': {
        if (data.productId) {
          router.push({
            pathname: '/(stack)/product-detail',
            params: { productId: data.productId },
          });
        } else {
          router.push('/(tabs)/products');
        }
        break;
      }

      case 'ABANDONED_CART': {
        router.push('/(tabs)/cart');
        break;
      }

      case 'WELCOME': {
        router.push('/(tabs)/home');
        break;
      }

      default: {
        if (link) {
          // If link points to a specific order on the web (/my-orders/ONL123...)
          // extract the order number and navigate to the mobile order details screen.
          if (link.includes('/my-orders/')) {
            const parts = link.split('/my-orders/');
            const orderNoFromLink = parts[1]?.split(/[/?#]/)[0];
            if (orderNoFromLink) {
              router.push({
                pathname: '/(stack)/order-details/[orderNumber]',
                params: { orderNumber: orderNoFromLink },
              });
              break;
            }
          }

          // Product links
          if (link.includes('/products/')) {
            const productId = link.split('/products/')[1]?.split(/[/?#]/)[0];
            if (productId) {
              router.push({
                pathname: '/(stack)/product-detail',
                params: { productId },
              });
              break;
            }
          }

          // Cart links
          if (link.includes('/cart')) {
            router.push('/(tabs)/cart');
            break;
          }

          // Orders list links
          if (link.includes('/orders') || link.includes('/my-orders')) {
            router.push('/(stack)/orders');
            break;
          }
        }

        // Fallback: go to home
        router.push('/(tabs)/home');
        break;
      }
    }
  }, [router]);

  /**
   * Handle foreground message
   */
  const handleForegroundMessage = useCallback(async (remoteMessage) => {
    console.log('📩 Foreground notification received:', remoteMessage);

    const { notification, data } = remoteMessage;
    const title = notification?.title || data?.notifTitle || data?.title || 'New Notification';
    const body = notification?.body || data?.notifBody || data?.body || '';
    const notificationType = data?.type || 'general';

    // Filter user-only notifications
    if (!USER_NOTIFICATION_TYPES.includes(notificationType) && notificationType !== 'general') {
      console.log(`⚠️ Skipping non-user notification: ${notificationType}`);
      return;
    }

    // Show toast for foreground notifications
    toast.info(title, body);

    // Display local notification
    await displayNotification(title, body, data);
  }, []);

  /**
   * Clear unread count
   */
  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  /**
   * Cleanup on logout
   */
  const cleanupNotifications = useCallback(async () => {
    try {
      const tokenToRemove = fcmToken || (await getStoredFCMToken());
      if (user?.id && tokenToRemove) {
        await removeFCMToken(user.id, 'user', tokenToRemove);
      }

      // Delete token from device so it stops receiving pushes ASAP
      try {
        await deleteFirebaseToken(messagingInstance);
      } catch (e) {
        console.log('⚠️ Failed to delete FCM token from device:', e?.message);
      }

      await AsyncStorage.removeItem('fcm_token');
    } catch (e) {
      console.log('⚠️ Error during notification cleanup:', e?.message);
    }
    setFcmToken(null);
    setIsSetupComplete(false);
    setUnreadCount(0);
  }, [user?.id, fcmToken]);

  const enableNotifications = useCallback(async () => {
    setNotificationsOptIn(true);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
    await setupNotifications({ force: true });
  }, [setupNotifications]);

  const disableNotifications = useCallback(async () => {
    setNotificationsOptIn(false);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
    await cleanupNotifications();
  }, [cleanupNotifications]);

  // Setup notifications when user logs in
  useEffect(() => {
    if (!isPreferenceLoaded) {
      return;
    }

    if (isAuthenticated && user?.id && notificationsOptIn) {
      console.log('👤 User authenticated, setting up notifications...');
      // Delay to ensure user is fully logged in and token is saved
      const timer = setTimeout(() => {
        setupNotifications();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      console.log('⚠️ User not authenticated, skipping notification setup');
    }
  }, [isAuthenticated, user?.id, setupNotifications, notificationsOptIn, isPreferenceLoaded]);

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onMessage(messagingInstance, handleForegroundMessage);
    return unsubscribe;
  }, [handleForegroundMessage]);

  // Listen for Notifee notification presses while app is in foreground
  useEffect(() => {
    const { notifee } = getNotifee();
    if (!notifee) {
      return;
    }

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      try {
        // Notifee versions differ in how EventType is exposed; instead of relying
        // on notifee.EventType, check for a pressAction on the event detail.
        if (detail?.pressAction && detail?.notification?.data) {
          console.log('📱 Notifee foreground notification press:', detail.notification.data);
          handleNotificationPress(detail.notification.data);
        }
      } catch (error) {
        console.error('❌ Error handling Notifee foreground press:', error);
      }
    });

    return unsubscribe;
  }, [handleNotificationPress]);

  // Listen for notification opened (app in background)
  useEffect(() => {
    const unsubscribe = onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
      console.log('📱 Notification opened app from background:', remoteMessage);
      handleNotificationPress(remoteMessage.data);
    });

    return unsubscribe;
  }, [handleNotificationPress]);

  // Check if app was opened from notification (app was quit)
  useEffect(() => {
    getInitialNotification(messagingInstance)
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📱 Notification opened app from quit state:', remoteMessage);
          handleNotificationPress(remoteMessage.data);
        }
      });
  }, [handleNotificationPress]);

  // Token refresh listener
  useEffect(() => {
    const unsubscribe = onTokenRefresh(messagingInstance, async (newToken) => {
      console.log('🔄 FCM Token refreshed');
      setFcmToken(newToken);
      await AsyncStorage.setItem('fcm_token', newToken);
      
      if (isAuthenticated && user?.id) {
        await saveFCMToken(user.id, newToken, 'user');
      }
    });

    return unsubscribe;
  }, [isAuthenticated, user?.id]);

  const value = {
    fcmToken,
    hasPermission,
    isSetupComplete,
    unreadCount,
    notificationsOptIn,
    setupNotifications,
    requestPermission,
    displayNotification,
    handleNotificationPress,
    clearUnreadCount,
    cleanupNotifications,
    enableNotifications,
    disableNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;