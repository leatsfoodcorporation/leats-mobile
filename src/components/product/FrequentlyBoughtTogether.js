import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFullImageUrl } from '../../lib/image-utils';
import toast from '../../utils/toast';

const PRIMARY_COLOR = '#e63946';

const FrequentlyBoughtTogether = memo(({ mainProduct, addons, onAddToCart }) => {
  const [selectedAddons, setSelectedAddons] = useState(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // Initialize with default selected add-ons
  useEffect(() => {
    const defaultSelected = new Set();
    addons.forEach((addon) => {
      if (addon.isDefaultSelected) {
        defaultSelected.add(`${addon.productId}-${addon.variantIndex}`);
      }
    });
    setSelectedAddons(defaultSelected);
  }, [addons]);

  if (!addons || addons.length === 0) {
    return null;
  }

  const toggleAddon = useCallback((addonKey) => {
    setSelectedAddons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(addonKey)) {
        newSet.delete(addonKey);
      } else {
        newSet.add(addonKey);
      }
      return newSet;
    });
  }, []);

  const calculateTotal = useCallback(() => {
    let total = mainProduct.price;
    addons.forEach((addon) => {
      const addonKey = `${addon.productId}-${addon.variantIndex}`;
      if (selectedAddons.has(addonKey)) {
        total += addon.variant.variantSellingPrice;
      }
    });
    return total;
  }, [mainProduct.price, addons, selectedAddons]);

  const calculateTotalMRP = useCallback(() => {
    let total = mainProduct.mrp;
    addons.forEach((addon) => {
      const addonKey = `${addon.productId}-${addon.variantIndex}`;
      if (selectedAddons.has(addonKey)) {
        total += addon.variant.variantMRP;
      }
    });
    return total;
  }, [mainProduct.mrp, addons, selectedAddons]);

  const handleAddAllToCart = useCallback(async () => {
    try {
      setIsAdding(true);

      const itemsToAdd = [];

      // Add main product - ALWAYS include it since the checkbox is always checked
      // For combo products, use product.id; for regular products, use inventoryProductId
      const mainInventoryId = mainProduct.inventoryProductId || mainProduct.id;
      
      if (mainInventoryId) {
        itemsToAdd.push({
          inventoryProductId: mainInventoryId,
          quantity: 1,
        });
      }

      // Add selected add-ons
      addons.forEach((addon) => {
        const addonKey = `${addon.productId}-${addon.variantIndex}`;
        if (selectedAddons.has(addonKey)) {
          // Only add if inventoryProductId exists
          if (addon.variant.inventoryProductId) {
            itemsToAdd.push({
              inventoryProductId: addon.variant.inventoryProductId,
              quantity: 1,
            });
          }
        }
      });

      // Check if we have any items to add
      if (itemsToAdd.length === 0) {
        toast.error('No valid items to add to cart');
        return;
      }

      await onAddToCart(itemsToAdd);
      
      toast.success(`${itemsToAdd.length} item(s) added to cart`);
    } catch (error) {
      // Handle errors properly
      if (error instanceof Error) {
        // Don't show generic error if it's a stock issue (already handled by addToCart)
        if (!error.message.includes('stock')) {
          toast.error('Some items could not be added to cart');
        }
      } else {
        toast.error('Failed to add items to cart');
      }
    } finally {
      setIsAdding(false);
    }
  }, [mainProduct, addons, selectedAddons, onAddToCart]);

  const totalPrice = calculateTotal();
  const totalMRP = calculateTotalMRP();
  const totalSavings = totalMRP - totalPrice;
  const savingsPercentage = totalMRP > 0 ? Math.round((totalSavings / totalMRP) * 100) : 0;

  const selectedCount = 1 + selectedAddons.size;

  // Custom Checkbox Component
  const Checkbox = ({ checked, onPress, disabled }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`w-4 h-4 rounded border-2 items-center justify-center ${
        Boolean(checked)
          ? 'bg-[#e63946] border-[#e63946]'
          : 'bg-white border-gray-300'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {Boolean(checked) && <Ionicons name="checkmark" size={12} color="white" />}
    </TouchableOpacity>
  );

  return (
    <View className="border-t border-gray-200 pt-4">
      <Text className="text-base font-semibold text-gray-800 mb-3">
        Frequently bought together
      </Text>

      {/* Products Row - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View className="flex-row items-start gap-2">
          {/* Main Product - Always Selected */}
          <View className="flex-shrink-0">
            <View className="flex-col items-center gap-2">
              {/* Image with checkbox inside */}
              <View className="relative w-20 h-20 bg-gray-50 rounded border border-gray-200 overflow-hidden">
                <Image
                  source={{ uri: getFullImageUrl(mainProduct.image) }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
                {/* Checkbox in top-right corner */}
                <View className="absolute top-1 right-1">
                  <Checkbox checked disabled />
                </View>
              </View>
              {/* Product info below image */}
              <View className="items-center" style={{ maxWidth: 80 }}>
                <Text className="text-xs text-gray-700 text-center mb-1" numberOfLines={2}>
                  {mainProduct.name}
                </Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {`₹${mainProduct.price.toFixed(0)}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Plus Icon */}
          <View className="flex-shrink-0 items-center justify-center" style={{ marginTop: 32 }}>
            <Text className="text-gray-300 text-2xl font-light">+</Text>
          </View>

          {/* Add-on Products */}
          {addons.map((addon, index) => {
            const addonKey = `${addon.productId}-${addon.variantIndex}`;
            const isSelected = selectedAddons.has(addonKey);
            const discount =
              addon.variant.variantMRP > addon.variant.variantSellingPrice
                ? Math.round(
                    ((addon.variant.variantMRP - addon.variant.variantSellingPrice) /
                      addon.variant.variantMRP) *
                      100
                  )
                : 0;

            return (
              <React.Fragment key={addonKey}>
                <View className="flex-shrink-0">
                  <View className="flex-col items-center gap-2">
                    {/* Image with checkbox inside */}
                    <TouchableOpacity
                      onPress={() => toggleAddon(addonKey)}
                      className="relative w-20 h-20 bg-gray-50 rounded border border-gray-200 overflow-hidden"
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri: getFullImageUrl(
                            addon.variant.variantImages?.[0] || '/placeholder.png'
                          ),
                        }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                      {/* Checkbox in top-right corner */}
                      <View className="absolute top-1 right-1">
                        <Checkbox
                          checked={isSelected}
                          onPress={() => toggleAddon(addonKey)}
                        />
                      </View>
                    </TouchableOpacity>
                    {/* Product info below image */}
                    <View className="items-center" style={{ maxWidth: 80 }}>
                      <Text className="text-xs text-gray-700 text-center mb-1" numberOfLines={2}>
                        {`${addon.variant.displayName || addon.variant.variantName}${addon.variant.variantUom && addon.variant.variantUomValue ? ` (${addon.variant.variantUomValue}${addon.variant.variantUom})` : ''}`}
                      </Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {`₹${addon.variant.variantSellingPrice.toFixed(0)}`}
                      </Text>
                      {Boolean(discount > 0) && (
                        <Text className="text-xs text-green-600">{`(${discount}% off)`}</Text>
                      )}
                    </View>
                  </View>
                </View>
                {/* Plus Icon after each addon except the last one */}
                {Boolean(index < addons.length - 1) && (
                  <View className="flex-shrink-0 items-center justify-center" style={{ marginTop: 32 }}>
                    <Text className="text-gray-300 text-2xl font-light">+</Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* Price Box */}
      <View className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <View className="gap-2.5">
          {/* Total Price */}
          <View>
            <Text className="text-xs text-gray-600 mb-1">
              {`Total price for ${selectedCount} item${selectedCount > 1 ? 's' : ''}:`}
            </Text>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-xl font-bold text-gray-900">
                {`₹${totalPrice.toFixed(0)}`}
              </Text>
              {Boolean(totalSavings > 0) && (
                <Text className="text-xs text-gray-400 line-through">
                  {`₹${totalMRP.toFixed(0)}`}
                </Text>
              )}
            </View>
            {Boolean(totalSavings > 0) && (
              <Text className="text-xs text-green-600 font-medium mt-0.5">
                {`Save ₹${totalSavings.toFixed(0)} (${savingsPercentage}%)`}
              </Text>
            )}
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddAllToCart}
            disabled={isAdding}
            className="rounded-lg py-2.5 px-3 flex-row items-center justify-center gap-1.5"
            style={{
              backgroundColor: isAdding ? '#9CA3AF' : PRIMARY_COLOR,
            }}
            activeOpacity={0.8}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={16} color="white" />
                <Text className="text-white font-medium text-sm">
                  {`Add all ${selectedCount} to Cart`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

FrequentlyBoughtTogether.displayName = 'FrequentlyBoughtTogether';

export default FrequentlyBoughtTogether;
