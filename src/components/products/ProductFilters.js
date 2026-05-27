import { memo } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../../hooks/useCurrency';

const PRIMARY_COLOR = '#e63946';

// Static badge options matching frontend
const STATIC_BADGE_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'combo', label: 'Combo Products' },
  { value: 'New Arrival', label: 'New Arrivals' },
  { value: 'Bestseller', label: 'Bestsellers' },
  { value: 'Trending', label: 'Trending' },
  { value: 'Hot Deal', label: 'Hot Deals' },
  { value: 'Limited Stock', label: 'Limited Stock' },
  { value: 'Sale', label: 'On Sale' },
];

const ProductFilters = memo(({
  // Categories
  categories = [],
  selectedCategory,
  onCategorySelect,
  selectedSubcategory,
  onSubcategorySelect,
  
  // Badges
  badges = [],
  selectedBadge,
  onBadgeSelect,
  
  // Brands
  availableBrands = [],
  selectedBrands = [],
  onBrandToggle,
  
  // Price
  selectedPriceRange,
  onPriceRangeSelect,
  customMinPrice,
  customMaxPrice,
  setCustomMinPrice,
  setCustomMaxPrice,
  onCustomPriceApply,
  
  // General
  activeFilterCount = 0,
  onClearAll,
}) => {
  const currencySymbol = useCurrency();
  
  const [expandedSections, setExpandedSections] = useState({
    badges: true,
    categories: true,
    brands: true,
    price: true,
  });

  const PRICE_RANGES = [
    { label: `Under ${currencySymbol}100`, min: 0, max: 100 },
    { label: `${currencySymbol}100 - ${currencySymbol}500`, min: 100, max: 500 },
    { label: `${currencySymbol}500 - ${currencySymbol}1000`, min: 500, max: 1000 },
    { label: `${currencySymbol}1000 - ${currencySymbol}2000`, min: 1000, max: 2000 },
    { label: `Above ${currencySymbol}2000`, min: 2000, max: undefined },
  ];

  // Build badge options: Use provided badges or fall back to static options
  // Badges should already be sorted by sortOrder from parent
  const displayBadgeOptions = badges && badges.length > 0 ? badges : [
    ...STATIC_BADGE_OPTIONS,
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get badge label for display
  const getBadgeLabel = (value) => {
    const badge = displayBadgeOptions.find(b => b.value === value);
    return badge ? badge.label : value;
  };

  return (
    <View>
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <View className="pb-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-gray-700">
              Active Filters ({activeFilterCount})
            </Text>
            <TouchableOpacity onPress={onClearAll}>
              <Text className="text-xs text-[#e63946]">Clear All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap gap-2">
            {/* Badge Chip */}
            {selectedBadge && selectedBadge !== 'all' && (
              <View className="flex-row items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                <Text className="text-xs text-[#e63946]">{getBadgeLabel(selectedBadge)}</Text>
                <TouchableOpacity onPress={() => onBadgeSelect('all')}>
                  <Ionicons name="close-circle" size={14} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Category Chip */}
            {selectedCategory && (
              <View className="flex-row items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                <Text className="text-xs text-[#e63946]">{selectedCategory}</Text>
                <TouchableOpacity onPress={() => onCategorySelect('')}>
                  <Ionicons name="close-circle" size={14} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Subcategory Chip */}
            {selectedSubcategory && (
              <View className="flex-row items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                <Text className="text-xs text-[#e63946]">{selectedSubcategory}</Text>
                <TouchableOpacity onPress={() => onSubcategorySelect && onSubcategorySelect('')}>
                  <Ionicons name="close-circle" size={14} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Brand Chips */}
            {selectedBrands.map((brand) => (
              <View key={brand} className="flex-row items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                <Text className="text-xs text-[#e63946]">{brand}</Text>
                <TouchableOpacity onPress={() => onBrandToggle(brand)}>
                  <Ionicons name="close-circle" size={14} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Price Chip */}
            {selectedPriceRange && (
              <View className="flex-row items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                <Text className="text-xs text-[#e63946]">
                  {PRICE_RANGES.find(r => r.min === selectedPriceRange.min && r.max === selectedPriceRange.max)?.label ||
                    `${currencySymbol}${selectedPriceRange.min || 0} - ${currencySymbol}${selectedPriceRange.max || '∞'}`}
                </Text>
                <TouchableOpacity onPress={() => {
                  onPriceRangeSelect(null);
                  setCustomMinPrice('');
                  setCustomMaxPrice('');
                }}>
                  <Ionicons name="close-circle" size={14} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Categories Section - Must come first like frontend */}
      <View className="py-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => toggleSection('categories')}
          className="flex-row items-center justify-between mb-3"
        >
          <Text className="text-base font-semibold text-gray-800">Categories</Text>
          <Ionicons 
            name={expandedSections.categories ? 'chevron-up' : 'chevron-down'} 
            size={18} 
            color="#6B7280" 
          />
        </TouchableOpacity>
        
        {expandedSections.categories && (
          <View>
            <TouchableOpacity
              onPress={() => onCategorySelect('')}
              className={`px-3 py-2 rounded mb-1 ${
                selectedCategory === '' || !selectedCategory ? 'bg-[#e63946]' : 'bg-gray-50'
              }`}
            >
              <Text className={`text-sm ${
                selectedCategory === '' || !selectedCategory ? 'text-white font-semibold' : 'text-gray-700'
              }`}>
                All Categories
              </Text>
            </TouchableOpacity>
            
            {categories.map((category) => (
              <View key={category.id}>
                <TouchableOpacity
                  onPress={() => onCategorySelect(category.name)}
                  className={`px-3 py-2 rounded mb-1 ${
                    selectedCategory === category.name && !selectedSubcategory
                      ? 'bg-[#e63946]'
                      : selectedCategory === category.name
                      ? 'bg-red-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <Text className={`text-sm ${
                    selectedCategory === category.name && !selectedSubcategory
                      ? 'text-white font-semibold'
                      : selectedCategory === category.name
                      ? 'text-[#e63946] font-semibold'
                      : 'text-gray-700'
                  }`}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
                
                {/* Subcategories */}
                {selectedCategory === category.name &&
                  category.subcategories &&
                  category.subcategories.length > 0 && (
                    <View className="ml-3 mt-1 mb-2 border-l-2 border-gray-200 pl-3">
                      {category.subcategories.map((sub) => (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => onSubcategorySelect && onSubcategorySelect(sub.name)}
                          className={`px-2 py-1.5 rounded mb-1 ${
                            selectedSubcategory === sub.name
                              ? 'bg-[#e63946]'
                              : 'bg-gray-50'
                          }`}
                        >
                          <Text className={`text-sm ${
                            selectedSubcategory === sub.name
                              ? 'text-white font-medium'
                              : 'text-gray-600'
                          }`}>
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Shop By Section - Radio buttons like frontend */}
      {onBadgeSelect && (
        <View className="py-4 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => toggleSection('badges')}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-base font-semibold text-gray-800">Shop By</Text>
            <Ionicons 
              name={expandedSections.badges ? 'chevron-up' : 'chevron-down'} 
              size={18} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          
          {expandedSections.badges && (
            <View>
              {displayBadgeOptions.map((badge) => (
                <TouchableOpacity
                  key={badge.value}
                  onPress={() => onBadgeSelect(badge.value)}
                  className="flex-row items-center gap-2 px-2 py-2"
                >
                  <View className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                    selectedBadge === badge.value
                      ? 'border-[#e63946]'
                      : 'border-gray-300'
                  }`}>
                    {selectedBadge === badge.value && (
                      <View className="w-2 h-2 rounded-full bg-[#e63946]" />
                    )}
                  </View>
                  <Text className="text-sm text-gray-700">{badge.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Brands Section */}
      {availableBrands.length > 0 && (
        <View className="py-4 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => toggleSection('brands')}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-base font-semibold text-gray-800">Brands</Text>
            <Ionicons 
              name={expandedSections.brands ? 'chevron-up' : 'chevron-down'} 
              size={18} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          
          {expandedSections.brands && (
            <View>
              {availableBrands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  onPress={() => onBrandToggle(brand)}
                  className="flex-row items-center gap-2 px-2 py-2"
                >
                  <View className={`w-4 h-4 rounded border-2 items-center justify-center ${
                    selectedBrands.includes(brand)
                      ? 'bg-[#e63946] border-[#e63946]'
                      : 'border-gray-300'
                  }`}>
                    {selectedBrands.includes(brand) && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-sm text-gray-700">{brand}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Price Range Section */}
      <View className="py-4">
        <TouchableOpacity
          onPress={() => toggleSection('price')}
          className="flex-row items-center justify-between mb-3"
        >
          <Text className="text-base font-semibold text-gray-800">Price Range</Text>
          <Ionicons 
            name={expandedSections.price ? 'chevron-up' : 'chevron-down'} 
            size={18} 
            color="#6B7280" 
          />
        </TouchableOpacity>
        
        {expandedSections.price && (
          <View>
            {/* Preset ranges */}
            {PRICE_RANGES.map((range, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onPriceRangeSelect({ min: range.min, max: range.max })}
                className="flex-row items-center gap-2 px-2 py-2"
              >
                <View className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                  selectedPriceRange?.min === range.min && 
                  selectedPriceRange?.max === range.max &&
                  !customMinPrice &&
                  !customMaxPrice
                    ? 'border-[#e63946]'
                    : 'border-gray-300'
                }`}>
                  {selectedPriceRange?.min === range.min && 
                   selectedPriceRange?.max === range.max &&
                   !customMinPrice &&
                   !customMaxPrice && (
                    <View className="w-2 h-2 rounded-full bg-[#e63946]" />
                  )}
                </View>
                <Text className="text-sm text-gray-700">{range.label}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Custom range */}
            <View className="pt-3 border-t border-gray-100 mt-3">
              <Text className="text-xs text-gray-500 mb-2">Custom Range</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={customMinPrice}
                  onChangeText={(text) => {
                    setCustomMinPrice(text);
                  }}
                  placeholder="Min"
                  keyboardType="numeric"
                  className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <Text className="text-gray-400">-</Text>
                <TextInput
                  value={customMaxPrice}
                  onChangeText={(text) => {
                    setCustomMaxPrice(text);
                  }}
                  placeholder="Max"
                  keyboardType="numeric"
                  className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <TouchableOpacity
                  onPress={onCustomPriceApply}
                  className="bg-[#e63946] rounded-lg px-3 py-1.5"
                >
                  <Text className="text-white text-sm font-medium">Go</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
