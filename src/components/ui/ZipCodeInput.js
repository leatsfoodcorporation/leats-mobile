import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country } from 'country-state-city';
import deliveryZoneService from '../../services/deliveryZoneService';

const ZipCodeInput = ({
  value = '',
  onChange,
  onLocationSelect,
  onCheckingStart,
  onCheckingEnd,
  country = 'India',
  state = '',
  city = '',
  disabled = false,
  placeholder,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [serviceability, setServiceability] = useState({
    status: 'idle', // 'idle' | 'checking' | 'serviceable' | 'not-serviceable' | 'error'
    message: '',
    data: null
  });

  const debounceTimerRef = useRef(null);

  // Get country ISO code
  const countryCode = useMemo(() => {
    if (!country) return 'IN';
    const allCountries = Country.getAllCountries();
    const foundCountry = allCountries.find(
      (c) => c.name.trim().toLowerCase() === country.trim().toLowerCase()
    );
    return foundCountry?.isoCode || 'IN';
  }, [country]);

  const isIndia = countryCode === 'IN';

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Fetch Indian pincode details
  const fetchIndianPincodeDetails = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        return data[0].PostOffice;
      }
      return [];
    } catch (error) {
      console.error('Error fetching pincode details:', error);
      return [];
    }
  };

  // Clean input
  const cleanInput = (input) => {
    if (isIndia) {
      return input.replace(/\D/g, '');
    }
    return input.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase();
  };

  // Handle input change
  const handleInputChange = async (text) => {
    const cleanedValue = cleanInput(text);
    const maxLength = isIndia ? 6 : 10;
    
    if (cleanedValue.length > maxLength) return;
    
    setLocalValue(cleanedValue);
    setValidationError('');
    onChange?.(cleanedValue);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // For India, fetch suggestions when typing (4+ digits)
    if (isIndia && cleanedValue.length >= 4) {
      setIsLoading(true);
      onCheckingStart?.();
      setServiceability({ status: 'checking', message: 'Checking serviceability...' });

      debounceTimerRef.current = setTimeout(async () => {
        // 1. Priority: Internal Zone Check
        try {
          const internalResult = await deliveryZoneService.checkPincodeServiceability(
            cleanedValue,
            country
          );
          
          if (internalResult.data) {
            setServiceability({
              status: internalResult.serviceable ? 'serviceable' : 'not-serviceable',
              message: internalResult.message,
              data: internalResult.data
            });
            
            setSuggestions([]);
            setShowSuggestions(false);
            setIsLoading(false);
            onCheckingEnd?.();
            
            // Auto-fill from zone data
            onLocationSelect?.({
              city: internalResult.data.city,
              state: internalResult.data.state,
              country: internalResult.data.country,
            });
            
            return;
          } else {
            setServiceability({
              status: 'not-serviceable',
              message: internalResult.message
            });
          }
        } catch (err) {
          console.error('Internal serviceability check failed:', err);
          setServiceability({ status: 'error', message: 'Serviceability check unavailable' });
        }

        // 2. Fallback: Public API
        if (cleanedValue.length === 6) {
          const results = await fetchIndianPincodeDetails(cleanedValue);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
          setIsLoading(false);
          onCheckingEnd?.();

          if (results.length > 0) {
            const details = results[0];
            onLocationSelect?.({
              city: details.District,
              state: details.State,
              district: details.District,
              country: 'India',
            });
          }
        } else {
          setIsLoading(false);
          onCheckingEnd?.();
        }
      }, 400);
    } else if (isIndia && cleanedValue.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      onCheckingEnd?.();
      setServiceability({ status: 'idle', message: '' });
      onLocationSelect?.({ city: '', state: '', district: '' });
    } else if (isIndia && cleanedValue.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      onCheckingEnd?.();
      setServiceability({ status: 'idle', message: '' });
    }

    // For non-Indian countries
    if (!isIndia && cleanedValue.length >= 4) {
      setIsLoading(true);
      onCheckingStart?.();
      setServiceability({ status: 'checking', message: 'Checking serviceability...' });

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const internalResult = await deliveryZoneService.checkPincodeServiceability(
            cleanedValue,
            country
          );
          
          if (internalResult.data) {
            setServiceability({
              status: internalResult.serviceable ? 'serviceable' : 'not-serviceable',
              message: internalResult.message,
              data: internalResult.data
            });
            
            onLocationSelect?.({
              city: internalResult.data.city,
              state: internalResult.data.state,
              country: internalResult.data.country,
            });
          } else {
            setServiceability({
              status: 'not-serviceable',
              message: internalResult.message
            });
          }
        } catch (err) {
          console.error('Internal serviceability check failed:', err);
          setServiceability({ status: 'error', message: 'Serviceability check unavailable' });
        }
        
        setIsLoading(false);
        onCheckingEnd?.();
      }, 600);
    } else if (!isIndia && cleanedValue.length === 0) {
      setIsLoading(false);
      onCheckingEnd?.();
      setServiceability({ status: 'idle', message: '' });
      onLocationSelect?.({ city: '', state: '', country: '' });
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setLocalValue(suggestion.Pincode);
    setShowSuggestions(false);
    setSuggestions([]);
    setValidationError('');
    
    onChange?.(suggestion.Pincode);
    
    onLocationSelect?.({
      city: suggestion.District,
      state: suggestion.State,
      district: suggestion.District,
      country: 'India',
    });
  };

  // Validate on blur
  const handleBlur = async () => {
    if (!localValue) {
      setValidationError('');
      setServiceability({ status: 'idle', message: '' });
      onCheckingEnd?.();
      return;
    }

    setIsLoading(true);
    onCheckingStart?.();

    // Zone Check
    try {
      const internalResult = await deliveryZoneService.checkPincodeServiceability(
        localValue,
        country
      );
      
      if (internalResult.serviceable && internalResult.data) {
        setServiceability({
          status: 'serviceable',
          message: internalResult.message,
          data: internalResult.data
        });
        setValidationError('');
        setIsLoading(false);
        onCheckingEnd?.();
        onLocationSelect?.({
          city: internalResult.data.city,
          state: internalResult.data.state,
          country: internalResult.data.country,
        });
        return;
      } else {
        setServiceability({
          status: 'not-serviceable',
          message: internalResult.message
        });
      }
    } catch (err) {
      setServiceability({ status: 'error', message: 'Warning: Serviceability check failed' });
    }

    if (isIndia) {
      if (localValue.length !== 6 || !/^\d{6}$/.test(localValue)) {
        setValidationError('Indian pincode must be 6 digits');
        setIsLoading(false);
        onCheckingEnd?.();
        onLocationSelect?.({ city: '', state: '', district: '' });
      } else {
        const details = await fetchIndianPincodeDetails(localValue);
        setIsLoading(false);
        onCheckingEnd?.();
        
        if (details.length === 0) {
          setValidationError('Invalid pincode');
          onLocationSelect?.({ city: '', state: '', district: '' });
        } else {
          setValidationError('');
          const firstOffice = details[0];
          onLocationSelect?.({
            city: firstOffice.District,
            state: firstOffice.State,
            district: firstOffice.District,
            country: 'India',
          });
        }
      }
    } else {
      if (localValue.length < 3) {
        setValidationError('Postal code is too short');
        setIsLoading(false);
        onCheckingEnd?.();
        onLocationSelect?.({ city: '', state: '', country: '' });
      } else {
        setValidationError('');
        setIsLoading(false);
        onCheckingEnd?.();
      }
    }
  };

  const getServiceabilityColor = () => {
    switch (serviceability.status) {
      case 'checking': return 'bg-gray-100 border-gray-200';
      case 'serviceable': return 'bg-green-50 border-green-200';
      case 'not-serviceable': return 'bg-amber-50 border-amber-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return '';
    }
  };

  const getServiceabilityTextColor = () => {
    switch (serviceability.status) {
      case 'checking': return 'text-gray-600';
      case 'serviceable': return 'text-green-700';
      case 'not-serviceable': return 'text-amber-700';
      case 'error': return 'text-red-700';
      default: return 'text-gray-600';
    }
  };

  const getServiceabilityIconColor = () => {
    switch (serviceability.status) {
      case 'checking': return '#666';
      case 'serviceable': return '#15803d';
      case 'not-serviceable': return '#b45309';
      case 'error': return '#b91c1c';
      default: return '#666';
    }
  };

  const getServiceabilityIcon = () => {
    switch (serviceability.status) {
      case 'checking': return null;
      case 'serviceable': return 'checkmark-circle';
      case 'not-serviceable': return 'alert-circle';
      case 'error': return 'close-circle';
      default: return null;
    }
  };

  return (
    <View className={className}>
      <View className="relative">
        <TextInput
          value={localValue}
          onChangeText={handleInputChange}
          onBlur={handleBlur}
          editable={!disabled}
          placeholder={placeholder || (isIndia ? 'Enter 6-digit pincode' : `Enter postal code for ${country}`)}
          keyboardType={isIndia ? 'numeric' : 'default'}
          maxLength={isIndia ? 6 : 10}
          className={`border rounded-lg px-3 py-3 text-base ${
            validationError ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
          placeholderTextColor="#999"
        />
        {isLoading && (
          <View className="absolute right-3 top-3">
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
      </View>

      {/* Validation Error */}
      {validationError && (
        <Text className="text-xs text-red-500 mt-1">{validationError}</Text>
      )}

      {/* Serviceability Indicator */}
      {!validationError && serviceability.status !== 'idle' && (
        <View className={`flex-row items-center gap-1.5 mt-1.5 px-2 py-1 rounded-md border ${getServiceabilityColor()}`}>
          {serviceability.status === 'checking' ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            getServiceabilityIcon() && (
              <Ionicons name={getServiceabilityIcon()} size={14} color={getServiceabilityIconColor()} />
            )
          )}
          <Text className={`text-xs font-medium ${getServiceabilityTextColor()}`}>
            {serviceability.message}
          </Text>
        </View>
      )}

      {/* Helper Text */}
      {!validationError && serviceability.status === 'idle' && localValue.length > 0 && (
        <Text className="text-xs text-gray-500 mt-1">
          {isIndia ? (
            localValue.length < 4 ? (
              `Enter ${4 - localValue.length} more digit${4 - localValue.length > 1 ? 's' : ''} to search`
            ) : localValue.length < 6 ? (
              `${6 - localValue.length} more digit${6 - localValue.length > 1 ? 's' : ''} for exact match`
            ) : null
          ) : (
            localValue.length < 4 ? (
              `${4 - localValue.length} more character${4 - localValue.length > 1 ? 's' : ''} to search`
            ) : null
          )}
        </Text>
      )}

      {/* Suggestions Modal */}
      <Modal
        visible={showSuggestions && suggestions.length > 0}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuggestions(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-40 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Location</Text>
              <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.Pincode}-${item.Name}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSuggestion(item)}
                  className="px-4 py-3 border-b border-gray-100"
                >
                  <Text className="text-base font-medium text-gray-900">{item.Name}</Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {item.District}, {item.State} - {item.Pincode}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {item.BranchType} • {item.DeliveryStatus}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ZipCodeInput;
