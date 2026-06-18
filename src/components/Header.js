import { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPromotionalCoupons } from '../services/couponService';
import { getWebSettings } from '../services/webSettingsService';
import { getCategories } from '../services/frontendService';
import { useLocation } from '../context/LocationContext';
import { detectLocationByCoords } from '../services/deliveryZoneService';
import { useWishlist } from '../context/WishlistContext';
import { getFullImageUrl } from '../lib/image-utils';
import OrderCountdownBanner from './OrderCountdownBanner';
import * as Location from 'expo-location';

const PRIMARY_COLOR = '#e63946';

const Header = memo(({ navigation, scrollY, hideCategories = false }) => {
  const router = useRouter();
  const [promotionalOffers, setPromotionalOffers] = useState([]);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [webSettings, setWebSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const { wishlistCount } = useWishlist();
  
  // Animation values
  const offerAnimation = useRef(new Animated.Value(0)).current;
  const placeholderAnimation = useRef(new Animated.Value(0)).current;
  
  // Ultra smooth scroll-based animations with extended ranges
  const locationBarHeight = scrollY ? scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [40, 0],
    extrapolate: 'clamp',
    easing: (t) => t * t * (3 - 2 * t), // Smoothstep easing
  }) : new Animated.Value(40);

  const locationBarOpacity = scrollY ? scrollY.interpolate({
    inputRange: [0, 50, 100, 150],
    outputRange: [1, 0.8, 0.3, 0],
    extrapolate: 'clamp',
    easing: (t) => t * t * (3 - 2 * t), // Smoothstep easing
  }) : new Animated.Value(1);

  // Promotional banner ultra smooth animation
  const promoBarHeight = scrollY ? scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [32, 0],
    extrapolate: 'clamp',
    easing: (t) => t * t * (3 - 2 * t), // Smoothstep easing
  }) : new Animated.Value(32);

  const promoBarOpacity = scrollY ? scrollY.interpolate({
    inputRange: [0, 30, 60, 100],
    outputRange: [1, 0.8, 0.3, 0],
    extrapolate: 'clamp',
    easing: (t) => t * t * (3 - 2 * t), // Smoothstep easing
  }) : new Animated.Value(1);

  const { location, setIsModalOpen, saveLocation, checkPincode } = useLocation();
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectAndSaveLocation = async () => {
    if (location || detectingLocation) return;

    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 0,
        timeout: 15000,
      });

      const { latitude, longitude } = currentPosition.coords;
      const response = await detectLocationByCoords(latitude, longitude);
      console.log('Location detection response:', response);

      if (response.success && response.data?.pincode) {
        const pincode = response.data.pincode;
        const city = response.data.city || '';
        const state = response.data.state || '';
        const country = response.data.country || 'India';
        let isServiceable = response.serviceable;

        if (isServiceable === false) {
          const checkResult = await checkPincode(pincode, country, city, state);
          isServiceable = checkResult.serviceable;
        }

        console.log('Detected location details:', { pincode, city, state, country, isServiceable });

        saveLocation({
          pincode,
          city,
          state,
          country,
          isServiceable: isServiceable === true,
        });
      }
    } catch (error) {
      console.error('Location detection failed:', error);
    } finally {
      setDetectingLocation(false);
    }
  };

  // Fetch promotional offers and web settings on mount and auto-detect postal code once
  useEffect(() => {
    detectAndSaveLocation();
    // fetchPromotionalOffers();
    fetchWebSettings();
    fetchCategories();
  }, []);

  // Auto-rotate category names in placeholder
  useEffect(() => {
    if (categories.length > 1) {
      const interval = setInterval(() => {
        // Fade out
        Animated.timing(placeholderAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Change category
          setCurrentCategoryIndex((prev) => 
            (prev + 1) % categories.length
          );
          
          // Fade in
          Animated.timing(placeholderAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }, 3000); // Change every 3 seconds

      return () => clearInterval(interval);
    }
  }, [categories, placeholderAnimation]);

  // Auto-rotate promotional offers
  useEffect(() => {
    if (promotionalOffers.length > 1) {
      const interval = setInterval(() => {
        // Fade out
        Animated.timing(offerAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Change offer
          setCurrentOfferIndex((prev) => 
            (prev + 1) % promotionalOffers.length
          );
          
          // Fade in
          Animated.timing(offerAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [promotionalOffers, offerAnimation]);

  const fetchPromotionalOffers = async () => {
    try {
      const response = await getPromotionalCoupons();
      if (response.success && response.data.length > 0) {
        setPromotionalOffers(response.data);
      }
    } catch (error) {
      console.error('Error fetching promotional offers:', error);
    }
  };

  const fetchWebSettings = async () => {
    try {
      const response = await getWebSettings();
      if (response.success && response.data) {
        setWebSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching web settings:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
        // Extract category names
        const categoryNames = response.data.map(cat => cat.name);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearchPress = () => {
    router.push('/(stack)/search');
  };

  const formatOfferText = (offer) => {
    if (!offer) return '';
    
    let text = '';
    
    if (offer.description) {
      if (offer.discountType === 'percentage') {
        text = `${offer.description} - ${offer.discountValue}% OFF`;
      } else {
        text = `${offer.description} - ₹${offer.discountValue} OFF`;
      }
      return text;
    }

    if (offer.discountType === 'percentage') {
      text = `Get ${offer.discountValue}% OFF`;
      if (offer.maxDiscountAmount) {
        text += ` (up to ₹${offer.maxDiscountAmount})`;
      }
    } else {
      text = `Flat ₹${offer.discountValue} OFF`;
    }

    if (offer.minOrderValue) {
      text += ` on orders ₹${offer.minOrderValue}+`;
    }

    if (offer.usageType === 'first-time-user-only') {
      text += ' • First Time User';
    }

    return text;
  };

  return (
    <>
      <StatusBar 
        style="light" 
        backgroundColor={PRIMARY_COLOR}
        translucent={true}
      />
      
      <SafeAreaView 
        edges={['top', 'left', 'right']} 
        style={{ backgroundColor: PRIMARY_COLOR }}
      >
        {/* Promotional Banner - Smooth Animated */}
        {promotionalOffers.length > 0 ? (
          <Animated.View
            style={{
              backgroundColor: PRIMARY_COLOR,
              opacity: Animated.multiply(
                offerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                promoBarOpacity
              ),
              height: promoBarHeight,
              overflow: 'hidden',
            }}
          >
            <View style={{ paddingVertical: 8, paddingHorizontal: 16, height: 32 }}>
              <Text
                className="text-white text-center text-xs font-medium"
                numberOfLines={1}
              >
                🎊 {formatOfferText(promotionalOffers[currentOfferIndex])}
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              backgroundColor: PRIMARY_COLOR,
              opacity: promoBarOpacity,
              height: promoBarHeight,
              overflow: 'hidden',
            }}
          >
            <OrderCountdownBanner />
          </Animated.View>
        )}

        {/* Main Header */}
        <View className="bg-white">
          {/* Delivery Location Bar - Smooth Animated */}
          <Animated.View
            style={{
              opacity: locationBarOpacity,
              height: locationBarHeight,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => setIsModalOpen(true)}
              className="flex-row items-center px-4 py-2 border-b border-gray-100"
              style={{ height: 40 }}
            >
              <Ionicons name="location" size={18} color={PRIMARY_COLOR} />
              <View className="flex-1 ml-2">
                <Text className="text-[10px] text-gray-500 font-medium uppercase">
                  Available in
                </Text>
                <Text className="text-xs font-bold text-gray-900" numberOfLines={1}>
                  {location ? (
                    location.pincode ? (
                      location.city ? `${location.city}, ${location.pincode}` : location.pincode
                    ) : 'Select Location'
                  ) : detectingLocation ? 'Detecting postal code...' : 'Select Location'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </Animated.View>

          {/* Logo and Search Bar */}
          <View className="flex-row items-center px-4 py-3 gap-3">
            {/* Logo - Left Side */}
            <View>
              {webSettings?.logoUrl && webSettings.logoUrl.trim() !== '' ? (
                <Image
                  source={{ uri: getFullImageUrl(webSettings.logoUrl) }}
                  style={{ width: 100, height: 40 }}
                  resizeMode="contain"
                  transition={200}
                  priority="high"
                  cachePolicy="memory-disk"
                />
              ) : (
                <Text className="text-[#e63946] font-bold text-xl">LEATS</Text>
              )}
            </View>

            {/* Search Bar - Center */}
            <TouchableOpacity
              onPress={handleSearchPress}
              className="flex-1"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2.5">
                <Feather name="search" size={20} color="#9CA3AF" />
                <Animated.Text 
                  className="flex-1 ml-2 text-gray-400 text-sm"
                  style={{
                    opacity: placeholderAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  }}
                  numberOfLines={1}
                >
                  {categories.length > 0 
                    ? `${categories[currentCategoryIndex]}` 
                    : 'Search products...'}
                </Animated.Text>
              </View>
            </TouchableOpacity>

            {/* Wishlist Icon - Right Side */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/wishlist')}
              className="relative"
              activeOpacity={0.7}
            >
              <Ionicons name="heart-outline" size={26} color="#374151" />
              {wishlistCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-[#e63946] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Category Scroll Bar */}
          {!hideCategories && categories.length > 0 && (
            <View className="bg-[#e63946]">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
              >
                {categories.map((categoryName, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/products',
                        params: { category: categoryName }
                      });
                    }}
                    className="mr-6"
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm font-medium text-white">
                      {categoryName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
});

Header.displayName = 'Header';

export default Header;
