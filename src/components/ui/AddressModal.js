import React, { useState, useEffect, useRef } from 'react';
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
  findNodeHandle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput from './PhoneInput';
import CountryStateCitySelect from './CountryStateCitySelect';
import ZipCodeInput from './ZipCodeInput';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';

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

  const [region, setRegion] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [startCoordinate, setStartCoordinate] = useState(null);
  const [endCoordinate, setEndCoordinate] = useState(null);

  // Initialize form with editing address
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      setRegion(null);

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

        await loadEditLocation(editingAddress);
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
        await getCurrentLocation();
      }

      setIsServiceable(null);
      setServiceabilityMessage('');
    };

    if (visible) {
      initializeForm();
    }
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

  const loadEditLocation = async (addressToEdit) => {
    try {
      const query = [
        addressToEdit.addressLine1,
        addressToEdit.addressLine2,
        addressToEdit.city,
        addressToEdit.state,
        addressToEdit.country,
        addressToEdit.pincode,
      ]
        .filter(Boolean)
        .join(', ');

      if (!query) {
        await getCurrentLocation();
        return;
      }

      const geocoded = await Location.geocodeAsync(query);

      if (geocoded.length > 0) {
        const location = geocoded[0];
        const editRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        };

        setRegion(editRegion);
        setStartCoordinate({
          latitude: editRegion.latitude,
          longitude: editRegion.longitude,
        });
        setEndCoordinate({
          latitude: editRegion.latitude,
          longitude: editRegion.longitude,
        });

        await getAddress(editRegion.latitude, editRegion.longitude);
      } else {
        await getCurrentLocation();
      }
    } catch (error) {
      console.log('Edit location error:', error);
      await getCurrentLocation();
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') return;

      const location =
        await Location.getCurrentPositionAsync({});

      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };

      setRegion(currentRegion);

      setStartCoordinate({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });

      setEndCoordinate({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });

      await getAddress(
        currentRegion.latitude,
        currentRegion.longitude
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

const getAddress = async (lat, lng) => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (result.length > 0) {
      const place = result[0];
      console.log(place);
      setAddress(
        `${place.street || ''}, ${place.city || ''}, ${place.region || ''}`
      );

      setFormData(prev => ({
        ...prev,
        addressLine1: `${place.name || ''} ${place.street || ''}`.trim(),
        addressLine2: `${place.district || place.subregion || ''}`.trim(),
        city: place.city || '',
        district: place.district || place.subregion || '',
        state: place.region || '',
        zipCode: place.postalCode || '',
        country: place.country || 'India',
      }));
    }
  } catch (error) {
    console.log('Reverse geocode error:', error);
  }
};

  const handleRegionChangeComplete = async (newRegion) => {
    setRegion(newRegion);

    await getAddress(
      newRegion.latitude,
      newRegion.longitude
    );
  };

  if (loading || !region) {
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
          {/* Header */}
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
              {/* MapView */}
              <View style={{ width: '100%', height: 300 }}>
                <MapView
                  style={{ width: '100%', height: 300 }}
                  region={region}
                  onRegionChangeComplete={(newRegion) => {
                    setRegion(newRegion);
                    getAddress(newRegion.latitude, newRegion.longitude);
                  }}
                />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [
                    { translateX: -20 },
                    { translateY: -40 },
                  ],
                }}
              >
                <Ionicons name="location" size={40} color="red" />
              </View>
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

            {/* City */}
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

            {/* District */}
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

            {/* State */}
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

            {/* Pincode */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Pincode <Text className="text-red-500">*</Text>
              </Text>
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

            {/* Country */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Country <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                placeholder="Enter country"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                placeholderTextColor="#999"
              />
            </View>

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
              <TouchableOpacity activeOpacity={0.8}>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Full Name <Text className="text-red-500">*</Text>
                </Text>
              </TouchableOpacity>
              <TextInput
                ref={fullNameRef}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter full name"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
                placeholderTextColor="#999"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <TouchableOpacity activeOpacity={0.8}>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
              </TouchableOpacity>
              <PhoneInput
                ref={phoneRef}
                value={formData.phoneNumber}
                onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                disabled={!visible}
              />
            </View>

            </ScrollView>
          </KeyboardAvoidingView>

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
