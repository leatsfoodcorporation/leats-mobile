import { memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getFullImageUrl } from '../../lib/image-utils';

const PRIMARY_COLOR = '#e63946';

const CategoryContent = memo(({ 
  selectedCategory, 
  products,
  brands,
  loading,
  refreshing, 
  onRefresh,
  onLoadMore,
  hasMore,
  onSubcategoryPress,
  onBrandPress,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!selectedCategory) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Ionicons name="apps-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-500 mt-4">Select a category</Text>
      </View>
    );
  }

  // Handle product press - navigate to detail screen
  const handleProductPress = (product) => {
    router.push({
      pathname: '/(stack)/product-detail',
      params: { productId: product.id, variantIndex: 0 }
    });
  };

  // Render simple product item (name + image only)
  const renderProduct = ({ item }) => {
    const variant = item.variants?.[0];
    const imageUrl = variant?.variantImages?.[0] || item.thumbnail || '';
    const displayName = variant?.displayName || variant?.variantName || item.shortDescription;

    return (
      <TouchableOpacity
        onPress={() => handleProductPress(item)}
        className="w-1/3 p-2"
      >
        <View className="bg-gray-50 rounded-lg p-3 items-center">
          {imageUrl ? (
            <Image
              source={{ uri: getFullImageUrl(imageUrl) }}
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
              transition={150}
              
              priority="low"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center">
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
          <Text className="text-xs text-gray-900 text-center mt-2" numberOfLines={2}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render subcategory item
  const renderSubcategory = ({ item }) => (
    <TouchableOpacity
      onPress={() => onSubcategoryPress(item)}
      className="w-1/3 p-2"
    >
      <View className="bg-gray-50 rounded-lg p-3 items-center">
        {item.image ? (
          <Image
            source={{ uri: getFullImageUrl(item.image) }}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
            transition={150}
            
            priority="low"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          </View>
        )}
        <Text className="text-xs text-gray-900 text-center mt-2" numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render brand item
  const renderBrand = ({ item }) => (
    <TouchableOpacity
      onPress={() => onBrandPress(item)}
      className="w-1/3 p-2"
    >
      <View className="bg-gray-50 rounded-lg p-3 items-center justify-center" style={{ minHeight: 80 }}>
        <Text className="text-sm font-semibold text-gray-900 text-center" numberOfLines={2}>
          {item}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Empty state
  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-16">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="cube-outline" size={40} color="#9CA3AF" />
      </View>
      <Text className="text-lg font-semibold text-gray-800 mb-2">No Products Found</Text>
      <Text className="text-sm text-gray-500 text-center px-8">
        No products available in this category
      </Text>
    </View>
  );

  // Footer loading indicator
  const FooterLoader = () => {
    if (!hasMore || loading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text className="mt-3 text-gray-500">Loading...</Text>
      </View>
    );
  }

  // Show subcategories if available
  const hasSubcategories = selectedCategory.subcategories && selectedCategory.subcategories.length > 0;
  
  // Show brands if available
  const hasBrands = brands && brands.length > 0;

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListHeaderComponent={() => (
          <View>
            {/* Category Title */}
            <View className="px-4 py-3 bg-white border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">
                {selectedCategory.isCombo ? 'Combo Products' : selectedCategory.name}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Subcategories Section */}
            {hasSubcategories && (
              <View className="py-4 bg-white border-b border-gray-100">
                <Text className="text-base font-bold text-gray-900 px-4 mb-3">Subcategories</Text>
                <View className="flex-row flex-wrap px-2">
                  {selectedCategory.subcategories.map((subcategory) => (
                    <View key={subcategory.id} className="w-1/3 p-2">
                      <TouchableOpacity
                        onPress={() => onSubcategoryPress(subcategory)}
                        className="bg-gray-50 rounded-lg p-3 items-center"
                      >
                        {subcategory.image ? (
                          <Image
                            source={{ uri: getFullImageUrl(subcategory.image) }}
                            style={{ width: 60, height: 60 }}
                            resizeMode="contain"
                            transition={150}
                            
                            priority="low"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <View className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center">
                            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                          </View>
                        )}
                        <Text className="text-xs text-gray-900 text-center mt-2" numberOfLines={2}>
                          {subcategory.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Brands Section */}
            {hasBrands && (
              <View className="py-4 bg-white border-b border-gray-100">
                <Text className="text-base font-bold text-gray-900 px-4 mb-3">Brands</Text>
                <View className="flex-row flex-wrap px-2">
                  {brands.map((brand, index) => (
                    <View key={index} className="w-1/3 p-2">
                      <TouchableOpacity
                        onPress={() => onBrandPress(brand)}
                        className="bg-gray-50 rounded-lg p-3 items-center justify-center"
                        style={{ minHeight: 80 }}
                      >
                        <Text className="text-sm font-semibold text-gray-900 text-center" numberOfLines={2}>
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Products Section Header */}
            {(hasSubcategories || hasBrands) && products.length > 0 && (
              <View className="px-4 py-3 bg-white">
                <Text className="text-base font-bold text-gray-900">All Products</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={FooterLoader}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
      />
    </View>
  );
});

CategoryContent.displayName = 'CategoryContent';

export default CategoryContent;
