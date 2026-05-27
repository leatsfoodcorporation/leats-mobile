import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import faqService from '../../services/faqService';

const PRIMARY_COLOR = '#e63946';

const FAQComponent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [faqCategories, setFaqCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await faqService.getActiveFaqs();
      
      if (response.data) {
        const mapped = response.data.map((f) => ({
          id: f.id,
          title: f.title,
          sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : null,
          faqs: Array.isArray(f.contents)
            ? f.contents.map((c) => ({ 
                question: c.title || '', 
                answer: c.description || '' 
              }))
            : [],
        }));

        mapped.sort((a, b) => {
          const sa = a.sortOrder == null ? Number.MAX_SAFE_INTEGER : a.sortOrder;
          const sb = b.sortOrder == null ? Number.MAX_SAFE_INTEGER : b.sortOrder;
          return sa - sb;
        });

        setFaqCategories(mapped);
      }
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (categoryId, faqIndex) => {
    const key = `${categoryId}-${faqIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text className="text-gray-600 mt-3">Loading FAQs...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
    >
      {/* Header Banner */}
      <View className="bg-[#e63946] py-8 px-4">
        <Text className="text-2xl font-bold text-white text-center mb-2">
          Frequently Asked Questions
        </Text>
        <Text className="text-white/80 text-center">
          Find answers to common questions
        </Text>
      </View>

      {/* FAQ Categories */}
      <View className="px-4 py-6">
        {faqCategories.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Ionicons name="help-circle-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-800 font-semibold text-lg mt-4 mb-2">
              No FAQs Available
            </Text>
            <Text className="text-gray-500 text-center">
              FAQs are currently being updated. Please check back later.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {faqCategories.map((category) => (
              <View key={category.id} className="bg-white rounded-lg p-4 shadow-sm">
                <Text className="text-lg font-bold text-gray-800 mb-3">
                  {category.title}
                </Text>
                <View className="space-y-2">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.id}-${index}`;
                    const isOpen = openItems[key];
                    return (
                      <View 
                        key={key} 
                        className="border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                      >
                        <TouchableOpacity
                          onPress={() => toggleFAQ(category.id, index)}
                          className="flex-row items-center justify-between py-2"
                        >
                          <Text className="font-medium text-gray-800 text-sm flex-1 pr-2">
                            {faq.question}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#6b7280"
                            style={{
                              transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
                            }}
                          />
                        </TouchableOpacity>
                        {isOpen && (
                          <Text className="text-gray-600 text-sm pb-2">
                            {faq.answer}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

     
    </ScrollView>
  );
};

export default FAQComponent;
