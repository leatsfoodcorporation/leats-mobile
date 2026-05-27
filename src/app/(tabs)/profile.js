import { memo } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Animated,
  Switch,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import Header from '../../components/Header';
import LoginRequired from '../../components/LoginRequired';
import { useAuth } from '../../context/AuthContext';
import { useAuthCheck } from '../../hooks/useAuthProtection';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotifications } from '../../context/NotificationContext';
import { getWebSettings } from '../../services/webSettingsService';
import toast from '../../utils/toast';
import { useRouter } from 'expo-router';

const PRIMARY_COLOR = '#e63946';

// Cache for web settings
let webSettingsCache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const MenuItem = memo(({ icon, label, onPress, badge, iconLibrary = 'Ionicons', rightComponent }) => {
  const IconComponent = iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between bg-white px-4 py-4 border-b border-gray-100"
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: '#FEE2E2' }}
        >
          <IconComponent name={icon} size={22} color={PRIMARY_COLOR} />
        </View>
        <Text className="text-base text-gray-800 font-medium">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {badge !== undefined && badge > 0 && (
          <View
            className="bg-red-500 rounded-full px-2 py-0.5 mr-2 min-w-[20px] items-center"
          >
            <Text className="text-white text-xs font-bold">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
        {rightComponent ?? <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
      </View>
    </TouchableOpacity>
  );
});

MenuItem.displayName = 'MenuItem';

const ProfileScreen = memo(() => {
  const { user, logout } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { notificationsOptIn, enableNotifications, disableNotifications } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [webSettings, setWebSettings] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchWebSettings = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = webSettingsCache.data && (now - webSettingsCache.timestamp < CACHE_DURATION);

    if (!forceRefresh && isCacheValid) {
      setWebSettings(webSettingsCache.data);
      return;
    }

    try {
      // Web settings fetch is silent, no loading state needed
      const response = await getWebSettings();
      if (response.success) {
        webSettingsCache = {
          data: response.data,
          timestamp: now,
        };
        setWebSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching web settings:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWebSettings();
    }, [fetchWebSettings])
  );

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutConfirm(false);
      await logout();
      toast.success('Logged Out', 'You have been logged out successfully');
      
      // Navigate to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      toast.error('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleNotificationToggle = async (value) => {
    try {
      if (value) {
        await enableNotifications();
        toast.success('Notifications Enabled', 'You will receive order updates on this device.');
      } else {
        await disableNotifications();
        toast.info('Notifications Disabled', 'You will no longer receive push notifications from this device.');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header 
          navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
          showSearch={false}
          cartCount={0}
          wishlistCount={0}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </View>
    );
  }

  // Show login required if not authenticated
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header 
          navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
          showSearch={false}
          cartCount={0}
          wishlistCount={0}
        />
        <LoginRequired 
          title="Sign In to View Profile"
          message="Please sign in to access your profile and account settings"
          icon="person-outline"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
        showSearch={false}
        cartCount={0}
        wishlistCount={0}
        scrollY={scrollY}
        hideCategories={true}
      />
      
      <Animated.ScrollView 
        className="flex-1"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
       

        {/* User Profile Section */}
        <View className="bg-white px-4 py-6 mb-2">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <Text className="text-white text-xl font-bold">
                  {getUserInitials()}
                </Text>
              )}
            </View>

            {/* User Info */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {user?.name || 'Guest User'}
              </Text>
              <Text className="text-sm text-gray-600">
                {user?.email || 'guest@example.com'}
              </Text>
              {user?.role && (
                <View className="mt-1">
                  <Text
                    className="text-xs font-semibold uppercase"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    {user.role}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Menu Items */}
        <View className="mb-2">
          <MenuItem
            icon="person-outline"
            label="User Profile"
            onPress={() => router.push('/(stack)/user-profile')}
          />
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push('/(stack)/orders')}
          />
          <MenuItem
            icon="cart-outline"
            label="My Cart"
            onPress={() => router.push('/(tabs)/cart')}
            badge={cartCount}
          />
          <MenuItem
            icon="heart-outline"
            label="My Wishlist"
            onPress={() => router.push('/(stack)/wishlist')}
            badge={wishlistCount}
          />
          <MenuItem
            icon="location-outline"
            label="My Addresses"
            onPress={() => router.push('/(stack)/addresses')}
          />
        </View>

        {/* Settings */}
        <View className="mb-2 mt-2">
          <Text className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
            Information
          </Text>
          <MenuItem
            icon="help-circle-outline"
            label="FAQs"
            onPress={() => router.push('/(stack)/faq')}
          />
          <MenuItem
            icon="cube-outline"
            label="Bulk Order"
            onPress={() => router.push('/(stack)/bulk-order')}
            iconLibrary="Ionicons"
          />
          <MenuItem
            icon="restaurant-outline"
            label="Catering Service"
            onPress={() => router.push('/(stack)/catering-service')}
          />
        </View>

        {/* Policies */}
        <View className="mb-2 mt-2">
          <Text className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
            Policies
          </Text>
          <MenuItem
            icon="car-outline"
            label="Shipping Policy"
            onPress={() => router.push('/(stack)/shipping-policy')}
          />
          <MenuItem
            icon="return-down-back-outline"
            label="Returns & Refunds"
            onPress={() => router.push('/(stack)/returns-policy')}
          />
          <MenuItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => router.push('/(stack)/privacy-policy')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => router.push('/(stack)/terms-conditions')}
          />
        </View>

        {/* Support */}
        <View className="mb-2 mt-2">
          <Text className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
            Support
          </Text>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            rightComponent={
              <Switch
                value={!!notificationsOptIn}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#D1D5DB', true: PRIMARY_COLOR + '80' }}
                thumbColor={notificationsOptIn ? PRIMARY_COLOR : '#f4f3f4'}
              />
            }
          />
          <MenuItem
            icon="headset-outline"
            label="Help & Support"
            onPress={() => {}}
          />
        </View>

        {/* Logout Button */}
        <View className="px-4 py-6">
          <TouchableOpacity
            onPress={handleLogoutPress}
            className="flex-row items-center justify-center py-4 rounded-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Ionicons name="log-out-outline" size={22} color="white" />
            <Text className="text-white text-base font-bold ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="px-4 pb-4">
          <Text className="text-center text-xs text-gray-400">
            Version {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={handleLogoutCancel}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            {/* Icon */}
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Logout Confirmation
            </Text>

            {/* Message */}
            <Text className="text-base text-gray-600 text-center mb-6">
              Are you sure you want to logout from your account?
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleLogoutCancel}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 text-base font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogoutConfirm}
                className="flex-1 py-3 rounded-lg"
                style={{ backgroundColor: '#EF4444' }}
              >
                <Text className="text-white text-base font-semibold text-center">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

ProfileScreen.displayName = 'ProfileScreen';

export default ProfileScreen;