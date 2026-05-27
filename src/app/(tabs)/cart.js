import { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import LoginRequired from '../../components/LoginRequired';
import { useRouter } from 'expo-router';
import { useAuthCheck } from '../../hooks/useAuthProtection';
import { useCart } from '../../context/CartContext';
import { useTabRefresh } from '../../context/TabRefreshContext';
import { getFullImageUrl } from '../../lib/image-utils';
import { calculateMaxUnits, hasStockIssues, getOutOfStockItems, getOverStockItems } from '../../lib/cart-utils';
import { formatSmartUOMDisplay } from '../../lib/uom-utils';
import { getActiveDeliveryCharges } from '../../services/deliveryChargeService';
import { calculateDeliveryFee } from '../../lib/delivery-charge-utils';

const PRIMARY_COLOR = '#e63946';

// Cart Item Component
const CartItem = ({ item, allItems, onUpdateQuantity, onRemove, onPress }) => {
  // Backend returns processed cart items with all data at root level
  const price = item.variantSellingPrice || 0;
  const mrp = item.variantMRP || 0;
  // Backend returns relative proxy URL like "/image/..." - convert to full URL
  const imageUrl = getFullImageUrl(item.variantImage);
  const name = item.displayName || item.shortDescription || 'Product';
  const variantName = item.variantName;

  // Calculate max available units for this item
  const maxUnits = calculateMaxUnits(item, allItems);
  const isOutOfStock = maxUnits === 0;
  const isOverStock = item.quantity > maxUnits && maxUnits > 0;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className={`bg-white p-4 mb-2 flex-row ${isOutOfStock ? 'opacity-60 bg-gray-50' : ''}`}
    >
      {/* Product Image */}
      <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mr-3">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            priority="low"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={30} color="#D1D5DB" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="flex-1">
        <View className="flex-row flex-wrap items-baseline mb-1">
          <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>
            {name}
          </Text>
          {item.variantUom && item.variantUomValue && (
            <Text className="text-sm text-gray-500"> ({item.variantUomValue}{item.variantUom})</Text>
          )}
        </View>
        
        {variantName && (
          <Text className="text-xs text-gray-500 mb-1">{variantName}</Text>
        )}
        
        {item.selectedCuttingStyle && (
          <View className="flex-row items-center mb-1">
            <Text className="text-xs text-green-600">✂ {item.selectedCuttingStyle}</Text>
          </View>
        )}

        {/* Combo Product Components */}
        {item.isComboProduct && item.comboItems && item.comboItems.length > 0 && (
          <View className="mt-1 mb-1 pl-2 border-l-2 border-red-200">
            {item.comboItems.map((ci, idx) => (
              <Text key={idx} className="text-[10px] text-gray-500">
                • {ci.quantity}x {ci.productName || ci.variantName}
              </Text>
            ))}
          </View>
        )}

        {/* Out of Stock Warning - differentiate between combo insufficient stock and truly out of stock */}
        {isOutOfStock && (
          <View className="bg-red-50 px-2 py-1 rounded mb-1">
            <Text className="text-xs text-red-600 font-semibold">
              {item.isComboProduct 
                ? '⚠️ Insufficient stock for combo components' 
                : '❌ Out of Stock'}
            </Text>
          </View>
        )}

        {/* Over Stock Warning */}
        {isOverStock && (
          <View className="bg-red-50 px-2 py-1 rounded mb-1">
            <Text className="text-xs text-red-600 font-semibold">
              ⚠️ Only {item.variantUom && item.variantUomValue ? formatSmartUOMDisplay(maxUnits * item.variantUomValue, item.variantUom) : `${maxUnits} unit${maxUnits !== 1 ? 's' : ''}`} available - reduce quantity to proceed
            </Text>
          </View>
        )}

        {/* Price */}
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-base font-bold text-gray-900">₹{price}</Text>
          {mrp > price && (
            <Text className="text-xs text-gray-400 line-through">₹{mrp}</Text>
          )}
        </View>

        {/* Quantity Controls */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center border border-gray-200 rounded-lg overflow-hidden">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (item.quantity > 1) {
                  onUpdateQuantity(
                    item.productId,
                    item.inventoryProductId,
                    item.variantIndex,
                    item.quantity - 1,
                    item.selectedCuttingStyle
                  );
                } else {
                  onRemove(
                    item.productId,
                    item.inventoryProductId,
                    item.variantIndex,
                    item.selectedCuttingStyle
                  );
                }
              }}
              disabled={isOutOfStock}
              className={`px-3 py-1.5 ${isOutOfStock ? 'bg-gray-200 opacity-50' : 'bg-gray-50'}`}
            >
              <Ionicons name="remove" size={16} color={isOutOfStock ? "#9CA3AF" : "#374151"} />
            </TouchableOpacity>
            <Text className="px-4 text-sm font-medium">{item.quantity}</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (item.quantity < maxUnits && maxUnits > 0) {
                  onUpdateQuantity(
                    item.productId,
                    item.inventoryProductId,
                    item.variantIndex,
                    item.quantity + 1,
                    item.selectedCuttingStyle
                  );
                }
              }}
              disabled={item.quantity >= maxUnits || maxUnits === 0}
              className={`px-3 py-1.5 ${(item.quantity >= maxUnits || maxUnits === 0) ? 'bg-gray-200 opacity-50' : 'bg-gray-50'}`}
            >
              <Ionicons name="add" size={16} color={(item.quantity >= maxUnits || maxUnits === 0) ? "#9CA3AF" : "#374151"} />
            </TouchableOpacity>
          </View>

          {/* Max Stock Indicator */}
          {item.quantity >= maxUnits && maxUnits > 0 && (
            <Text className="text-xs text-orange-600 font-medium">Max stock</Text>
          )}

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRemove(
                item.productId,
                item.inventoryProductId,
                item.variantIndex,
                item.selectedCuttingStyle
              );
            }}
            className="p-2"
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color="#EF4444"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CartScreen = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
  const { 
    cartItems, 
    cartCount, 
    cartTotal,
    isLoading,
    fetchCart,
    updateQuantity,
    removeFromCart,
    cart,
  } = useCart();
  
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryChargeRules, setDeliveryChargeRules] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch delivery charge rules on mount
  useEffect(() => {
    const fetchDeliveryCharges = async () => {
      try {
        const rules = await getActiveDeliveryCharges();
        setDeliveryChargeRules(rules);
      } catch (error) {
        console.error('Error fetching delivery charges:', error);
      }
    };
    fetchDeliveryCharges();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  // Tab refresh
  useTabRefresh('cart', onRefresh);

  // Calculate totals
  const subtotal = cartTotal;
  const discount = cart?.discount || 0;
  
  // Calculate delivery fee using utility function
  const { finalDeliveryFee, freeDeliveryThreshold, appliedRule, usingProductShipping } = 
    calculateDeliveryFee(subtotal, deliveryChargeRules, cartItems);
  
  const total = subtotal - discount + finalDeliveryFee;

  // Check for stock issues
  const stockIssues = hasStockIssues(cartItems);
  const outOfStockItems = getOutOfStockItems(cartItems);
  const overStockItems = getOverStockItems(cartItems);

  // Handle product click
  const handleProductPress = (item) => {
    router.push({
      pathname: '/(stack)/product-detail',
      params: { productId: item.productId }
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header 
          navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
          hideCategories={true}
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
          hideCategories={true}
        />
        <LoginRequired 
          title="Sign In to View Cart"
          message="Please sign in to view your shopping cart and checkout"
          icon="cart-outline"
        />
      </View>
    );
  }

  // Empty cart state
  if (cartItems.length === 0 && !isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header 
          navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
          hideCategories={true}
        />
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Your Cart is Empty</Text>
          <Text className="text-gray-500 text-center mb-6">
            Looks like you haven't added anything to your cart yet
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/products')}
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
        scrollY={scrollY}
        hideCategories={true}
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
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Cart Header */}
        <View className="px-4 py-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-800">
            Shopping Cart ({cartCount} items)
          </Text>
        </View>

        {/* Stock Issues Warning Banner */}
        {stockIssues && (
          <View className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#DC2626" style={{ marginTop: 2, marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-red-800 mb-2">
                  Stock Issues Found
                </Text>
                <View className="space-y-1">
                  {outOfStockItems.length > 0 && (
                    <Text className="text-xs text-red-700">
                      • {outOfStockItems.length} item(s) {outOfStockItems.some(i => i.isComboProduct) ? 'have insufficient stock' : 'are out of stock'}
                    </Text>
                  )}
                  {overStockItems.length > 0 && (
                    <Text className="text-xs text-red-700">
                      • {overStockItems.length} item(s) exceed available stock
                    </Text>
                  )}
                  <Text className="text-xs text-red-700 font-medium mt-2">
                    Please adjust quantities or remove items to proceed with checkout.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Cart Items */}
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              allItems={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onPress={() => handleProductPress(item)}
            />
          ))
        )}

        {/* Price Summary */}
        <View className="bg-white p-4 mt-2">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Price Details</Text>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-600">Subtotal ({cartCount} items)</Text>
            <Text className="text-gray-800 font-medium">₹{subtotal.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View className="flex-row justify-between py-2">
              <Text className="text-green-600">Discount</Text>
              <Text className="text-green-600 font-medium">-₹{discount.toFixed(2)}</Text>
            </View>
          )}

          <View className="flex-row justify-between py-2">
            <Text className="text-gray-600">Delivery Charges</Text>
            <Text className={finalDeliveryFee === 0 ? 'text-green-600 font-medium' : 'text-gray-800 font-medium'}>
              {finalDeliveryFee === 0 ? 'FREE' : `₹${finalDeliveryFee.toFixed(2)}`}
            </Text>
          </View>

          <View className="border-t border-gray-200 mt-2 pt-3 flex-row justify-between">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-bold text-gray-800">₹{total.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <Text className="text-green-600 text-sm mt-2">
              You're saving ₹{discount.toFixed(2)} on this order
            </Text>
          )}
        </View>

        {/* Shipping Notice - Show when delivery fee applies */}
        {finalDeliveryFee > 0 && freeDeliveryThreshold > 0 && subtotal < freeDeliveryThreshold && !usingProductShipping && (
          <View className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mx-4 mt-2">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#D97706" style={{ marginTop: 2, marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-yellow-900 mb-1">
                  🎉 Almost there! Get FREE delivery
                </Text>
                <Text className="text-sm text-yellow-800">
                  Add <Text className="font-bold text-yellow-900">₹{(freeDeliveryThreshold - subtotal).toFixed(2)}</Text> more to your cart to qualify for free delivery!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Product Shipping Notice - Show when using product-level charges */}
        {usingProductShipping && finalDeliveryFee > 0 && freeDeliveryThreshold > 0 && (
          <View className="bg-blue-50 border border-blue-300 rounded-lg p-4 mx-4 mt-2">
            <View className="flex-row items-start">
              <Ionicons name="cube" size={20} color="#2563EB" style={{ marginTop: 2, marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-blue-900 mb-1">
                  📦 Product shipping charges applied
                </Text>
                <Text className="text-sm text-blue-800">
                  Add <Text className="font-bold text-blue-900">₹{(freeDeliveryThreshold - subtotal).toFixed(2)}</Text> more to unlock free delivery on your entire order!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Free Delivery Success Message */}
        {finalDeliveryFee === 0 && freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold && (
          <View className="bg-green-50 border border-green-300 rounded-lg p-4 mx-4 mt-2">
            <View className="flex-row items-start">
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginTop: 2, marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-green-900 mb-1">
                  ✅ Congratulations! You've unlocked FREE delivery
                </Text>
                <Text className="text-sm text-green-800">
                  Your order qualifies for free delivery (minimum ₹{freeDeliveryThreshold})
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-15" />
      </Animated.ScrollView>

      {/* Checkout Button */}
      <View className=" bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <SafeAreaView edges={['bottom']}>
          <View className="flex-row items-center">
            <View className="flex-1 mr-4">
              <Text className="text-sm text-gray-500">Total Amount</Text>
              <Text className="text-xl font-bold text-gray-900">₹{total.toFixed(2)}</Text>
            </View>
            {stockIssues ? (
              <View className="flex-1 py-3 rounded-lg items-center bg-gray-300">
                <Text className="text-gray-500 font-bold text-base">Cannot Proceed</Text>
                <Text className="text-gray-500 text-xs">Stock Issues</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/(stack)/checkout')}
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Text className="text-white font-bold text-base">Checkout</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
});

CartScreen.displayName = 'CartScreen';

export default CartScreen;
