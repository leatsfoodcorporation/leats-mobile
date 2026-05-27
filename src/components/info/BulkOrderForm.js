import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import enquiryService from '../../services/enquiryService';
import toast from '../../utils/toast';

const PRIMARY_COLOR = '#e63946';

const BulkOrderForm = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    productDetails: '',
    quantity: '',
    deliveryDate: '',
    message: '',
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.productDetails || !formData.quantity) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await enquiryService.submitBulkOrder(formData);

      if (response.success) {
        toast.success('Bulk order enquiry submitted successfully! We\'ll contact you soon.');
        
        setFormData({
          name: '',
          phone: '',
          companyName: '',
          productDetails: '',
          quantity: '',
          deliveryDate: '',
          message: '',
        });
      }
    } catch (error) {
      console.error('Error submitting bulk order enquiry:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit enquiry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
    >
      <View className="p-4">
        {/* Header Card */}
        <View className="bg-white rounded-lg p-6 mb-4 items-center shadow-sm">
          <View className="w-16 h-16 bg-[#e63946] rounded-full items-center justify-center mb-4">
            <Ionicons name="cube" size={32} color="#fff" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Bulk Order Enquiry
          </Text>
          <Text className="text-gray-600 text-center">
            Need to order in large quantities? Fill out the form below and our team will get back to you with the best pricing and delivery options.
          </Text>
        </View>

        {/* Form */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          {/* Contact Information */}
          <Text className="text-lg font-semibold text-gray-900 mb-4">Contact Information</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Full Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="John Doe"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Phone Number <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Company Name (Optional)
            </Text>
            <TextInput
              value={formData.companyName}
              onChangeText={(text) => handleChange('companyName', text)}
              placeholder="ABC Corporation"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          {/* Order Details */}
          <Text className="text-lg font-semibold text-gray-900 mb-4 mt-4">Order Details</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Product Details <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.productDetails}
              onChangeText={(text) => handleChange('productDetails', text)}
              placeholder="Please specify the products you need (e.g., Rice - 25kg bags, Cooking Oil - 5L cans)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Estimated Quantity <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.quantity}
              onChangeText={(text) => handleChange('quantity', text)}
              placeholder="e.g., 100 units, 500 kg"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date
            </Text>
            <TextInput
              value={formData.deliveryDate}
              onChangeText={(text) => handleChange('deliveryDate', text)}
              placeholder="DD/MM/YYYY"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Additional Requirements
            </Text>
            <TextInput
              value={formData.message}
              onChangeText={(text) => handleChange('message', text)}
              placeholder="Any special requirements, delivery instructions, or questions..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
              placeholderTextColor="#999"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-lg ${loading ? 'bg-gray-300' : 'bg-[#e63946]'}`}
          >
            {loading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-semibold ml-2">Submitting...</Text>
              </View>
            ) : (
              <Text className="text-center text-white font-semibold text-base">
                Submit Bulk Order Enquiry
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-center text-gray-500 mt-4">
            By submitting this form, you agree to our terms and conditions. We'll contact you within 24-48 hours.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default BulkOrderForm;
