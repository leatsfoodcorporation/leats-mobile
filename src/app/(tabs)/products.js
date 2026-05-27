import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ProductCard from '../../components/products/ProductCard';
import ProductFilters from '../../components/products/ProductFilters';
import SortDropdown from '../../components/products/SortDropdown';
import { getProducts, getCategories } from '../../services/frontendService';
import { getAllBadges } from '../../services/badgeService';
import { useTabRefresh } from '../../context/TabRefreshContext';

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Price: Low to High', value: 'price-low', sortBy: 'defaultSellingPrice', sortOrder: 'asc' },
  { label: 'Price: High to Low', value: 'price-high', sortBy: 'defaultSellingPrice', sortOrder: 'desc' },
  { label: 'Discount', value: 'discount', sortBy: 'defaultDiscountValue', sortOrder: 'desc' },
];

const ProductsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [badges, setBadges] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paramsInitialized, setParamsInitialized] = useState(false);
  const [badgesLoaded, setBadgesLoaded] = useState(false);
  
  // Initialize filters from params FIRST before any data fetching
  useEffect(() => {
    if (params.badge) {
      setSelectedBadge(params.badge);
    }
    if (params.category) {
      setSelectedCategory(params.category);
    }
    if (params.search) {
      setSearchQuery(params.search);
    }
    setParamsInitialized(true);
  }, [params.badge, params.category, params.search]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Count active filters
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedSubcategory ? 1 : 0) +
    selectedBrands.length +
    (selectedPriceRange ? 1 : 0) +
    (selectedBadge !== 'all' ? 1 : 0);

  // Fetch categories and badges
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesRes, badgesRes] = await Promise.all([
          getCategories(),
          getAllBadges(),
        ]);
        
        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
        
        if (badgesRes.success && badgesRes.data.all) {
          const allBadgeOptions = [
            { value: 'all', label: 'All Products', sortOrder: -2 },
            { value: 'combo', label: 'Combo Products', sortOrder: -1 },
            ...badgesRes.data.all.map(badge => ({
              value: badge.name,
              label: badge.name,
              sortOrder: badge.sortOrder,
              id: badge.id,
            })),
          ];
          
          setBadges(allBadgeOptions);
          setBadgesLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setBadgesLoaded(true);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Minimum loading time for better UX (only for pagination)
      const startTime = Date.now();
      const minLoadTime = pageNum > 1 ? 500 : 0;

      // Determine price filter
      let minPrice, maxPrice;
      if (selectedPriceRange) {
        minPrice = selectedPriceRange.min;
        maxPrice = selectedPriceRange.max;
      }

      const response = await getProducts({
        page: pageNum,
        limit: 20,
        category: selectedCategory || undefined,
        subCategory: selectedSubcategory || undefined,
        search: searchQuery || undefined,
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder,
        badge: selectedBadge !== 'all' && selectedBadge !== 'combo' ? selectedBadge : undefined,
        type: selectedBadge === 'combo' ? 'combo' : undefined,
        brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
        minPrice,
        maxPrice,
        includeVariantPriceFilter: 'true',
      });

      // Ensure minimum loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
      }

      if (response.success) {
        let filteredProducts = response.data;
        
        // Client-side multi-brand filter
        if (selectedBrands.length > 1) {
          filteredProducts = response.data.filter(p => selectedBrands.includes(p.brand));
        }
        
        // Extract unique brands
        const brands = [...new Set(
          response.data
            .filter(p => p.brand && p.brand !== 'Combo')
            .map(p => p.brand)
        )].sort();
        
        const hasMore = response.pagination?.hasNext || false;
        const totalCount = selectedBrands.length > 1 ? filteredProducts.length : (response.pagination?.totalCount || 0);
        
        setAvailableBrands(brands);
        
        if (append) {
          setProducts(prev => [...prev, ...filteredProducts]);
        } else {
          setProducts(filteredProducts);
        }
        
        setHasMore(hasMore);
        setTotalCount(totalCount);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedSubcategory, selectedSort, searchQuery, selectedBadge, selectedBrands, selectedPriceRange]);

  // Initial load and filter changes - only fetch after params AND badges are loaded
  useEffect(() => {
    if (!paramsInitialized || !badgesLoaded) {
      return;
    }
    setPage(1);
    setProducts([]); // Clear products only on filter change
    fetchProducts(1, false);
  }, [paramsInitialized, badgesLoaded, selectedCategory, selectedSubcategory, selectedSort, searchQuery, selectedBadge, selectedBrands, selectedPriceRange]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Tab refresh
  useTabRefresh('products', onRefresh);

  // Load more
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName === selectedCategory ? '' : categoryName);
    // Clear subcategory when category changes
    if (categoryName !== selectedCategory) {
      setSelectedSubcategory('');
    }
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategoryName) => {
    setSelectedSubcategory(subcategoryName === selectedSubcategory ? '' : subcategoryName);
  };



  // Handle brand toggle
  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Handle price range selection
  const handlePriceRangeSelect = (range) => {
    setSelectedPriceRange(range);
    if (range) {
      setCustomMinPrice('');
      setCustomMaxPrice('');
    }
  };

  // Handle custom price apply
  const handleCustomPriceApply = () => {
    if (customMinPrice || customMaxPrice) {
      setSelectedPriceRange({
        min: customMinPrice ? parseFloat(customMinPrice) : undefined,
        max: customMaxPrice ? parseFloat(customMaxPrice) : undefined,
      });
    }
  };

  // Handle badge selection
  const handleBadgeSelect = (badge) => {
    setSelectedBadge(badge);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSelectedBadge('all');
    setSearchQuery('');
    setShowFilterModal(false);
  };

  // Render product item - stable reference
  const renderProduct = useCallback((item, index) => (
    <View key={item.id} className="w-1/2 p-1.5">
      <ProductCard product={item} />
    </View>
  ), []);

  // Render products in grid - memoized
  const productGrid = useCallback(() => {
    const rows = [];
    for (let i = 0; i < products.length; i += 2) {
      rows.push(
        <View key={`row-${i}`} className="flex-row">
          {renderProduct(products[i], i)}
          {products[i + 1] && renderProduct(products[i + 1], i + 1)}
          {!products[i + 1] && <View className="w-1/2" />}
        </View>
      );
    }
    return rows;
  }, [products, renderProduct]);

  // List header component - memoized
  const ListHeader = useCallback(() => {
    if (!badgesLoaded || categories.length === 0) return null;
    
    return (
      <View className="px-3 py-2">
        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('')}
            className={`px-4 py-1.5 rounded-full mr-2 ${
              selectedCategory === '' ? 'bg-[#e63946]' : 'bg-gray-100'
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedCategory === '' ? 'text-white' : 'text-gray-600'
            }`}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelect(category.name)}
              className={`px-4 py-1.5 rounded-full mr-2 ${
                selectedCategory === category.name ? 'bg-[#e63946]' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === category.name ? 'text-white' : 'text-gray-600'
              }`}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results count and sort/filter buttons */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-600">
            {totalCount} product{totalCount !== 1 ? 's' : ''}
          </Text>
          
          <View className="flex-row gap-2">
            <SortDropdown
              options={SORT_OPTIONS}
              value={selectedSort.value}
              onChange={(value) => {
                const option = SORT_OPTIONS.find(o => o.value === value);
                if (option) {
                  setSelectedSort(option);
                }
              }}
            />
            
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <Ionicons name="filter" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [badgesLoaded, categories, selectedCategory, totalCount, selectedSort, activeFilterCount, handleCategorySelect]);

  // Empty state - memoized
  const EmptyState = useCallback(() => (
    <View className="flex-1 items-center justify-center py-16">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="cube-outline" size={40} color="#9CA3AF" />
      </View>
      <Text className="text-lg font-semibold text-gray-800 mb-2">No Products Found</Text>
      <Text className="text-sm text-gray-500 text-center px-8">
        {activeFilterCount > 0
          ? 'No products match your filters'
          : 'No products available at the moment'}
      </Text>
      {activeFilterCount > 0 && (
        <TouchableOpacity
          onPress={clearAllFilters}
          className="mt-4 px-6 py-2 bg-[#e63946] rounded-lg"
        >
          <Text className="text-white font-medium">Clear All Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [activeFilterCount, clearAllFilters]);

  // Footer loading indicator - memoized
  const FooterLoader = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#e63946" />
        <Text className="text-center text-gray-500 mt-2">Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        navigation={{ navigate: (route) => router.push(`/(tabs)/${route.toLowerCase()}`) }}
        showSearch={true}
        cartCount={0}
        wishlistCount={0}
        hideCategories={true}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e63946" />
          <Text className="mt-3 text-gray-500">Loading products...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#e63946']}
              tintColor="#e63946"
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Header */}
          <ListHeader />

          {/* Products Grid */}
          {products.length > 0 ? (
            <View className="px-1.5">
              {productGrid()}
            </View>
          ) : (
            <EmptyState />
          )}

          {/* Footer Loader */}
          <FooterLoader />
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable 
            className="bg-white rounded-t-2xl"
            style={{ 
              maxHeight: '80%',
              paddingBottom: insets.bottom || 8,
              overflow: 'hidden',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-bold">Filters</Text>
              <View className="flex-row items-center gap-3">
                {activeFilterCount > 0 && (
                  <TouchableOpacity onPress={clearAllFilters}>
                    <Text className="text-[#e63946] font-medium">Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Filter Content */}
            <ScrollView 
              className="px-4"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingVertical: 16 }}
              nestedScrollEnabled={true}
            >
              <ProductFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                selectedSubcategory={selectedSubcategory}
                onSubcategorySelect={handleSubcategorySelect}
                badges={badges}
                selectedBadge={selectedBadge}
                onBadgeSelect={handleBadgeSelect}
                availableBrands={availableBrands}
                selectedBrands={selectedBrands}
                onBrandToggle={handleBrandToggle}
                selectedPriceRange={selectedPriceRange}
                onPriceRangeSelect={handlePriceRangeSelect}
                customMinPrice={customMinPrice}
                customMaxPrice={customMaxPrice}
                setCustomMinPrice={setCustomMinPrice}
                setCustomMaxPrice={setCustomMaxPrice}
                onCustomPriceApply={handleCustomPriceApply}
                activeFilterCount={activeFilterCount}
                onClearAll={clearAllFilters}
              />
            </ScrollView>

            {/* Apply Button */}
            <View className="p-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="bg-[#e63946] rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold text-base">
                  Show {totalCount} Product{totalCount !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ProductsScreen;
