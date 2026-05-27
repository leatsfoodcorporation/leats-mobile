import { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFullImageUrl } from '../../lib/image-utils';

const PRIMARY_COLOR = '#e63946';

const CategorySidebar = memo(({ categories, selectedCategory, onSelectCategory }) => {
  const insets = useSafeAreaInsets();

  // Create sidebar items: Combo + all categories
  const sidebarItems = [
    {
      id: 'combo',
      name: 'Combo',
      icon: 'gift',
      isCombo: true,
      image: null,
    },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: getCategoryIcon(category.name),
      isCombo: false,
      image: category.image,
    })),
  ];

  return (
    <View className="w-24 bg-gray-50 border-r border-gray-200">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {sidebarItems.map((item) => {
          const isSelected = item.isCombo 
            ? selectedCategory?.isCombo 
            : selectedCategory?.id === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectCategory(item)}
              className={`items-center py-4 px-2 ${
                isSelected ? 'bg-white border-l-4' : ''
              }`}
              style={isSelected ? { borderLeftColor: PRIMARY_COLOR } : {}}
            >
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mb-2 overflow-hidden"
                style={{ 
                  backgroundColor: isSelected ? PRIMARY_COLOR + '15' : '#F3F4F6' 
                }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: getFullImageUrl(item.image) }}
                    style={{ width: 48, height: 48 }}
                    resizeMode="cover"
                    transition={150}
                    
                    priority="low"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color={isSelected ? PRIMARY_COLOR : '#9CA3AF'} 
                  />
                )}
              </View>
              <Text 
                className="text-[10px] text-center leading-3"
                style={{ 
                  color: isSelected ? PRIMARY_COLOR : '#6B7280',
                  fontWeight: isSelected ? '600' : '400'
                }}
                numberOfLines={2}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// Helper function to map category names to icons (fallback when no image)
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    // Grocery & Food
    'grocery': 'cart',
    'staples': 'nutrition',
    'rice': 'nutrition',
    'dals': 'leaf',
    'pulses': 'leaf',
    'ghee': 'water',
    'oils': 'water',
    'sugar': 'cube',
    'jaggery': 'cube',
    'salt': 'cube',
    'atta': 'nutrition',
    'flour': 'nutrition',
    'masala': 'flame',
    'spices': 'flame',
    'dry fruits': 'gift',
    'nuts': 'gift',
    'seeds': 'leaf',
    'snacks': 'fast-food',
    'chips': 'fast-food',
    'namkeen': 'fast-food',
    'biscuits': 'pizza',
    'beverages': 'cafe',
    'juices': 'wine',
    'soft drinks': 'wine',
    'coffee': 'cafe',
    'tea': 'cafe',
    'health drink': 'fitness',
    
    // Fashion & Apparel
    'fashion': 'shirt',
    'clothing': 'shirt',
    'men': 'man',
    'women': 'woman',
    'kids': 'happy',
    'footwear': 'footsteps',
    'accessories': 'watch',
    
    // Electronics & Gadgets
    'electronics': 'laptop',
    'mobiles': 'phone-portrait',
    'phones': 'phone-portrait',
    'tablets': 'tablet-portrait',
    'laptops': 'laptop',
    'computers': 'desktop',
    'cameras': 'camera',
    'audio': 'headset',
    'headphones': 'headset',
    'speakers': 'volume-high',
    'smart gadgets': 'watch',
    'wearables': 'watch',
    
    // Home & Appliances
    'home': 'home',
    'appliances': 'tv',
    'kitchen': 'restaurant',
    'furniture': 'bed',
    'decor': 'color-palette',
    'lighting': 'bulb',
    'storage': 'filing',
    
    // Beauty & Personal Care
    'beauty': 'flower',
    'personal care': 'flower',
    'skincare': 'sparkles',
    'haircare': 'cut',
    'makeup': 'color-palette',
    'fragrance': 'rose',
    'hygiene': 'medical',
    
    // Sports & Fitness
    'sports': 'football',
    'fitness': 'fitness',
    'gym': 'barbell',
    'outdoor': 'bicycle',
    
    // Books & Media
    'books': 'book',
    'stationery': 'pencil',
    'toys': 'game-controller',
    'games': 'game-controller',
    
    // Pets
    'pets': 'paw',
    'pet food': 'paw',
    'pet care': 'paw',
    
    // Baby & Kids
    'baby': 'baby',
    'baby care': 'baby',
    'kids': 'happy',
    
    // Automotive
    'automotive': 'car',
    'car': 'car',
    'bike': 'bicycle',
  };

  // Try to find matching icon based on category name
  const lowerName = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }

  // Default icon
  return 'grid';
};

CategorySidebar.displayName = 'CategorySidebar';

export default CategorySidebar;
