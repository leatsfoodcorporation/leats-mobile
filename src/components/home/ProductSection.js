import { useState, useCallback, memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import ProductCard from '../products/ProductCard';
import { getHomepageProducts } from '../../services/frontendService';

const ProductSection = memo(({ 
  badgeName,
  badgeSubtitle,
  initialProducts = [],
  categories = [],
  showCategoryFilter = false,
  backgroundColor = 'bg-white',
  limit = 10,
}) => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();

  const CARD_MIN_WIDTH = 180; // Minimum width for a card
  const HORIZONTAL_PADDING = 30; // px-4 on both sides
  const GAP = 12;
  const columns = Math.max(2, Math.floor((width - HORIZONTAL_PADDING) / (CARD_MIN_WIDTH + GAP)));
  const cardWidth = (width - HORIZONTAL_PADDING - GAP * (columns - 1)) / columns;

  // Fetch products when category changes
  const fetchProducts = useCallback(async (category = '') => {
    setLoading(true);
    try {
      const response = await getHomepageProducts({
        badge: badgeName,
        category: category || undefined,
        limit,
      });
      
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [badgeName, limit]);

  // Handle category change
  const handleCategoryChange = (categoryName) => {
    setActiveCategory(categoryName);
    fetchProducts(categoryName);
  };

  // Don't render if no badge name
  if (!badgeName) return null;

  return (
    <View className={`py-4 ${backgroundColor}`}>
      {/* Section Header */}
      <View className="px-4 mb-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{badgeName}</Text>
          {badgeSubtitle && (
            <Text className="text-xs text-gray-500 mt-0.5">{badgeSubtitle}</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => {
            // Navigate to products page with badge filter
            // Pass the badge name so products page can filter by it
            router.push({
              pathname: '/(tabs)/products',
              params: { badge: badgeName }
            });
          }}
          className="py-1"
        >
          <Text className="text-[#e63946] text-sm font-medium">View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Tabs */}
      {showCategoryFilter && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
        >
          <TouchableOpacity
            onPress={() => handleCategoryChange('')}
            className={`px-4 py-1.5 rounded-full mr-2 ${
              activeCategory === ''
                ? 'bg-[#e63946]'
                : 'bg-gray-100'
            }`}
          >
            <Text className={`text-sm font-medium ${
              activeCategory === '' ? 'text-white' : 'text-gray-600'
            }`}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryChange(category.name)}
              className={`px-4 py-1.5 rounded-full mr-2 ${
                activeCategory === category.name
                  ? 'bg-[#e63946]'
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                activeCategory === category.name ? 'text-white' : 'text-gray-600'
              }`}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Products Grid */}
      {loading ? (
        <View className="h-64 items-center justify-center">
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      ) : products.length === 0 ? (
        <View className="py-8 px-4 items-center">
          <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
            <Text className="text-3xl">📦</Text>
          </View>
          <Text className="text-gray-800 font-semibold text-base mb-1">
            No Products Available
          </Text>
          <Text className="text-gray-500 text-sm text-center">
            {activeCategory 
              ? `No products found in "${activeCategory}"`
              : `No ${badgeName.toLowerCase()} products available`}
          </Text>
          {activeCategory && (
            <TouchableOpacity
              onPress={() => handleCategoryChange('')}
              className="mt-3 px-4 py-2 bg-[#e63946] rounded-lg"
            >
              <Text className="text-white text-sm font-medium">View All Categories</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="px-4 flex-row flex-wrap gap-3">
          {products.map((product) => (
            <View 
              key={product.id}
              style={{ width: '47%' }}
            >
              <ProductCard 
                product={product}
                compact={true}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

ProductSection.displayName = 'ProductSection';

export default ProductSection;