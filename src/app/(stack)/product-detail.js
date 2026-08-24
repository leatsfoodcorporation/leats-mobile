import { memo } from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getProductById } from '../../services/frontendService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from '../../utils/toast';
import { getFullImageUrl, getFullImageUrls } from '../../lib/image-utils';
import SimilarProducts from '../../components/product/SimilarProducts';
import FrequentlyBoughtTogether from '../../components/product/FrequentlyBoughtTogether';
import { getFrequentlyBoughtTogether } from '../../services/frontendService';
import { PRIMARY_COLOR } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cache for product details
const productCache = new Map();
const frequentlyBoughtCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

const ProductDetailScreen = memo(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addToCart, updateQuantity, getItemQuantity, cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { productId, variantIndex: initialVariantIndex } = params;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedCuttingStyle, setSelectedCuttingStyle] = useState('');
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const imageScrollRef = useRef(null);

  // Set initial selected active variant index once product is loaded
  useEffect(() => {
    if (product && activeVariants.length > 0) {
      const initIdx = parseInt(initialVariantIndex);
      if (!isNaN(initIdx) && product.variants[initIdx]) {
        const targetVariant = product.variants[initIdx];
        const activeIdx = activeVariants.findIndex(
          v => v.inventoryProductId === targetVariant.inventoryProductId &&
               v.variantUomValue === targetVariant.variantUomValue
        );
        if (activeIdx >= 0) {
          setSelectedVariantIndex(activeIdx);
        } else {
          setSelectedVariantIndex(0);
        }
      } else {
        // Find default variant or default to 0
        const defaultIdx = activeVariants.findIndex(v => v.isDefault);
        setSelectedVariantIndex(defaultIdx >= 0 ? defaultIdx : 0);
      }
    }
  }, [product, initialVariantIndex, activeVariants]);

  // Fetch product details with caching
  const fetchProduct = useCallback(async (forceRefresh = false) => {
    if (!productId) {
      toast.error('Error', 'Product not found');
      router.back();
      return;
    }

    const now = Date.now();
    const cached = productCache.get(productId);
    const isCacheValid = cached && (now - cached.timestamp < CACHE_DURATION);

    if (!forceRefresh && isCacheValid) {
      setProduct(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getProductById(productId);
      
      if (response.success && response.data) {
        productCache.set(productId, {
          data: response.data,
          timestamp: now,
        });
        setProduct(response.data);
      } else {
        toast.error('Error', 'Product not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Error', 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  const fetchFrequentlyBought = useCallback(async (forceRefresh = false) => {
    if (!productId) return;

    const now = Date.now();
    const cached = frequentlyBoughtCache.get(productId);
    const isCacheValid = cached && (now - cached.timestamp < CACHE_DURATION);

    if (!forceRefresh && isCacheValid) {
      setFrequentlyBought(cached.data);
      return;
    }

    try {
      const response = await getFrequentlyBoughtTogether(productId);
      if (response.success && response.data) {
        frequentlyBoughtCache.set(productId, {
          data: response.data,
          timestamp: now,
        });
        setFrequentlyBought(response.data);
      }
    } catch (error) {
      console.error('Error fetching frequently bought together:', error);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
      fetchFrequentlyBought();
    }, [fetchProduct, fetchFrequentlyBought])
  );

  // Get active variants
  const activeVariants = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.filter(v => v.variantStatus === 'active');
  }, [product]);

  // Current variant
  const currentVariant = activeVariants[selectedVariantIndex] || activeVariants[0];

  // Get actual variant index in the full product.variants array
  const actualVariantIndex = useMemo(() => {
    if (!product || !currentVariant) return 0;
    const idx = product.variants.findIndex(
      v => v.inventoryProductId === currentVariant.inventoryProductId &&
           v.variantUomValue === currentVariant.variantUomValue
    );
    return idx >= 0 ? idx : 0;
  }, [product, currentVariant]);

  // Get images for current variant
  const images = useMemo(() => {
    let imageUrls = [];
    
    if (currentVariant?.variantImages?.length > 0) {
      imageUrls = currentVariant.variantImages.filter(img => img && img.trim() !== '');
    } else if (product?.thumbnail) {
      imageUrls = [product.thumbnail];
    }
    
    // Convert all image URLs to full URLs
    return getFullImageUrls(imageUrls);
  }, [currentVariant, product]);

  // Price calculations
  const price = currentVariant?.variantSellingPrice || product?.defaultSellingPrice || 0;
  const mrp = currentVariant?.variantMRP || product?.defaultMRP || 0;
  
  // Discount calculations - same logic as ProductCard
  const discountType = currentVariant?.discountType || product?.discountType;
  const discountValue = currentVariant?.variantDiscount || product?.defaultDiscountValue;
  const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  
  const isFlatDiscount = discountType?.toLowerCase() === 'flat';
  const discountText = isFlatDiscount && discountValue > 0
    ? `₹${discountValue} OFF`
    : discountPercentage > 0
    ? `${discountPercentage}% OFF`
    : '';

  const productTitle =
    currentVariant?.displayName ||
    currentVariant?.variantName ||
    product?.shortDescription ||
    'Product';

  // Stock info
  const availableStock = currentVariant?.variantStockQuantity || 0;
  const isOutOfStock = availableStock <= 0 || currentVariant?.variantStockStatus === 'out-of-stock';
  const isLowStock = availableStock > 0 && availableStock <= (currentVariant?.variantLowStockAlert || 5);

  // Get current quantity in cart
  const inventoryProductId = product?.type === 'combo' 
    ? product.id 
    : (currentVariant?.inventoryProductId || '');
  const cartQuantity = product 
    ? getItemQuantity(product.id, inventoryProductId, actualVariantIndex, selectedCuttingStyle)
    : 0;

  // Cutting styles
  const cuttingStyles = product?.cuttingStyles || [];
  const hasCuttingStyles = cuttingStyles.length > 0;

  // Handle image scroll
  const handleImageScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (index !== selectedImageIndex && index >= 0 && index < images.length) {
      setSelectedImageIndex(index);
    }
  };

  // Handle quantity change
  const incrementQuantity = () => {
    if (!product) return;

    if (cartQuantity >= availableStock) {
      toast.warning('Max Stock', `Only ${availableStock} items available`);
      return;
    }

    if (hasCuttingStyles && !selectedCuttingStyle) {
      toast.warning('Select Cutting Style', 'Please select a cutting style');
      return;
    }

    // If item is not in cart yet, add it first
    if (cartQuantity === 0) {
      addToCart(product, actualVariantIndex, selectedCuttingStyle || undefined);
    } else {
      updateQuantity(product.id, inventoryProductId, actualVariantIndex, cartQuantity + 1, selectedCuttingStyle || undefined);
    }
  };

  const decrementQuantity = () => {
    if (!product || cartQuantity === 0) return;

    updateQuantity(product.id, inventoryProductId, actualVariantIndex, cartQuantity - 1, selectedCuttingStyle || undefined);
    
    if (cartQuantity === 1) {
      toast.info('Item removed from cart');
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error('Out of Stock', 'This item is currently unavailable');
      return;
    }

    if (hasCuttingStyles && !selectedCuttingStyle) {
      toast.warning('Select Cutting Style', 'Please select a cutting style');
      return;
    }

    // Add to cart using context
    await addToCart(product, actualVariantIndex, selectedCuttingStyle || undefined);
  };

  // Handle add to cart for frequently bought together
  const handleAddMultipleToCart = async (items) => {
    try {
      console.log('📦 Adding multiple items to cart:', items);
      console.log('📦 Current product:', product);
      console.log('📦 Current variant:', currentVariant);
      
      // Get main product inventory ID
      // For combo products, use product.id; for regular products, use currentVariant.inventoryProductId
      const mainProductInventoryId = product?.type === 'combo' 
        ? product.id 
        : currentVariant?.inventoryProductId;
      
      console.log('📦 Main product inventory ID:', mainProductInventoryId);
      console.log('📦 Product type:', product?.type);
      
      // Add main product first (only if it's in the items list)
      const mainItem = items.find(item => item.inventoryProductId === mainProductInventoryId);
      if (mainItem && product) {
        console.log('📦 Adding main product to cart');
        await addToCart(product, actualVariantIndex, selectedCuttingStyle || undefined);
      } else {
        console.log('📦 Main product not in items list or product is null');
      }

      // Add addon products (exclude main product)
      const addonItems = items.filter(item => item.inventoryProductId !== mainProductInventoryId);
      console.log('📦 Addon items to add:', addonItems);
      
      for (const addonItem of addonItems) {
        console.log('📦 Processing addon item:', addonItem);
        
        // Find the addon product details from frequentlyBought
        const addon = frequentlyBought.find(
          fbt => fbt.variant.inventoryProductId === addonItem.inventoryProductId
        );
        
        console.log('📦 Found addon:', addon ? 'Yes' : 'No');
        
        if (addon && addon.product && addon.variant) {
          // Create a minimal product object with the variant data we have
          const addonProductData = {
            id: addon.product.id,
            shortDescription: addon.product.shortDescription,
            brand: addon.product.brand,
            category: addon.product.category,
            subCategory: addon.product.subCategory || null,
            // Create a variants array with just this one variant
            variants: [addon.variant],
            // Add required fields with defaults
            type: 'regular',
            enableVariants: false,
            defaultSellingPrice: addon.variant.variantSellingPrice,
            defaultMRP: addon.variant.variantMRP,
            thumbnail: addon.variant.variantImages?.[0] || '',
            cuttingStyles: [],
            freeShipping: false,
            shippingCharge: 0,
          };
          
          console.log('📦 Adding addon product to cart');
          
          // Use index 0 since we only have one variant in the array
          await addToCart(addonProductData, 0, '');
        }
      }
      
      console.log('📦 All items added successfully');
    } catch (error) {
      console.error('❌ Error adding items to cart:', error);
      throw error;
    }
  };
  // Generate product URL for sharing (matches frontend slugify.ts pattern)
  const generateShareUrl = useCallback(() => {
    if (!product) return 'https://leats.in';
    const brand = product.brand || '';
    const description = currentVariant?.displayName || currentVariant?.variantName || '';
    const slugText = `${brand} ${description}`.trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
    const variantParam = currentVariant?.inventoryProductId
      ? `?variant=${currentVariant.inventoryProductId}`
      : '';
    return `https://leats.in/products/${slugText}/${product.id}${variantParam}`;
  }, [product, currentVariant]);

  const handleShare = async () => {
    try {
      const productName = productTitle;
      const price = currentVariant?.variantSellingPrice || product?.defaultSellingPrice || 0;
      const productUrl = generateShareUrl();

      // Share product link — WhatsApp auto-fetches OG preview (image + title)
      // Same approach as Amazon: link share with auto-preview
      const message = `${productName} - Rs.${price}\n${productUrl}`;

      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(message);
        toast.success('Product link copied!');
        return;
      }

      await Share.share({ message, title: productName });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing:', error);
        toast.error('Failed to share');
      }
    }
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error('Out of Stock', 'This item is currently unavailable');
      return;
    }

    if (hasCuttingStyles && !selectedCuttingStyle) {
      toast.warning('Select Cutting Style', 'Please select a cutting style');
      return;
    }

    // Create buy now item data
    const buyNowItem = {
      productId: product.id,
      inventoryProductId: product.type === 'combo' ? product.id : currentVariant?.inventoryProductId,
      variantIndex: actualVariantIndex,
      cuttingStyle: selectedCuttingStyle || undefined,
      quantity: 1,
    };

    // Navigate to checkout with buy now item
    router.push({
      pathname: '/(stack)/checkout',
      params: { buyNow: JSON.stringify(buyNowItem) }
    });
  };

  if (loading) {
    return (
      <>
        <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
        <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: PRIMARY_COLOR }}>
          <View className="flex-1 bg-white">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text className="mt-3 text-gray-500">Loading product...</Text>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
        <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: PRIMARY_COLOR }}>
          <View className="flex-1 bg-white">
            <View className="flex-1 items-center justify-center p-4">
              <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-800 mt-4">Product Not Found</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-4 px-6 py-2 bg-[#e63946] rounded-lg"
              >
                <Text className="text-white font-medium">Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
    <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: PRIMARY_COLOR }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: PRIMARY_COLOR }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1 text-center text-white" numberOfLines={1}>
          Product Details
        </Text>
        
        {/* Cart and Wishlist Icons */}
        <View className="flex-row items-center gap-1">
          {/* Share Icon */}
          <TouchableOpacity
            onPress={handleShare}
            className="p-2"
          >
            <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Wishlist Icon */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/wishlist')}
            className="p-2 relative"
          >
            <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
            {Boolean(wishlistCount > 0) && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                <Text className="text-white text-xs font-bold">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cart')}
            className="p-2 relative -mr-2"
          >
            <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
            {Boolean(cartCount > 0) && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                <Text className="text-white text-xs font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="bg-white" showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View className="bg-gray-50">
          {images.length > 0 ? (
            <>
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
              >
                {images.map((image, index) => (
                  <View key={index} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
                    <Image
                      source={{ uri: image }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                      priority={index === 0 ? 'high' : 'normal'}
                      cachePolicy="memory-disk"
                      recyclingKey={`product-detail-${productId}-${index}`}
                    />
                  </View>
                ))}
              </ScrollView>
              
              {/* Image Dots */}
              {images.length > 1 && (
                <View className="flex-row justify-center py-3 gap-1.5">
                  {images.map((_, index) => (
                    <View
                      key={index}
                      className={`rounded-full ${
                        index === selectedImageIndex
                          ? 'bg-[#e63946] w-6 h-2'
                          : 'bg-gray-300 w-2 h-2'
                      }`}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="h-[300px] items-center justify-center">
              <Ionicons name="image-outline" size={64} color="#D1D5DB" />
            </View>
          )}

          {/* Discount Badge */}
          {!!discountText && (
            <View className="absolute top-4 left-4 bg-[#e63946] px-3 py-1 rounded">
              <Text className="text-white text-sm font-bold">{discountText}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-4">
          {/* Brand */}
          {Boolean(product.brand && String(product.brand).trim()) && (
            <Text className="text-sm text-gray-500 mb-1">{String(product.brand)}</Text>
          )}

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {String(productTitle)}
          </Text>

          {/* Price */}
          <View className="flex-row items-center gap-3 mb-4">
            <Text className="text-2xl font-bold text-gray-900">{`₹${price.toFixed(0)}`}</Text>
            {discountPercentage > 0 && (
              <>
                <Text className="text-lg text-gray-400 line-through">{`₹${mrp.toFixed(0)}`}</Text>
                <Text className="text-sm text-green-600 font-semibold">
                  {`Save ₹${(mrp - price).toFixed(0)}`}
                </Text>
              </>
            )}
          </View>

          {/* Stock Status */}
          {isOutOfStock ? (
            <View className="bg-red-50 px-3 py-2 rounded-lg mb-4">
              <Text className="text-red-600 font-medium">Out of Stock</Text>
            </View>
          ) : isLowStock ? (
            <View className="bg-orange-50 px-3 py-2 rounded-lg mb-4">
              <Text className="text-orange-600 font-medium">{`Only ${availableStock} left in stock`}</Text>
            </View>
          ) : null}

          {/* Variant Selector */}
          {activeVariants.length > 1 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Select Variant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activeVariants.map((variant, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedVariantIndex(index);
                      setSelectedImageIndex(0);
                    }}
                    className={`px-4 py-2 rounded-lg mr-2 border ${
                      selectedVariantIndex === index
                        ? 'border-[#e63946] bg-[#e63946]/10'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      selectedVariantIndex === index ? 'text-[#e63946]' : 'text-gray-700'
                    }`}>
                      {String(variant.dropdownName || variant.displayName || variant.variantName || '')}
                    </Text>
                    <Text className={`text-xs ${
                      selectedVariantIndex === index ? 'text-[#e63946]' : 'text-gray-500'
                    }`}>
                      {`₹${Number(variant.variantSellingPrice || 0)}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Cutting Style Selector */}
          {hasCuttingStyles && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Select Cutting Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cuttingStyles.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    onPress={() => setSelectedCuttingStyle(style.name)}
                    className={`px-4 py-2 rounded-lg mr-2 border ${
                      selectedCuttingStyle === style.name
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      selectedCuttingStyle === style.name ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {String(style.name || '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quantity Selector */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Quantity</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={decrementQuantity}
                disabled={cartQuantity === 0}
                className={`w-10 h-10 border border-gray-200 rounded-lg items-center justify-center ${
                  cartQuantity === 0 ? 'opacity-50' : ''
                }`}
              >
                <Ionicons name="remove" size={20} color="#374151" />
              </TouchableOpacity>
              <Text className="mx-6 text-lg font-semibold text-gray-900">{String(cartQuantity)}</Text>
              <TouchableOpacity
                onPress={incrementQuantity}
                disabled={cartQuantity >= availableStock}
                className={`w-10 h-10 border border-gray-200 rounded-lg items-center justify-center ${
                  cartQuantity >= availableStock ? 'opacity-50' : ''
                }`}
              >
                <Ionicons name="add" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>


           {/* Frequently Bought Together */}
        {Boolean(frequentlyBought.length > 0 && currentVariant) && (
          <View className="bg-white px-4 py-4 mb-2">
            <FrequentlyBoughtTogether
              mainProduct={{
                id: product.id,
                name: productTitle,
                price: currentVariant.variantSellingPrice,
                mrp: currentVariant.variantMRP,
                image: images[0],
                inventoryProductId: currentVariant.inventoryProductId,
                variantIndex: actualVariantIndex,
              }}
              addons={frequentlyBought}
              onAddToCart={handleAddMultipleToCart}
            />
          </View>
        )}

          {/* Product Information Sections */}
          
          {/* Product Description */}
          {Boolean((currentVariant?.detailedDescription || product.longDescription || product.shortDescription) && 
            String(currentVariant?.detailedDescription || product.longDescription || product.shortDescription).trim()) && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-800 mb-3">Product Description</Text>
              <View className="bg-gray-50 rounded-lg p-4">
                <Text className="text-sm text-gray-600 leading-5">
                  {String(currentVariant?.detailedDescription || product.longDescription || product.shortDescription)}
                </Text>
              </View>
            </View>
          )}

          {/* Product Specifications */}
          {Boolean(product.brand || product.category || product.subCategory || currentVariant?.variantColour || 
            currentVariant?.variantSize || currentVariant?.variantMaterial || (currentVariant?.variantWeight ?? 0) > 0 ||
            currentVariant?.variantLength || currentVariant?.variantWidth || currentVariant?.variantHeight ||
            currentVariant?.variantSKU || currentVariant?.variantHSN || product.hsnCode || product.countryOfOrigin) && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-800 mb-3">Product Specifications</Text>
              <View className="bg-gray-50 rounded-lg p-4">
                {Boolean(product.brand && product.brand.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Brand</Text>
                    <Text className="text-sm text-gray-800 font-medium">{String(product.brand)}</Text>
                  </View>
                )}
                {Boolean(product.category && product.category.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Category</Text>
                    <Text className="text-sm text-gray-800">{String(product.category)}</Text>
                  </View>
                )}

                {Boolean(product.subCategory && product.subCategory.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Sub Category</Text>
                    <Text className="text-sm text-gray-800">{String(product.subCategory)}</Text>
                  </View>
                )}
                {Boolean(currentVariant?.variantColour && currentVariant.variantColour.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Colour</Text>
                    <Text className="text-sm text-gray-800">{String(currentVariant.variantColour)}</Text>
                  </View>
                )}
                {Boolean(currentVariant?.variantSize && currentVariant.variantSize.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Size</Text>
                    <Text className="text-sm text-gray-800">{String(currentVariant.variantSize)}</Text>
                  </View>
                )}
                {Boolean(currentVariant?.variantMaterial && currentVariant.variantMaterial.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Material</Text>
                    <Text className="text-sm text-gray-800">{String(currentVariant.variantMaterial)}</Text>
                  </View>
                )}
                {(currentVariant?.variantWeight ?? 0) > 0 && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Weight</Text>
                    <Text className="text-sm text-gray-800">{`${Number(currentVariant.variantWeight)} g`}</Text>
                  </View>
                )}
                {Boolean(currentVariant?.variantLength || currentVariant?.variantWidth || currentVariant?.variantHeight) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Dimensions (L×W×H)</Text>
                    <Text className="text-sm text-gray-800">
                      {`${currentVariant.variantLength || '-'} × ${currentVariant.variantWidth || '-'} × ${currentVariant.variantHeight || '-'} cm`}
                    </Text>
                  </View>
                )}
                {Boolean(currentVariant?.variantSKU && currentVariant.variantSKU.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">SKU</Text>
                    <Text className="text-xs text-gray-800 font-mono">{String(currentVariant.variantSKU)}</Text>
                  </View>
                )}
                {Boolean((currentVariant?.variantHSN && currentVariant.variantHSN.trim()) || (product.hsnCode && product.hsnCode.trim())) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">HSN Code</Text>
                    <Text className="text-sm text-gray-800">{String(currentVariant?.variantHSN || product.hsnCode)}</Text>
                  </View>
                )}
                {Boolean(product.countryOfOrigin && product.countryOfOrigin.trim()) && (
                  <View className="flex-row justify-between py-2.5">
                    <Text className="text-sm text-gray-500">Country of Origin</Text>
                    <Text className="text-sm text-gray-800">{String(product.countryOfOrigin)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Manufacturing & Expiry Info */}
          {Boolean(product.mfgDate || product.expiryDate || (product.batchNo && product.batchNo.trim())) && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-800 mb-3">Manufacturing Information</Text>
              <View className="bg-gray-50 rounded-lg p-4">
                {Boolean(product.batchNo && product.batchNo.trim()) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Batch No.</Text>
                    <Text className="text-sm text-gray-800">{String(product.batchNo)}</Text>
                  </View>
                )}
                {Boolean(product.mfgDate) && (
                  <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                    <Text className="text-sm text-gray-500">Mfg. Date</Text>
                    <Text className="text-sm text-gray-800">
                      {new Date(product.mfgDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                )}
                {Boolean(product.expiryDate) && (
                  <View className="flex-row justify-between py-2.5">
                    <Text className="text-sm text-gray-500">Expiry Date</Text>
                    <Text className="text-sm text-gray-800">
                      {new Date(product.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Safety Information */}
          {Boolean(product.safetyInformation && product.safetyInformation.trim()) && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-800 mb-3">Safety Information</Text>
              <View className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <Text className="text-sm text-gray-700 leading-5">{String(product.safetyInformation)}</Text>
              </View>
            </View>
          )}

          {/* Policy Section */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">Policy & Returns</Text>
            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                <Text className="text-sm text-gray-500">Cash on Delivery</Text>
                <Text className={`text-sm ${product.isCODAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {product.isCODAvailable ? 'Available' : 'Not Available'}
                </Text>
              </View>
              <View className="flex-row justify-between py-2.5">
                <Text className="text-sm text-gray-500">Return Policy</Text>
                <Text className={`text-sm ${product.returnPolicyApplicable ? 'text-green-600' : 'text-gray-500'}`}>
                  {product.returnPolicyApplicable ? `${Number(product.returnWindowDays || 0)} days easy return` : 'Not applicable'}
                </Text>
              </View>
              {Boolean(product.warrantyDetails && product.warrantyDetails.trim()) && (
                <View className="flex-row justify-between py-2.5 border-t border-gray-200">
                  <Text className="text-sm text-gray-500">Warranty</Text>
                  <Text className="text-sm text-gray-800">{String(product.warrantyDetails)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Similar Products */}
        {Boolean(product?.category) && (
          <View className="bg-white mt-2">
            <SimilarProducts 
              category={product.category} 
              currentProductId={product.id} 
            />
          </View>
        )}

        {/* Bottom Spacing - Account for fixed bottom bar + safe area */}
        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 py-3 rounded-lg border-2 items-center ${
              isOutOfStock
                ? 'border-gray-200 bg-gray-50'
                : ''
            }`}
            style={!isOutOfStock ? { borderColor: PRIMARY_COLOR } : undefined}
          >
            <Text
              className="font-semibold"
              style={{ color: isOutOfStock ? '#9CA3AF' : PRIMARY_COLOR }}
            >
              Add to Cart
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: isOutOfStock ? '#E5E7EB' : PRIMARY_COLOR,
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: isOutOfStock ? '#9CA3AF' : '#FFFFFF' }}
            >
              Buy Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
    </>
  );
});

export default ProductDetailScreen;

