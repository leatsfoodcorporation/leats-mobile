import { memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import LoginRequired from '../../components/LoginRequired';
import { useAuthCheck } from '../../hooks/useAuthProtection';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { getFullImageUrl } from '../../lib/image-utils';
import { useCurrency } from '../../hooks/useCurrency';

const PRIMARY_COLOR = '#e63946';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2; // 12px padding + 12px gap

// Wishlist Product Card Component
const WishlistCard = memo(({ item, onRemove }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const currencySymbol = useCurrency();

  // Get product data
  const productId = item.productId || item.id;
  const name = item.shortDescription || item.name || 'Product';
  const brand = item.brand || '';
  
  // Get variant data
  const variant = item.variants?.[0] || item;
  const price = item.variantSellingPrice || variant.variantSellingPrice || item.defaultSellingPrice || 0;
  const mrp = item.variantMRP || variant.variantMRP || item.defaultMRP || 0;
  const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  
  // Get image
  const imageUrl = getFullImageUrl(
    variant.variantImages?.[0] || 
    item.variantImages?.[0] || 
    item.defaultProductImage || 
    item.thumbnail
  );

  // Stock status
  const stockQuantity = item.variantStockQuantity || variant.variantStockQuantity || 0;
  const isOutOfStock = stockQuantity <= 0 || item.variantStockStatus === 'out-of-stock';

  const handlePress = () => {
    // Navigate to product detail with productId
    router.push({
      pathname: '/(stack)/product-detail',
      params: { productId: productId }
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    
    // Prepare proper product object for cart
    // The addToCart function expects: product.variants[variantIndex].inventoryProductId
    const productForCart = {
      id: productId,
      shortDescription: name,
      type: item.type,
      variants: item.variants || [{
        inventoryProductId: item.inventoryProductId || productId,
        variantSellingPrice: price,
        variantMRP: mrp,
        variantStockQuantity: stockQuantity,
        variantStockStatus: item.variantStockStatus,
        variantUom: item.variantUom,
        variantUomValue: item.variantUomValue,
        variantImages: variant.variantImages || [item.defaultProductImage || item.thumbnail],
        ...variant
      }],
      ...item
    };
    
    // Use variantIndex 0 since we're using the first/default variant
    await addToCart(productForCart, 0, null, 1);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white rounded-xl overflow-hidden mb-3"
      style={{ width: CARD_WIDTH }}
    >
      {/* Product Image */}
      <View className="relative bg-gray-100" style={{ height: CARD_WIDTH }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            
            priority="low"
            cachePolicy="memory-disk"
            recyclingKey={`wishlist-${productId}`}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={40} color="#D1D5DB" />
          </View>
        )}
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">{discountPercentage}% OFF</Text>
          </View>
        )}

        {/* Remove from Wishlist Button */}
        <TouchableOpacity
          onPress={() => onRemove(item)}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm"
          style={{ elevation: 2 }}
        >
          <Ionicons name="close" size={16} color="#EF4444" />
        </TouchableOpacity>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <View className="bg-white px-3 py-1 rounded">
              <Text className="text-xs font-bold text-gray-800">Out of Stock</Text>
            </View>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="p-3">
        {/* Brand */}
        {brand && (
          <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
            {brand}
          </Text>
        )}

        {/* Product Name */}
        <Text className="text-sm font-medium text-gray-800 mb-2" numberOfLines={2}>
          {name}
        </Text>

        {/* Price */}
        <View className="flex-row items-center mb-2">
          <Text className="text-base font-bold text-gray-900">
            {currencySymbol}{price.toFixed(0)}
          </Text>
          {mrp > price && (
            <Text className="text-xs text-gray-400 line-through ml-2">
              {currencySymbol}{mrp.toFixed(0)}
            </Text>
          )}
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          className={`py-2 rounded-lg items-center ${
            isOutOfStock ? 'bg-gray-200' : 'bg-[#e63946]'
          }`}
        >
          <Text className={`text-sm font-semibold ${
            isOutOfStock ? 'text-gray-400' : 'text-white'
          }`}>
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

WishlistCard.displayName = 'WishlistCard';

const WishlistScreen = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
  const { 
    wishlistItems, 
    wishlistCount, 
    isLoading, 
    fetchWishlist,
    clearWishlist,
    removeFromWishlist,
  } = useWishlist();
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch wishlist on screen focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchWishlist();
      }
    }, [isAuthenticated, fetchWishlist])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }, [fetchWishlist]);

  // Handle remove single item
  const handleRemoveItem = async (item) => {
    const productId = item.productId || item.id;
    await removeFromWishlist(productId);
  };

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
      <>
        <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#e63946' }}>
          <View 
            className="flex-1 bg-gray-50"
            style={{ 
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }}
          >
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#e63946' }}>
          <View 
            className="flex-1 bg-gray-50"
            style={{ 
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }}
          >
            {/* Header */}
            <View className="bg-white border-b border-gray-200">
              <View className="flex-row items-center px-4 py-3">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="p-2 -ml-2 mr-2"
                >
                  <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-800">My Wishlist</Text>
              </View>
            </View>
            <LoginRequired
              title="Sign In to View Wishlist"
              message="Please sign in to save and view your favorite items"
              icon="heart-outline"
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#e63946' }}>
        <View 
          className="flex-1 bg-gray-50"
          style={{ 
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
          {/* Header */}
          <View className="bg-white border-b border-gray-200">
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center flex-1">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="p-2 -ml-2 mr-2"
                >
                  <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <View>
                  <Text className="text-lg font-bold text-gray-800">My Wishlist</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              
              {/* Clear All Button */}
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
          </View>

          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text className="text-gray-600 mt-3">Loading wishlist...</Text>
            </View>
          ) : wishlistItems.length === 0 ? (
            <View className="flex-1 items-center justify-center p-6">
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
            <FlatList
              data={wishlistItems}
              renderItem={({ item }) => (
                <WishlistCard item={item} onRemove={handleRemoveItem} />
              )}
              keyExtractor={(item) => item.wishlistItemId || item.productId || item.id}
              numColumns={2}
              columnWrapperStyle={{ 
                paddingHorizontal: 12,
                gap: 12,
              }}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[PRIMARY_COLOR]}
                  tintColor={PRIMARY_COLOR}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
});

WishlistScreen.displayName = 'WishlistScreen';

export default WishlistScreen;
