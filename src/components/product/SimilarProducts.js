import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import ProductCard from '../products/ProductCard';
import { getProducts } from '../../services/frontendService';

const PRIMARY_COLOR = '#e63946';

const SimilarProducts = memo(({ category, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSimilarProducts = useCallback(async () => {
    if (!category) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getProducts({
        category,
        limit: 10,
      });

      if (response.success && response.data) {
        // Filter out current product
        const filtered = response.data.filter(p => p.id !== currentProductId);
        setProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    } finally {
      setLoading(false);
    }
  }, [category, currentProductId]);

  useEffect(() => {
    fetchSimilarProducts();
  }, [fetchSimilarProducts]);

  if (loading) {
    return (
      <View className="py-6">
        <Text className="text-lg font-bold text-gray-800 mb-4 px-4">
          Similar Products
        </Text>
        <View className="flex-row justify-center py-8">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View className="py-4">
      <Text className="text-lg font-bold text-gray-800 mb-4 px-4">
        Similar Products
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="flex-row"
      >
        {products.map((product, index) => (
          <View
            key={product.id}
            style={{
              width: 180,
              marginRight: index < products.length - 1 ? 12 : 0,
            }}
          >
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

SimilarProducts.displayName = 'SimilarProducts';

export default SimilarProducts;
