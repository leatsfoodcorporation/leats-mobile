import { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFullImageUrl } from '../../lib/image-utils';

const CategoryScroll = memo(({ categories = [], loading = false }) => {
  const router = useRouter();

  const handleCategoryPress = (category) => {
    router.push({
      pathname: '/(tabs)/products',
      params: { category: category.name, categoryId: category.id }
    });
  };

  const handleViewAll = () => {
    router.push('/(tabs)/categories');
  };

  if (loading) {
    return (
      <View className="py-4">
        <View className="px-4 mb-3">
          <View className="bg-gray-200 h-5 w-24 rounded" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          <View className="flex-col">
            <View className="flex-row mb-3">
              {[...Array(4)].map((_, index) => (
                <View key={`top-${index}`} className="items-center mr-4">
                  <View className="w-16 h-16 rounded-lg bg-gray-200" />
                  <View className="mt-2 w-14 h-3 bg-gray-200 rounded" />
                </View>
              ))}
            </View>
            <View className="flex-row">
              {[...Array(4)].map((_, index) => (
                <View key={`bottom-${index}`} className="items-center mr-4">
                  <View className="w-16 h-16 rounded-lg bg-gray-200" />
                  <View className="mt-2 w-14 h-3 bg-gray-200 rounded" />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  // Split categories into two rows - show all categories
  //const topRow = categories.slice(0, 3); // First 3 categories in top row
  //const bottomRow = categories.slice(3, 6); // Next 3 categories in bottom row

  const ITEM_WIDTH = 96; // 80 + 16 (mr-4)
  const HORIZONTAL_PADDING = 24; // 12 + 12

  const screenWidth = Dimensions.get("window").width;
  const itemsPerRow = Math.max(
    2,
    Math.floor((screenWidth - HORIZONTAL_PADDING) / ITEM_WIDTH)
  );
  const categorySlots = itemsPerRow;

  const topRow = categories.slice(0, categorySlots);
  const bottomRow = categories.slice(
    categorySlots,
    categorySlots * 2
  );

  const CategoryItem = ({ category }) => (
    <TouchableOpacity
      onPress={() => handleCategoryPress(category)}
      className="items-center mr-4"
      activeOpacity={0.7}
    >
      <View className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
        {(category.image || category.imageUrl) ? (
          <Image
            source={{ uri: getFullImageUrl(category.image || category.imageUrl) }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            
            priority="low"
            cachePolicy="memory-disk"
            recyclingKey={`category-${category.id}`}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-[#e63946]/10">
            <Text className="text-3xl">📦</Text>
          </View>
        )}
      </View>
      <Text 
        className="mt-2 text-xs text-gray-700 font-medium text-center"
        numberOfLines={2}
        style={{ maxWidth: 80 }}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const MoreButton = () => (
    <TouchableOpacity
      onPress={handleViewAll}
      className="items-center mr-4"
      activeOpacity={0.7}
    >
      <View className="w-20 h-20 rounded-lg bg-[#e63946]/10 items-center justify-center border border-[#e63946]/30">
        <Ionicons name="ellipsis-horizontal" size={32} color="#e63946" />
      </View>
      <Text className="mt-2 text-xs text-[#e63946] font-bold text-center">
        More
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="py-4 bg-white">
      {/* Section Header */}
      <View className="px-4 mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-800">Shop by Category</Text>
        <TouchableOpacity 
          onPress={handleViewAll}
          className="py-1"
        >
          <Text className="text-[#e63946] text-sm font-medium">View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Categories 2-Row Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        <View className="flex-col">
          {/* Top Row */}
          <View className="flex-row mb-3">
            {topRow.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
             <MoreButton />
          </View>

          {/* Bottom Row */}
          {/* <View className="flex-row">
            {bottomRow.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
            <MoreButton />
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
});

CategoryScroll.displayName = 'CategoryScroll';

export default CategoryScroll;
