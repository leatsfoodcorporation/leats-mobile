import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput from './PhoneInput';
import CountryStateCitySelect from './CountryStateCitySelect';
import ZipCodeInput from './ZipCodeInput';

const AddressModal = ({
  visible = false,
  onClose,
  onSave,
  editingAddress = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [isServiceable, setIsServiceable] = useState(null);
  const [serviceabilityMessage, setServiceabilityMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    if (editingAddress) {
      setFormData({
        label: editingAddress.addressType
          ? editingAddress.addressType.charAt(0).toUpperCase() +
            editingAddress.addressType.slice(1)
          : 'Home',
        fullName: editingAddress.name || '',
        phoneNumber: editingAddress.phone || '',
        addressLine1: editingAddress.addressLine1 || '',
        addressLine2: editingAddress.addressLine2 || '',
        city: editingAddress.city || '',
        district: editingAddress.district || '',
        state: editingAddress.state || '',
        zipCode: editingAddress.pincode || '',
        country: editingAddress.country || 'India',
      });
    } else {
      setFormData({
        label: 'Home',
        fullName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        state: '',
        zipCode: '',
        country: 'India',
      });
    }

    setIsServiceable(null);
    setServiceabilityMessage('');
    setLoading(false);
  }, [editingAddress, visible]);

  const handleSubmit = () => {
    const missingFields = [];
    if (!formData.fullName?.trim()) missingFields.push('Full Name');
    if (!formData.phoneNumber?.trim()) missingFields.push('Phone Number');
    if (!formData.addressLine1?.trim()) missingFields.push('Address');
    if (!formData.city?.trim()) missingFields.push('City');
    if (!formData.state?.trim()) missingFields.push('State');
    if (!formData.zipCode?.trim()) missingFields.push('Pincode');

    if (missingFields.length > 0) {
      Alert.alert('Missing Fields', `Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (isServiceable === false) {
      Alert.alert('Not Serviceable', 'Selected location is not serviceable for delivery.');
      return;
    }

    onSave(formData);
  };

  const handleClose = () => {
    setFormData({
      label: 'Home',
      fullName: '',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      state: '',
      zipCode: '',
      country: 'India',
    });
    setIsServiceable(null);
    setServiceabilityMessage('');
    onClose();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-10 bg-white rounded-t-3xl">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
            <Text className="text-xl font-semibold">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
            className="flex-1"
          >
            <ScrollView
              className="flex-1 px-4 py-4"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 250 }}
            >
              <View className="mb-4 rounded-xl border border-gray-200 bg-yellow-50 px-4 py-4">
                <Text className="text-sm font-semibold text-yellow-900 mb-1">
                  Map selection is unavailable on web.
                </Text>
                <Text className="text-sm text-yellow-800">
                  Please enter your address manually.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={formData.addressLine1}
                  onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
                  placeholder="House/Flat No, Building Name, Street"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </Text>
                <TextInput
                  value={formData.addressLine2}
                  onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
                  placeholder="Landmark, Area"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  City <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Enter city"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  District
                </Text>
                <TextInput
                  value={formData.district}
                  onChangeText={(text) => setFormData({ ...formData, district: text })}
                  placeholder="Enter district"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  State <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                  placeholder="Enter state"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Pincode <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={formData.zipCode}
                  onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Country
                </Text>
                <TextInput
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                  placeholder="Enter country"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Full Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholder="Enter name"
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                  placeholderTextColor="#999"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
                <PhoneInput
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                />
              </View>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="flex-1 bg-red-500 py-3 rounded-lg"
                  disabled={isLoading}
                >
                  <Text className="text-center text-white font-medium">
                    {isLoading ? 'Saving...' : 'Save Address'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gray-100 py-3 rounded-lg"
                >
                  <Text className="text-center text-gray-700 font-medium">Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

export default AddressModal;
