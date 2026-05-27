import { memo } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { searchProducts, getProducts, getCategories } from '../../services/frontendService';
import { getFullImageUrl } from '../../lib/image-utils';
import toast from '../../utils/toast';

const PRIMARY_COLOR = '#e63946';

// Cache for search results
const searchCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

const SearchScreen = memo(() => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load initial data (popular products and categories) with caching
  const loadInitialData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = 'search_initial_data';
    const cached = searchCache.get(cacheKey);
    const isCacheValid = cached && (now - cached.timestamp < CACHE_DURATION);

    if (!forceRefresh && isCacheValid) {
      setPopularProducts(cached.popularProducts);
      setCategories(cached.categories);
      setInitialLoading(false);
      return;
    }

    try {
      setInitialLoading(true);
      
      // Fetch popular products and categories in parallel
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts({ limit: 30, page: 1 }), // Get 30 popular products
        getCategories(),
      ]);

      let popularData = [];
      let categoriesData = [];

      if (productsRes.success && productsRes.data) {
        popularData = productsRes.data;
        setPopularProducts(popularData);
      }

      if (categoriesRes.success && categoriesRes.data) {
        // Flatten categories and subcategories for "Discover More"
        const allCategories = [];
        categoriesRes.data.forEach(cat => {
          allCategories.push({ name: cat.name, type: 'category' });
          if (cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach(sub => {
              allCategories.push({ name: sub.name, type: 'subcategory' });
            });
          }
        });
        categoriesData = allCategories.slice(0, 12);
        setCategories(categoriesData);
      }

      // Cache the results
      searchCache.set(cacheKey, {
        popularProducts: popularData,
        categories: categoriesData,
        timestamp: now,
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData])
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        await performSearch(searchQuery.trim());
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const performSearch = useCallback(async (query, forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = searchCache.get(cacheKey);
    const isCacheValid = cached && (now - cached.timestamp < CACHE_DURATION);

    if (!forceRefresh && isCacheValid) {
      setSearchResults(cached.data);
      setHasSearched(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await searchProducts(query, 50); // Get up to 50 results
      
      if (response.success) {
        const results = response.data || [];
        searchCache.set(cacheKey, {
          data: results,
          timestamp: now,
        });
        setSearchResults(results);
        setHasSearched(true);
      } else {
        setSearchResults([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search products');
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProductPress = (product) => {
    router.push({
      pathname: '/(stack)/product-detail',
      params: { productId: product.id, variantIndex: 0 }
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const handleCategoryPress = (categoryName) => {
    router.push({
      pathname: '/(tabs)/products',
      params: { category: categoryName }
    });
  };

  const renderPopularProduct = ({ item: product }) => {
    const variant = product.variants?.[0];
    const imageUrl = variant?.variantImages?.[0] || product.thumbnail || '';
    
    // Show variant name if available, otherwise product name
    const displayName = variant?.displayName || variant?.variantName || product.shortDescription;

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => handleProductPress(product)}
        style={{ width: '31.5%' }}
        className="mb-3 bg-white rounded-lg border border-gray-200 overflow-hidden"
        activeOpacity={0.8}
      >
        {/* Product Image */}
        <View className="w-full aspect-square bg-gray-50">
          {imageUrl ? (
            <Image
              source={{ uri: getFullImageUrl(imageUrl) }}
              style={{ width: '100%', height: '100%', padding: 8 }}
              contentFit="contain"
              transition={150}
              
              priority="low"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Product Name */}
        <View className="p-2">
          <Text className="text-xs text-gray-900" numberOfLines={2}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item: product }) => {
    const variant = product.variants?.[0];
    const imageUrl = variant?.variantImages?.[0] || product.thumbnail || '';
    
    // Show variant name if available, otherwise product name
    const displayName = variant?.displayName || variant?.variantName || product.shortDescription;

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => handleProductPress(product)}
        style={{ width: '31.5%' }}
        className="mb-3 bg-white rounded-lg border border-gray-200 overflow-hidden"
        activeOpacity={0.8}
      >
        {/* Product Image */}
        <View className="w-full aspect-square bg-gray-50">
          {imageUrl ? (
            <Image
              source={{ uri: getFullImageUrl(imageUrl) }}
              style={{ width: '100%', height: '100%', padding: 8 }}
              contentFit="contain"
              transition={150}
              
              priority="low"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Product Name */}
        <View className="p-2">
          <Text className="text-xs text-gray-900" numberOfLines={2}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: PRIMARY_COLOR }}>
        <View className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
            {/* Back Button */}
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            {/* Search Input */}
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2.5">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for products"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-gray-900 text-sm"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} className="ml-2">
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Content */}
          {loading || initialLoading ? (
            <View className="flex-1 items-center justify-center bg-gray-50">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text className="mt-3 text-gray-500">Loading...</Text>
            </View>
          ) : hasSearched ? (
            /* Search Results */
            <ScrollView 
              className="flex-1 bg-gray-50" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {searchResults.length > 0 ? (
                <View className="px-3 py-4">
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {searchResults.map((product) => renderSearchResult({ item: product }))}
                  </View>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center py-20 px-4">
                  <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                  <Text className="text-lg font-semibold text-gray-800 mt-4">
                    No products found
                  </Text>
                  <Text className="text-sm text-gray-500 mt-2 text-center">
                    No results for "{searchQuery}"
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : (
            /* Default View - Popular Products & Discover More */
            <ScrollView 
              className="flex-1 bg-gray-50" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Popular Products */}
              {popularProducts.length > 0 && (
                <View className="bg-white py-4 mb-2">
                  <Text className="text-base font-bold text-gray-900 px-4 mb-3">
                    Popular Products
                  </Text>
                  <View className="px-3">
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {popularProducts.map((product) => renderPopularProduct({ item: product }))}
                    </View>
                  </View>
                </View>
              )}

              {/* Discover More */}
              {categories.length > 0 && (
                <View className="bg-white py-4 mb-2">
                  <View className="flex-row items-center px-4 mb-3">
                    <Ionicons name="trending-up" size={18} color="#374151" />
                    <Text className="text-base font-bold text-gray-900 ml-2">
                      Discover More
                    </Text>
                  </View>
                  <View className="px-4 flex-row flex-wrap">
                    {categories.map((category, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleCategoryPress(category.name)}
                        className="bg-gray-100 px-4 py-2.5 rounded-lg mr-2 mb-2"
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm text-gray-700">{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </>
  );
});

SearchScreen.displayName = 'SearchScreen';

export default SearchScreen;
