import { useState, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getFullImageUrl } from '../../lib/image-utils';
import { useCurrency } from '../../hooks/useCurrency';
import { formatSmartUOMDisplay } from '../../lib/uom-utils';
import PlaceholderImage from "../../../assets/product-placeholder.png";

const PRIMARY_COLOR = '#e63946';

const ProductCard = memo(({ product, compact = false }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const currencySymbol = useCurrency();

  // Filter only active variants
  const activeVariants = useMemo(() => {
    return (product.variants || []).filter(v => v.variantStatus === 'active');
  }, [product.variants]);

  // Find default variant
  const defaultVariantIndex = activeVariants.findIndex(v => v.isDefault);
  const [selectedVariant, setSelectedVariant] = useState(defaultVariantIndex >= 0 ? defaultVariantIndex : 0);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedCuttingStyle, setSelectedCuttingStyle] = useState('');
  const [showCuttingStyles, setShowCuttingStyles] = useState(false);

  const currentVariant = activeVariants[selectedVariant];
  const inventoryProductId = currentVariant?.inventoryProductId || '';

  // Get actual variant index from full product.variants array
  const actualVariantIndex = product.variants.findIndex(
    v => v.inventoryProductId === currentVariant?.inventoryProductId &&
         v.variantUomValue === currentVariant?.variantUomValue
  );

  // Get cutting styles
  const cuttingStyles = product.cuttingStyles || [];
  const hasCuttingStyles = cuttingStyles.length > 0;

  // Get quantity
  const quantity = getItemQuantity(
    product.id, 
    inventoryProductId, 
    actualVariantIndex, 
    selectedCuttingStyle || undefined
  );

  // Get product image
  const productImage = useMemo(() => {
    let imageUrl = null;
    
    if (currentVariant?.variantImages?.[0] && currentVariant.variantImages[0].trim() !== '') {
      imageUrl = currentVariant.variantImages[0];
    } else if (product.type === 'combo' && product.thumbnail && product.thumbnail.trim() !== '') {
      imageUrl = product.thumbnail;
    }
    
    return imageUrl ? getFullImageUrl(imageUrl) : null;
  }, [currentVariant, product]);

  // Price calculations
  const price = currentVariant?.variantSellingPrice || product.defaultSellingPrice;
  const mrp = currentVariant?.variantMRP || product.defaultMRP;
  
  // Discount calculations
  const discountType = currentVariant?.discountType || product.discountType;
  const discountValue = currentVariant?.variantDiscount || product.defaultDiscountValue;
  const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  
  const isFlatDiscount = discountType?.toLowerCase() === 'flat';
  const discountText = isFlatDiscount && discountValue > 0
    ? `${currencySymbol}${discountValue} OFF`
    : discountPercentage > 0
    ? `${discountPercentage}% OFF`
    : '';

  // Stock info
  const availableStock = currentVariant?.variantStockQuantity || 0;
  const isOutOfStock = availableStock <= 0 || currentVariant?.variantStockStatus === 'out-of-stock';
  const isLowStock = availableStock > 0 && availableStock <= (currentVariant?.variantLowStockAlert || 5);

  const isWishlisted = isInWishlist(product.id);

  const handlePress = () => {
    router.push({
      pathname: '/(stack)/product-detail',
      params: { 
        productId: product.id,
        variantIndex: actualVariantIndex,
      }
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    if (hasCuttingStyles && !selectedCuttingStyle) {
      setShowCuttingStyles(true);
      return;
    }

    if (actualVariantIndex === -1) return;

    await addToCart(product, actualVariantIndex, selectedCuttingStyle || undefined);
  };

  const handleIncrement = () => {
    if (quantity >= availableStock) return;
    updateQuantity(product.id, inventoryProductId, actualVariantIndex, quantity + 1, selectedCuttingStyle || undefined);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, inventoryProductId, actualVariantIndex, quantity - 1, selectedCuttingStyle || undefined);
  };

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1"
      >
        {/* Wishlist Icon */}
        <TouchableOpacity
          onPress={handleWishlistToggle}
          className="absolute top-2 left-2 z-20 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md"
        >
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={18} 
            color={isWishlisted ? PRIMARY_COLOR : "#6B7280"} 
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {!!discountText && (
          <View className="absolute top-2 right-2 z-10 bg-green-600 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">{discountText}</Text>
          </View>
        )}

        {/* Product Image */}
        <View className={`${compact ? "h-32" : "h-48"} items-center justify-center pt-4`}   
              style={{ paddingHorizontal: 16, paddingTop: 16,}}>
          <Image
            source={productImage ? { uri: productImage } : PlaceholderImage}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="contain"
          />
        </View>

        {/* Product Info */}
        <View className="p-3 flex-1">
          {/* Brand */}
          {!!product.brand && (
            <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
              {product.brand}
            </Text>
          )}

          {/* Product Name */}
          <Text 
            className="text-sm font-medium text-gray-800 mb-2"
            numberOfLines={2}
            style={{ minHeight: 36 }}
          >
            {currentVariant?.displayName || product.shortDescription || currentVariant?.variantName}
          </Text>

          {/* Variant Selector - Only show if dropdownName exists */}
          {!!currentVariant?.dropdownName && (
            <TouchableOpacity
              onPress={() => activeVariants.length > 1 && setShowVariants(true)}
              disabled={activeVariants.length === 1}
              className={`flex-row items-center justify-between rounded px-3 py-2 mb-2 ${
                activeVariants.length === 1 ? 'bg-gray-100' : 'bg-white border border-gray-300'
              }`}
            >
              <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                {currentVariant.dropdownName}
              </Text>
              {Boolean(activeVariants.length > 1) && (
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              )}
            </TouchableOpacity>
          )}

          {/* Price */}
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-lg font-bold text-gray-900">
              {currencySymbol}{price.toFixed(0)}
            </Text>
            {Boolean(discountPercentage > 0) && (
              <Text className="text-sm text-gray-400 line-through">
                {currencySymbol}{mrp.toFixed(0)}
              </Text>
            )}
          </View>

          {/* Cutting Style Button */}
          {Boolean(hasCuttingStyles) && (
            <TouchableOpacity
              onPress={() => setShowCuttingStyles(true)}
              className="bg-green-100 px-2.5 py-1.5 rounded mb-2 self-start"
            >
              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-green-700 font-medium">
                  {selectedCuttingStyle || 'Cutting Style'}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#15803d" />
              </View>
            </TouchableOpacity>
          )}

          {/* Stock Status */}
          {Boolean(isLowStock && quantity === 0) && (
            <Text className="text-xs text-orange-600 font-medium mb-2">
              Only {currentVariant?.variantUom ? formatSmartUOMDisplay(availableStock, currentVariant.variantUom) : availableStock} left
            </Text>
          )}
          {Boolean(quantity >= availableStock && quantity > 0) && (
            <Text className="text-xs text-orange-600 font-medium mb-2">
              Max stock reached
            </Text>
          )}

          {/* Spacer to push button to bottom */}
          <View className="flex-1" />

          {/* Add to Cart Button */}
          {quantity === 0 ? (
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={isOutOfStock}
              className={`py-2.5 rounded items-center ${
                isOutOfStock ? 'bg-gray-300' : 'bg-[#e63946]'
              }`}
            >
              <Text className={`font-semibold text-sm ${isOutOfStock ? 'text-gray-500' : 'text-white'}`}>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center justify-between border-2 border-[#e63946] rounded overflow-hidden">
              <TouchableOpacity onPress={handleDecrement} className="px-3 py-2">
                <Ionicons name="remove" size={16} color={PRIMARY_COLOR} />
              </TouchableOpacity>
              <Text className="font-semibold text-[#e63946] text-sm">{quantity}</Text>
              <TouchableOpacity
                onPress={handleIncrement}
                disabled={quantity >= availableStock}
                className={`px-3 py-2 ${quantity >= availableStock ? 'opacity-50' : ''}`}
              >
                <Ionicons name="add" size={16} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Variant Selection Modal */}
      <Modal
        visible={showVariants}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVariants(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowVariants(false)}
        >
          <Pressable 
            className="bg-white rounded-t-2xl max-h-[70%]" 
            style={{ paddingBottom: insets.bottom || 8 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-bold">Select Variant</Text>
              <TouchableOpacity onPress={() => setShowVariants(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4">
              {activeVariants.map((variant, index) => {
                const variantDiscountType = variant.discountType || product.discountType;
                const variantDiscountValue = variant.variantDiscount || product.defaultDiscountValue;
                const variantDiscountPercentage = variant.variantMRP > variant.variantSellingPrice
                  ? Math.round(((variant.variantMRP - variant.variantSellingPrice) / variant.variantMRP) * 100)
                  : 0;
                
                const isVariantFlatDiscount = variantDiscountType?.toLowerCase() === 'flat';
                const variantDiscountText = isVariantFlatDiscount && variantDiscountValue > 0
                  ? `${currencySymbol}${variantDiscountValue} OFF`
                  : variantDiscountPercentage > 0
                  ? `${variantDiscountPercentage}% OFF`
                  : '';

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedVariant(index);
                      setShowVariants(false);
                    }}
                    className={`p-3 mb-2 rounded-lg flex-row items-center justify-between ${
                      selectedVariant === index ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-sm text-gray-700 font-medium mb-1">
                        {variant.dropdownName || variant.displayName || variant.variantName}
                      </Text>
                      <View className="flex-row items-center gap-2 flex-wrap">
                        {Boolean(variantDiscountText) && (
                          <Text className="text-xs text-green-600 font-medium">
                            {variantDiscountText}
                          </Text>
                        )}
                        <Text className="text-sm font-semibold text-gray-900">
                          {currencySymbol}{variant.variantSellingPrice}
                        </Text>
                        {Boolean(variantDiscountPercentage > 0) && (
                          <Text className="text-xs text-gray-400 line-through">
                            {currencySymbol}{variant.variantMRP}
                          </Text>
                        )}
                      </View>
                    </View>
                    {Boolean(selectedVariant === index) && (
                      <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cutting Style Modal */}
      <Modal
        visible={showCuttingStyles}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCuttingStyles(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowCuttingStyles(false)}
        >
          <Pressable 
            className="bg-white rounded-t-2xl" 
            style={{ paddingBottom: insets.bottom || 8 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-bold">Choose Cutting Style</Text>
              <TouchableOpacity onPress={() => setShowCuttingStyles(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4">
              {cuttingStyles.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  onPress={() => {
                    setSelectedCuttingStyle(style.name);
                    setShowCuttingStyles(false);
                  }}
                  className={`p-3 mb-2 rounded-lg flex-row items-center justify-between ${
                    selectedCuttingStyle === style.name ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <Text className="text-sm text-gray-700">{style.name}</Text>
                  {Boolean(selectedCuttingStyle === style.name) && (
                    <Ionicons name="checkmark-circle" size={20} color="#15803d" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
