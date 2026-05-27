import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import LoginRequired from '../../components/LoginRequired';
import { useAuthCheck } from '../../hooks/useAuthProtection';
import { useWishlist } from '../../context/WishlistContext';
import { useTabRefresh } from '../../context/TabRefreshContext';
import ProductCard from '../../components/products/ProductCard';

const PRIMARY_COLOR = '#e63946';

const WishlistScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
  const { 
    wishlistItems, 
    wishlistCount, 
    isLoading, 
    fetchWishlist,
    clearWishlist,
  } = useWishlist();
  
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }, [fetchWishlist]);

  // Tab refresh
  useTabRefresh('wishlist', onRefresh);

  // Handle clear all wishlist
  const handleClearAll = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearWishlist();
          },
        },
      ]
    );
  };

  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }} />
        <LoginRequired
          title="Sign In to View Wishlist"
          message="Please sign in to save and view your favorite items"
          icon="heart-outline"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }} scrollY={scrollY} hideCategories={true} />

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
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Wishlist Header */}
        <View className="bg-white py-4">
          <View className="px-4 mb-3 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">My Wishlist</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            
            {wishlistCount > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                className="flex-row items-center px-3 py-2 border border-red-200 rounded-lg bg-red-50"
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text className="text-sm font-semibold text-red-600 ml-1.5">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View className="h-64 items-center justify-center">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text className="text-gray-600 mt-3">Loading wishlist...</Text>
            </View>
          ) : wishlistItems.length === 0 ? (
            <View className="py-8 px-4 items-center">
              <View className="w-32 h-32 bg-red-50 rounded-full items-center justify-center mb-6">
                <Ionicons name="heart-outline" size={64} color={PRIMARY_COLOR} />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</Text>
              <Text className="text-gray-500 text-center mb-8 px-4">
                Save items you love by tapping the heart icon on products
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/products')}
                className="px-8 py-4 rounded-xl shadow-sm"
                style={{ backgroundColor: PRIMARY_COLOR, elevation: 2 }}
              >
                <Text className="text-white font-bold text-base">Browse Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-4">
              {wishlistItems.map((item) => {
                // Normalize product data for ProductCard
                const normalizedProduct = {
                  ...item,
                  id: item.id || item.productId, // ProductCard expects 'id' field
                  cuttingStyles: item.cuttingStyles || [], // Ensure cutting styles are available
                };

                // Fix image data structure - ProductCard expects variants[].variantImages[] or thumbnail
                if (item.defaultProductImage && item.variants && item.variants.length > 0) {
                  // Add defaultProductImage to first variant's variantImages if not already present
                  normalizedProduct.variants = item.variants.map((variant, index) => {
                    if (index === 0 && (!variant.variantImages || variant.variantImages.length === 0)) {
                      return {
                        ...variant,
                        variantImages: [item.defaultProductImage]
                      };
                    }
                    return variant;
                  });
                }

                // For combo products, ensure thumbnail is set
                if (item.type === 'combo' && item.defaultProductImage && !normalizedProduct.thumbnail) {
                  normalizedProduct.thumbnail = item.defaultProductImage;
                }
                
                return (
                  <View 
                    key={item.wishlistItemId || item.productId || item.id} 
                    className="mb-3"
                  >
                    <ProductCard 
                      product={normalizedProduct}
                      compact={false}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default WishlistScreen;
