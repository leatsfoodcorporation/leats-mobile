import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { PhoneInput, CountryStateCitySelect, ZipCodeInput, DatePicker } from '../../components/ui';
import axiosInstance from '../../lib/axios';
import toast from '../../utils/toast';

const PRIMARY_COLOR = '#e63946';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    dateOfBirth: null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || 'India',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const submitData = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
      };

      const response = await axiosInstance.put('/api/auth/profile', submitData);

      if (response.data.success) {
        await updateUser(response.data.data);
        toast.success('Profile updated successfully');
        router.back();
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: PRIMARY_COLOR }}>
        <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingBottom: insets.bottom }}>
          <Stack.Screen
            options={{
              title: 'Edit Profile',
              headerShown: true,
            }}
          />

      <ScrollView className="flex-1 px-4 py-4">
        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Full Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your full name"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
            placeholderTextColor="#999"
          />
        </View>

        {/* Phone Number */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </Text>
          <PhoneInput
            value={formData.phoneNumber}
            onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
          />
        </View>

        {/* Address */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Address
          </Text>
          <TextInput
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="123 Main Street"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white"
            placeholderTextColor="#999"
          />
        </View>

        {/* ZIP Code */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            ZIP/Postal Code
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
                country: location.country !== undefined ? location.country : prev.country,
              }));
            }}
            placeholder="Enter postal code"
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
          showLabels
          countryLabel="Country"
          stateLabel="State"
          cityLabel="City"
        />

        {/* Date of Birth */}
        <View className="mb-4 mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </Text>
          <DatePicker
            value={formData.dateOfBirth}
            onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
            disabled={isLoading}
            placeholder="Select your date of birth"
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className={`py-3 rounded-lg ${isLoading ? 'bg-gray-300' : 'bg-red-500'}`}
        >
          {isLoading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white font-medium ml-2">Saving...</Text>
            </View>
          ) : (
            <Text className="text-center text-white font-medium text-base">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </View>
      </SafeAreaView>
    </>
  );
}
