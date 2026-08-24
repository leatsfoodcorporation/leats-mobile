import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTabRefresh } from '../../context/TabRefreshContext';
import Header from '../../components/Header';
import { BannerCarousel, CategoryScroll, ProductSection, ComingSoonSection } from '../../components/home';
import { useLocation } from '../../context/LocationContext';
import { 
  getBanners, 
  getCategories, 
  getHomepageBadges, 
  getHomepageProducts,
  getComboHomepageProducts,
} from '../../services/frontendService';
import { useRouter } from 'expo-router';

// Cache for home screen data
let homeDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Data states
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [badges, setBadges] = useState([]);
  const [badgeProducts, setBadgeProducts] = useState({});
  const [comboProducts, setComboProducts] = useState([]);
  const { location, setIsModalOpen } = useLocation();

  // Fetch all homepage data
  const fetchHomeData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh && homeDataCache && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < CACHE_DURATION) {
          console.log('✅ Using cached home data');
          setBanners(homeDataCache.banners);
          setCategories(homeDataCache.categories);
          setBadges(homeDataCache.badges);
          setBadgeProducts(homeDataCache.badgeProducts);
          setComboProducts(homeDataCache.comboProducts);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      console.log('🔄 Fetching fresh home data...');
      setLoading(true);
      
      // Fetch banners, categories, and badges in parallel
      const [bannersRes, categoriesRes, badgesRes, comboRes] = await Promise.all([
        getBanners(),
        getCategories(),
        getHomepageBadges(),
        getComboHomepageProducts({ limit: 6 }),
      ]);

      const newBanners = bannersRes.success ? bannersRes.data : [];
      const newCategories = categoriesRes.success ? categoriesRes.data : [];
      const newComboProducts = comboRes.success ? comboRes.data : [];

      setBanners(newBanners);
      setCategories(newCategories);
      setComboProducts(newComboProducts);

      // Process badges and fetch products for each
      if (badgesRes.success && badgesRes.data.length > 0) {
        setBadges(badgesRes.data);

        // Fetch products for each badge in parallel
        const badgeProductPromises = badgesRes.data.map(badge => 
          getHomepageProducts({ badge: badge.name, limit: 10 })
        );

        const badgeProductResults = await Promise.all(badgeProductPromises);

        // Map badge products by badge name
        const productsMap = {};
        badgesRes.data.forEach((badge, index) => {
          if (badgeProductResults[index].success) {
            productsMap[badge.name] = badgeProductResults[index].data;
          }
        });
        setBadgeProducts(productsMap);

        // Cache the data
        homeDataCache = {
          banners: newBanners,
          categories: newCategories,
          badges: badgesRes.data,
          badgeProducts: productsMap,
          comboProducts: newComboProducts,
        };
        cacheTimestamp = Date.now();
      }

      console.log('✅ Home data fetched and cached successfully');
    } catch (error) {
      console.error('❌ Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Pull to refresh - force refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData(true); // Force refresh
  }, [fetchHomeData]);

  // Use focus effect instead of useEffect for better tab navigation
  useFocusEffect(
    useCallback(() => {
      // Always set cached data first if available
      if (homeDataCache && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < CACHE_DURATION) {
          console.log('✅ Screen focused - using cached data');
          setBanners(homeDataCache.banners);
          setCategories(homeDataCache.categories);
          setBadges(homeDataCache.badges);
          setBadgeProducts(homeDataCache.badgeProducts);
          setComboProducts(homeDataCache.comboProducts);
          setLoading(false);
          return;
        }
      }
      // No cache or cache expired - fetch fresh data
      fetchHomeData();
    }, [fetchHomeData])
  );

  // Listen for refresh triggers from the BottomTabBar
  useTabRefresh('home', onRefresh);

  // Map badges by sortOrder
  const badgesBySortOrder = badges.reduce((acc, badge) => {
    acc[badge.sortOrder] = badge;
    return acc;
  }, {});

  // Get badges for different sections
  const categoryFilterBadge = badgesBySortOrder[0]; // sortOrder 0 - Shows with category filter
  const badge1 = badgesBySortOrder[1]; // sortOrder 1
  const badge2 = badgesBySortOrder[2]; // sortOrder 2
  const badge3 = badgesBySortOrder[3]; // sortOrder 3
  
  // Additional badges (sortOrder >= 4)
  const additionalBadges = badges.filter(badge => badge.sortOrder >= 4);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header 
          navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
          showSearch={true}
          cartCount={0}
          wishlistCount={0} 
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e63946" />
          <Text className="mt-3 text-gray-500">Loading...</Text>
        </View>
      </View>
    );
  }

  if (location?.isServiceable === false) {
    const placeParts = [location.area, location.city, location.state].filter(Boolean);
    const placeText = placeParts.join(', ');

    return (
      <View className="flex-1 bg-gray-50">
        <Header 
          navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
          showSearch={true}
          cartCount={0}
          wishlistCount={0}
          scrollY={scrollY}
        />
        <View className="flex-1 px-6 py-8 justify-center">
          <View className="rounded-3xl bg-white p-6 shadow-sm border border-red-100">
            <Text className="text-2xl font-bold text-red-700">Not Serviceable</Text>
            <Text className="mt-4 text-sm text-gray-600 leading-6">
              {`We do not deliver to ${placeText} yet`}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
        showSearch={true}
        cartCount={0}
        wishlistCount={0}
        scrollY={scrollY}
      />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#e63946']}
            tintColor="#e63946"
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Banner Carousel */}
        <BannerCarousel banners={banners} />

        {/* sortOrder 0: Badge with Category Filter */}
        {categoryFilterBadge && badgeProducts[categoryFilterBadge.name]?.length > 0 && (
          <ProductSection
            badgeName={categoryFilterBadge.name}
            badgeSubtitle="Most popular products near you"
            initialProducts={badgeProducts[categoryFilterBadge.name] || []}
            categories={categories}
            showCategoryFilter={true}
            backgroundColor="bg-white"
          />
        )}

        {/* sortOrder 1: Simple badge section */}
        {badge1 && badgeProducts[badge1.name]?.length > 0 && (
          <ProductSection
            badgeName={badge1.name}
            badgeSubtitle="Fresh products just for you"
            initialProducts={badgeProducts[badge1.name] || []}
            backgroundColor="bg-gray-50"
          />
        )}

        {/* Shop by Category (DealsSection equivalent) */}
        <CategoryScroll categories={categories} />

        {/* Coming Soon Promo Cards */}
        <ComingSoonSection />

        {/* sortOrder 2: Simple badge section */}
        {badge2 && badgeProducts[badge2.name]?.length > 0 && (
          <ProductSection
            badgeName={badge2.name}
            badgeSubtitle="Best deals with maximum savings"
            initialProducts={badgeProducts[badge2.name] || []}
            backgroundColor="bg-white"
          />
        )}

        {/* sortOrder 3: Simple badge section */}
        {badge3 && badgeProducts[badge3.name]?.length > 0 && (
          <ProductSection
            badgeName={badge3.name}
            badgeSubtitle="Limited time offers"
            initialProducts={badgeProducts[badge3.name] || []}
            backgroundColor="bg-gray-50"
          />
        )}

        {/* Combo Products Section */}
        {comboProducts.length > 0 && (
          <ProductSection
            badgeName="Combo Offers"
            badgeSubtitle="Save more with combos"
            initialProducts={comboProducts}
            backgroundColor="bg-white"
          />
        )}

        {/* Additional Badge Sections (sortOrder >= 4) */}
        {additionalBadges.map((badge, index) => {
          const products = badgeProducts[badge.name] || [];
          // Only render if products exist
          if (products.length === 0) return null;
          
          return (
            <ProductSection
              key={badge.id}
              badgeName={badge.name}
              initialProducts={products}
              categories={categories}
              backgroundColor={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
            />
          );
        })}

        {/* Bottom Spacing */}
        <View className="h-4" />
      </Animated.ScrollView>
    </View>
  );
};

export default HomeScreen;