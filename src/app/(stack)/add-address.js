import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { PhoneInput, CountryStateCitySelect, ZipCodeInput } from '../../components/ui';
import addressService from '../../services/addressService';
import toast from '../../utils/toast';
import { useCurrencyData } from '../../hooks/useCurrency';

const PRIMARY_COLOR = '#e63946';

export default function AddAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const returnTo = params.returnTo || 'addresses';
  
  // Get admin's default country
  const { country: adminCountry } = useCurrencyData();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    addressType: 'home',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [isCheckingZipcode, setIsCheckingZipcode] = useState(false);
  
  // Auto-fill admin's country when it loads
  useEffect(() => {
    if (adminCountry && !formData.country) {
      setFormData(prev => ({ ...prev, country: adminCountry }));
    }
  }, [adminCountry]);

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    {/* Clear error for this field when user types */}
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }

    if (!formData.country || !formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      await addressService.createAddress(formData);
      toast.success('Address added successfully');
      
      if (returnTo === 'checkout') {
        router.back();
      } else {
        router.replace('/addresses');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: PRIMARY_COLOR }}>
        <View className="flex-1 bg-gray-50">
          {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Add New Address</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4 space-y-4">
          {/* Name and Phone in 2 columns on larger screens */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => handleFieldChange('name', text)}
                placeholder="Enter recipient name"
                className={`bg-white px-4 py-3 rounded-lg border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <Text className="text-xs text-red-500 mt-1">{errors.name}</Text>
              )}
            </View>
          </View>

          {/* Phone Number */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Phone Number <Text className="text-red-500">*</Text>
            </Text>
            <PhoneInput
              value={formData.phone}
              onChange={(phone) => handleFieldChange('phone', phone)}
            />
            {errors.phone && (
              <Text className="text-xs text-red-500 mt-1">{errors.phone}</Text>
            )}
          </View>

          {/* Alternate Phone */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Alternate Phone Number
            </Text>
            <PhoneInput
              value={formData.alternatePhone}
              onChange={(phone) => handleFieldChange('alternatePhone', phone)}
            />
          </View>

          {/* Address Line 1 */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Address Line 1 <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.addressLine1}
              onChangeText={(text) => handleFieldChange('addressLine1', text)}
              placeholder="House No., Building Name, Floor"
              className={`bg-white px-4 py-3 rounded-lg border ${
                errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
              }`}
              multiline
              numberOfLines={2}
            />
            {errors.addressLine1 && (
              <Text className="text-xs text-red-500 mt-1">{errors.addressLine1}</Text>
            )}
          </View>

          {/* Address Line 2 */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Address Line 2
            </Text>
            <TextInput
              value={formData.addressLine2}
              onChangeText={(text) => handleFieldChange('addressLine2', text)}
              placeholder="Street, Road, Area, Colony"
              className="bg-white px-4 py-3 rounded-lg border border-gray-300"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Landmark */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Landmark
            </Text>
            <TextInput
              value={formData.landmark}
              onChangeText={(text) => handleFieldChange('landmark', text)}
              placeholder="Nearby landmark (e.g., Near Metro Station)"
              className="bg-white px-4 py-3 rounded-lg border border-gray-300"
            />
          </View>

          {/* Pincode */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Pincode <Text className="text-red-500">*</Text>
            </Text>
            <ZipCodeInput
              country={formData.country}
              state={formData.state}
              city={formData.city}
              value={formData.pincode}
              onChange={(pincode) => handleFieldChange('pincode', pincode)}
              onCheckingStart={() => setIsCheckingZipcode(true)}
              onCheckingEnd={() => setIsCheckingZipcode(false)}
              onLocationSelect={(location) => {
                {/* Only update fields that are provided in the location object */}
                const updates = {};
                if (location.city) updates.city = location.city;
                if (location.state) updates.state = location.state;
                if (location.country) updates.country = location.country;
                
                if (Object.keys(updates).length > 0) {
                  setFormData((prev) => ({
                    ...prev,
                    ...updates,
                  }));
                }
              }}
            />
            {errors.pincode && (
              <Text className="text-xs text-red-500 mt-1">{errors.pincode}</Text>
            )}
          </View>

          {/* Country, State, City */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Location <Text className="text-red-500">*</Text>
            </Text>
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
                if (errors.country) setErrors({ ...errors, country: '' });
                if (errors.state) setErrors({ ...errors, state: '' });
                if (errors.city) setErrors({ ...errors, city: '' });
              }}
              required={true}
              showLabels={true}
              countryLabel="Country"
              stateLabel="State"
              cityLabel="City"
              disabled={isCheckingZipcode}
            />
            {(errors.country || errors.state || errors.city) && (
              <View className="mt-1">
                {errors.country && (
                  <Text className="text-xs text-red-500">{errors.country}</Text>
                )}
                {errors.state && (
                  <Text className="text-xs text-red-500">{errors.state}</Text>
                )}
                {errors.city && (
                  <Text className="text-xs text-red-500">{errors.city}</Text>
                )}
              </View>
            )}
          </View>

          {/* Address Type */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Address Type</Text>
            <View className="flex-row gap-4">
              {['home', 'work', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFormData({ ...formData, addressType: type })}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      formData.addressType === type
                        ? 'border-red-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.addressType === type && (
                      <View className="w-3 h-3 rounded-full bg-red-600" />
                    )}
                  </View>
                  <Text className="text-sm text-gray-700 capitalize">{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Set as Default */}
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-gray-700">Set as default address</Text>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
              trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
              thumbColor={formData.isDefault ? PRIMARY_COLOR : '#f3f4f6'}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Bottom Buttons */}
      <View 
        className="bg-white border-t border-gray-200 px-4 py-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={saving}
            className="flex-1 border-2 border-gray-300 py-3 rounded-lg"
          >
            <Text className="text-gray-700 font-medium text-center">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg"
            style={{ backgroundColor: saving ? '#D1D5DB' : PRIMARY_COLOR }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-center">
                Save Address
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </View>
      </SafeAreaView>
    </>
  );
}
