import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCategories } from '../../services/frontendService';
import { getFullImageUrl } from '../../lib/image-utils';

const PRIMARY_COLOR = '#e63946';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryPress = (category) => {
    router.push({
      pathname: '/(tabs)/products',
      params: { category: category.name, categoryId: category.id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text className="mt-3 text-gray-500">Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
      <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: PRIMARY_COLOR }}>
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-gray-200" style={{ backgroundColor: PRIMARY_COLOR }}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1 text-white">All Categories</Text>
        </View>

        <View className="flex-1 bg-gray-50">
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[PRIMARY_COLOR]}
                tintColor={PRIMARY_COLOR}
              />
            }
          >
            {categories.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="grid-outline" size={40} color="#9CA3AF" />
                </View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  No Categories Found
                </Text>
                <Text className="text-sm text-gray-500 text-center px-8">
                  Categories will appear here once they are added
                </Text>
              </View>
            ) : (
              <View className="p-3">
                {/* Category Grid */}
                <View className="flex-row flex-wrap">
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategoryPress(category)}
                      className="w-1/3 p-1.5"
                      activeOpacity={0.7}
                    >
                      <View className="bg-white rounded-lg overflow-hidden border border-gray-200">
                        {/* Category Image */}
                        <View className="w-full aspect-square bg-gray-50">
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
                            <View className="flex-1 items-center justify-center bg-gray-100">
                              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
                            </View>
                          )}
                        </View>

                        {/* Category Name */}
                        <View className="p-2">
                          <Text 
                            className="text-xs text-gray-800 font-medium text-center"
                            numberOfLines={2}
                          >
                            {category.name}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}
