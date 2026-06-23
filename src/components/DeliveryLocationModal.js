import { memo } from 'react';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { detectLocationByCoords } from '../services/deliveryZoneService';
import { getWebSettings } from '../services/webSettingsService';

const PRIMARY_COLOR = '#e63946';

/* Lazy load expo-location to avoid native module errors */
let Location = null;
try {
  Location = require('expo-location');
} catch (error) {
  console.log('expo-location not available, location detection disabled');
}

const DeliveryLocationModal = memo(() => {
  const {
    isModalOpen,
    setIsModalOpen,
    checkPincode,
    saveLocation,
    availableCountries,
    selectedCountry,
    setSelectedCountry,
    isLoading,
  } = useLocation();

  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [webSettings, setWebSettings] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  /* Fetch web settings for logo */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getWebSettings();
        if (response.success) {
          setWebSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch web settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleCheck = async () => {
    if (!pincode.trim()) return;

    const res = await checkPincode(pincode.trim(), selectedCountry);
    const locationData = {
      pincode: pincode.trim(),
      city: res.data?.city || '',
      state: res.data?.state || '',
      country: res.data?.country || selectedCountry,
      area: res.data?.area || '',
      isServiceable: res.serviceable === true,
    };

    setResult({
      serviceable: res.serviceable,
      message: res.message,
      city: locationData.city,
      state: locationData.state,
      country: locationData.country,
      area: locationData.area,
    });

    saveLocation(locationData);
  };

  const handleDetectLocation = async () => {
    if (!Location) {
      Alert.alert(
        'Location Not Available',
        'Location detection requires rebuilding the app. Please enter your pincode manually.',
        [{ text: 'OK' }]
      );
      return;
    }

    setDetectingLocation(true);
    
    /* Clear previous results to avoid showing stale data */
    setResult(null);
    setPincode('');
    
    try {
      /* Request location permissions */
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'We could not access your location. You can enable location permissions in Settings, or enter your pincode manually.',
          [{ text: 'OK' }]
        );
        setResult({
          serviceable: false,
          message: 'Location permission denied. Please enter your pincode manually.',
        });
        setDetectingLocation(false);
        return;
      }

      /* Get current position with high accuracy and timeout */
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 0, // Don't use cached location
        timeout: 15000, // 15 second timeout
      });

      const { latitude, longitude } = position.coords;
      
      console.log(`📍 GPS Coordinates: ${latitude}, ${longitude}`);

      /* Call backend to detect location from coordinates */
      const res = await detectLocationByCoords(latitude, longitude);

      console.log('🔍 Backend Response:', JSON.stringify(res, null, 2));

      if (res.success && res.data) {
        const detectedPincode = res.data.pincode;
        const detectedCountry = res.data.country || selectedCountry;
        const detectedCity = res.data.city;
        const detectedState = res.data.state;
        const detectedArea = res.data.area;

        /* Validate that we got a pincode */
        if (!detectedPincode || detectedPincode.trim() === '') {
          console.log('⚠️ No pincode detected from backend');
          setResult({
            serviceable: false,
            message: 'Could not detect pincode from your location. Please enter manually.',
          });
          return;
        }

        console.log(`✅ Detected Pincode: ${detectedPincode}, City: ${detectedCity}, State: ${detectedState}`);

        /* Update state with detected values */
        setPincode(detectedPincode);
        setSelectedCountry(detectedCountry);

        /* Use the serviceability status directly from detectLocation response */
        setResult({
          serviceable: res.serviceable,
          message: res.message || (res.serviceable 
            ? `Delivery available in ${detectedArea ? detectedArea + ', ' : ''}${detectedCity}` 
            : `We do not deliver to ${detectedCity} yet`),
          city: detectedCity,
          state: detectedState,
          country: detectedCountry,
          area: detectedArea,
        });
      } else {
        console.log('❌ Backend failed to detect location');
        setResult({
          serviceable: false,
          message: res.message || 'Failed to detect location from coordinates',
        });
      }
    } catch (error) {
      // Handle common "location services off" error more gracefully
      const message = String(error?.message || '');
      const isLocationUnavailable =
        message.includes('Current location is unavailable') ||
        message.includes('location services are disabled') ||
        message.includes('location provider is unavailable');

      if (isLocationUnavailable) {
        Alert.alert(
          'Location Services Disabled',
          'Current location is unavailable. Please turn on GPS / location services and try again, or enter your pincode manually.',
          [{ text: 'OK' }]
        );
        setResult({
          serviceable: false,
          message: 'Current location is unavailable. Please enter your pincode manually.',
        });
      } else {
        console.log('Location detection error:', error);
        setResult({
          serviceable: false,
          message: 'Failed to detect your location. Please enter your pincode manually.',
        });
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleContinue = () => {
    if (result?.serviceable) {
      saveLocation({
        pincode: pincode.trim(),
        city: result.city || '',
        state: result.state || '',
        country: result.country || selectedCountry,
        isServiceable: true,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setResult(null);
    setPincode('');
    setIsCountryDropdownOpen(false);
  };

  const getCountryFlag = (country) => {
    if (country === 'India') return '🇮🇳';
    if (country === 'Malaysia') return '🇲🇾';
    if (country === 'UAE' || country === 'United Arab Emirates') return '🇦🇪';
    return '🌐';
  };

  return (
    <Modal
      visible={isModalOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            className="absolute top-4 right-4 z-10"
          >
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <View className="items-center mb-6">
              <View className="mb-4">
                {webSettings?.logoUrl && webSettings.logoUrl.trim() !== '' ? (
                  <Image
                    source={{ uri: webSettings.logoUrl }}
                    style={{ width: 120, height: 64 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>
                    LEATS
                  </Text>
                )}
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Choose delivery location
              </Text>
              <Text className="text-sm text-gray-500 mt-1 text-center">
                Enter your pincode to check delivery availability
              </Text>
            </View>

            {/* Pincode Input */}
            <View className="mb-4">
              <View className="flex-row items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                <View className="pl-3">
                  <Feather name="search" size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  value={pincode}
                  onChangeText={(text) => {
                    const value = text.replace(/\D/g, '');
                    setPincode(value);
                    setResult(null);
                  }}
                  placeholder="Enter your pincode..."
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={15}
                  className="flex-1 px-3 py-3 text-gray-700 text-sm"
                  onSubmitEditing={handleCheck}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  onPress={handleCheck}
                  disabled={!pincode.trim() || isLoading}
                  className="px-4 py-3"
                  style={{ backgroundColor: !pincode.trim() || isLoading ? '#D1D5DB' : PRIMARY_COLOR }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium text-sm">Check</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Use Current Location Button */}
            {/* <TouchableOpacity
              onPress={handleDetectLocation}
              disabled={detectingLocation}
              className="w-full mb-6 flex-row items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-lg"
            >
              {detectingLocation ? (
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              ) : (
                <Ionicons name="location" size={16} color={PRIMARY_COLOR} />
              )}
              <Text className="text-sm text-gray-600">
                {detectingLocation ? 'Detecting...' : 'Use current location'}
              </Text>
            </TouchableOpacity> */}

            {/* Service Area Message */}
            <View className="items-center mb-6">
              <View className="bg-red-50 border border-red-100 px-4 py-2 rounded-full flex-row items-center gap-2 shadow-sm">
                <Ionicons name="location" size={16} color={PRIMARY_COLOR} />
                <Text className="text-sm font-semibold text-gray-800">
                  We are currently serving in <Text style={{ color: PRIMARY_COLOR }}>Madurai!</Text>
                </Text>
              </View>
            </View>

            {/* Result */}
            {result && (
              <View
                className={`p-4 rounded-lg border-2 mb-4 ${
                  result.serviceable
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <View className="flex-row items-start gap-3">
                  <Ionicons
                    name={result.serviceable ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={result.serviceable ? '#16A34A' : '#DC2626'}
                  />
                  <View className="flex-1">
                    <Text
                      className={`font-medium text-sm ${
                        result.serviceable ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {result.serviceable ? 'Delivery available!' : 'Not serviceable'}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${
                        result.serviceable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.serviceable
                        ? `📍 ${result.area ? result.area + ', ' : ''}${result.city}, ${result.state}`
                        : result.message}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Continue Button */}
            {result?.serviceable && (
              <TouchableOpacity
                onPress={handleContinue}
                className="w-full py-3 rounded-lg"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Text className="text-white font-semibold text-center text-sm">
                  Continue Shopping
                </Text>
              </TouchableOpacity>
            )}

            {/* Skip text */}
            {!result?.serviceable && (
              <TouchableOpacity onPress={handleClose} className="mt-3">
                <Text className="text-center text-xs text-gray-400 underline">
                  Skip for now
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

DeliveryLocationModal.displayName = 'DeliveryLocationModal';

export default DeliveryLocationModal;
