import { memo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, getProducts } from '../../services/frontendService';
import { useTabRefresh } from '../../context/TabRefreshContext';
import CategorySidebar from '../../components/categories/CategorySidebar';
import CategoryContent from '../../components/categories/CategoryContent';

const PRIMARY_COLOR = '#e63946';

// Cache for categories screen
let categoriesDataCache = null;
let productsDataCache = {};
let cacheTimestamp = null;
let productsCacheTimestamp = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CategoriesScreen = memo(() => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch categories with caching
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && categoriesDataCache && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < CACHE_DURATION) {
          console.log('✅ Using cached categories');
          setCategories(categoriesDataCache);
          if (!selectedCategory) {
            setSelectedCategory({ id: 'combo', name: 'Combo', isCombo: true });
          }
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const response = await getCategories();
      if (response.success && response.data) {
        categoriesDataCache = response.data;
        cacheTimestamp = Date.now();
        setCategories(response.data);
        
        if (!selectedCategory) {
          setSelectedCategory({ id: 'combo', name: 'Combo', isCombo: true });
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Fetch products with caching
  const fetchProducts = useCallback(async (pageNum = 1, append = false, forceRefresh = false) => {
    if (!selectedCategory) return;

    try {
      const cacheKey = `${selectedCategory.id || selectedCategory.name}_${pageNum}`;
      
      // Check cache for page 1
      if (!forceRefresh && pageNum === 1 && productsDataCache[cacheKey] && productsCacheTimestamp[cacheKey]) {
        const cacheAge = Date.now() - productsCacheTimestamp[cacheKey];
        if (cacheAge < CACHE_DURATION) {
          console.log('✅ Using cached products for category');
          setProducts(productsDataCache[cacheKey].products);
          setBrands(productsDataCache[cacheKey].brands);
          setHasMore(productsDataCache[cacheKey].hasMore);
          setProductsLoading(false);
          return;
        }
      }

      if (pageNum === 1) {
        setProductsLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 30,
      };

      if (selectedCategory.isCombo) {
        params.type = 'combo';
      } else {
        params.category = selectedCategory.name;
      }

      const response = await getProducts(params);

      if (response.success) {
        const newProducts = response.data || [];
        
        const uniqueBrands = [...new Set(
          newProducts
            .filter(p => p.brand && p.brand !== 'Combo')
            .map(p => p.brand)
        )].sort();
        
        const hasMoreData = response.pagination?.hasNext || false;
        
        setBrands(uniqueBrands);
        setHasMore(hasMoreData);
        
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
          
          // Cache page 1 results
          productsDataCache[cacheKey] = {
            products: newProducts,
            brands: uniqueBrands,
            hasMore: hasMoreData,
          };
          productsCacheTimestamp[cacheKey] = Date.now();
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when category changes
  useEffect(() => {
    if (selectedCategory) {
      setPage(1);
      fetchProducts(1, false);
    }
  }, [selectedCategory]);

  // Pull to refresh - force refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, false, true);
  }, [fetchProducts]);

  // Use focus effect for better navigation
  useFocusEffect(
    useCallback(() => {
      // Always set cached data first if available
      if (categoriesDataCache && cacheTimestamp) {
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < CACHE_DURATION) {
          console.log('✅ Screen focused - using cached categories');
          setCategories(categoriesDataCache);
          if (!selectedCategory) {
            setSelectedCategory({ id: 'combo', name: 'Combo', isCombo: true });
          }
          setLoading(false);
          return;
        }
      }
      // No cache or cache expired - fetch fresh data
      fetchCategories();
    }, [fetchCategories, selectedCategory])
  );

  // Tab refresh
  useTabRefresh('categories', onRefresh);

  // Load more products
  const handleLoadMore = () => {
    if (!productsLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  };

  // Handle sidebar category selection
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setProducts([]);
    setBrands([]);
    setPage(1);
    setHasMore(true);
  };

  // Handle subcategory press - navigate to products screen
  const handleSubcategoryPress = (subcategory) => {
    router.push({
      pathname: '/(tabs)/products',
      params: { category: subcategory.name }
    });
  };

  // Handle brand press - navigate to products screen with brand filter
  const handleBrandPress = (brand) => {
    router.push({
      pathname: '/(tabs)/products',
      params: { 
        category: selectedCategory.name,
        brand: brand
      }
    });
  };

  if (loading) {
    return (
      <>
        <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
        <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: PRIMARY_COLOR }}>
          <View className="flex-1 bg-gray-50">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text className="mt-3 text-gray-500">Loading categories...</Text>
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
        <View className="flex-1 bg-white">
      {/* Header */}
      <View 
        className="bg-white border-b border-gray-200 px-4 flex-row items-center justify-between"
        style={{ paddingBottom: 12, paddingTop: 8 }}
      >     
        <Text className="text-xl font-bold text-gray-900">All Categories</Text>
      </View>

      <View className="flex-1 flex-row">
        {/* Left Sidebar Component */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Right Content Component - Shows Products, Subcategories, Brands */}
        <CategoryContent
          selectedCategory={selectedCategory}
          products={products}
          brands={brands}
          loading={productsLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          onSubcategoryPress={handleSubcategoryPress}
          onBrandPress={handleBrandPress}
        />
      </View>
    </View>
    </SafeAreaView>
    </>
  );
});

CategoriesScreen.displayName = 'CategoriesScreen';

export default CategoriesScreen;
