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
  const [isValidating, setIsValidating] = useState(false);
  const [serviceabilityMessage, setServiceabilityMessage] = useState('');

  // Initialize form with editing address
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        label: editingAddress.addressType ? editingAddress.addressType.charAt(0).toUpperCase() + editingAddress.addressType.slice(1) : 'Home',
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
      // Reset form for new address
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
  }, [editingAddress, visible]);

  const handleSubmit = () => {
    // Validate required fields
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-10 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
            <Text className="text-xl font-semibold">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Pincode - TOP FOR UX */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-gray-700">
                  Pincode <Text className="text-red-500">*</Text>
                </Text>
                {isValidating && (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#666" />
                    <Text className="text-xs text-gray-500 ml-1">Checking...</Text>
                  </View>
                )}
              </View>
              <ZipCodeInput
                country={formData.country}
                state={formData.state}
                city={formData.city}
                value={formData.zipCode}
                onChange={(value) => {
                  setFormData({ ...formData, zipCode: value });
                }}
                onLocationSelect={(location) => {
                  setFormData((prev) => ({
                    ...prev,
                    city: location.city !== undefined ? location.city : prev.city,
                    state: location.state !== undefined ? location.state : prev.state,
                    district: location.district !== undefined ? location.district : prev.district,
                    country: location.country !== undefined ? location.country : prev.country,
                  }));
                }}
                placeholder="6-digit pincode"
              />
            </View>

            {/* Separator */}
            <View className="h-px bg-gray-200 my-4" />

            {/* Address Label */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Address Label <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row gap-2">
                {['Home', 'Office', 'Other'].map((label) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setFormData({ ...formData, label })}
                    className={`flex-1 py-3 rounded-lg border ${
                      formData.label === label
                        ? 'bg-red-50 border-red-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        formData.label === label ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter full name"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                placeholderTextColor="#999"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <PhoneInput
                value={formData.phoneNumber}
                onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                disabled={!visible}
              />
            </View>

            {/* Address Line 1 */}
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

            {/* Address Line 2 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Optional)
              </Text>
              <TextInput
                value={formData.addressLine2}
                onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
                placeholder="Landmark, Area"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                placeholderTextColor="#999"
              />
            </View>

            {/* District */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">District</Text>
              <TextInput
                value={formData.district}
                onChangeText={(text) => setFormData({ ...formData, district: text })}
                placeholder="Enter district"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                placeholderTextColor="#999"
              />
            </View>

            {/* Country, State, City */}
            <CountryStateCitySelect
              value={{
                country: formData.country,
                state: formData.state,
                city: formData.city,
              }}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  country: value.country,
                  state: value.state,
                  city: value.city,
                });
              }}
              required
              showLabels
              countryLabel="Country"
              stateLabel="State"
              cityLabel="City"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-2 px-4 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 py-3 rounded-lg"
            >
              <Text className="text-center text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || isServiceable === false || isValidating}
              className={`flex-1 py-3 rounded-lg ${
                isLoading || isServiceable === false || isValidating
                  ? 'bg-gray-300'
                  : 'bg-red-500'
              }`}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white font-medium ml-2">
                    {editingAddress ? 'Updating...' : 'Saving...'}
                  </Text>
                </View>
              ) : (
                <Text className="text-center text-white font-medium">
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddressModal;
