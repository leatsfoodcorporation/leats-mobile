import { memo } from 'react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country, State, City } from 'country-state-city';
import { useCurrencyData } from '../../hooks/useCurrency';

const CountryStateCitySelect = memo(({
  value = { country: '', state: '', city: '' },
  onChange,
  required = false,
  showLabels = true,
  countryLabel = 'Country',
  stateLabel = 'State',
  cityLabel = 'City',
  disabled = false,
  countryDisabled = false, // New prop to lock country selection
}) => {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch admin's default country
  const { country: adminCountry } = useCurrencyData();
  const hasAutoFilledRef = useRef(false);

  // Get all countries
  const countries = useMemo(() => Country.getAllCountries(), []);
  
  // Auto-fill admin's country if no country is selected
  useEffect(() => {
    if (
      !hasAutoFilledRef.current &&
      !value.country &&
      adminCountry &&
      countries.length > 0
    ) {
      const foundCountry = countries.find(
        (c) => c.name.trim().toLowerCase() === adminCountry.trim().toLowerCase()
      );
      
      if (foundCountry) {
        console.log('Auto-filling admin country:', foundCountry.name);
        hasAutoFilledRef.current = true;
        onChange?.({
          country: foundCountry.name,
          state: '',
          city: '',
        });
      }
    }
  }, [adminCountry, countries, value.country, onChange]);

  // Get selected country
  const selectedCountry = useMemo(() => {
    return countries.find(c => c.name === value.country);
  }, [value.country, countries]);

  // Get states for selected country
  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode);
  }, [selectedCountry]);

  // Get selected state
  const selectedState = useMemo(() => {
    return states.find(s => s.name === value.state);
  }, [value.state, states]);

  // Get cities for selected state
  const cities = useMemo(() => {
    if (!selectedCountry || !selectedState) return [];
    return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
  }, [selectedCountry, selectedState]);

  // Filter items based on search
  const getFilteredItems = (items, type) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(query));
  };

  const filteredCountries = useMemo(() => getFilteredItems(countries, 'country'), [countries, searchQuery]);
  const filteredStates = useMemo(() => getFilteredItems(states, 'state'), [states, searchQuery]);
  const filteredCities = useMemo(() => getFilteredItems(cities, 'city'), [cities, searchQuery]);

  // Handle country selection
  const handleSelectCountry = (country) => {
    onChange?.({
      country: country.name,
      state: '',
      city: '',
    });
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  // Handle state selection
  const handleSelectState = (state) => {
    onChange?.({
      ...value,
      state: state.name,
      city: '',
    });
    setShowStatePicker(false);
    setSearchQuery('');
  };

  // Handle city selection
  const handleSelectCity = (city) => {
    onChange?.({
      ...value,
      city: city.name,
    });
    setShowCityPicker(false);
    setSearchQuery('');
  };

  const renderPicker = (items, onSelect, selectedValue, placeholder) => (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowCountryPicker(false);
        setShowStatePicker(false);
        setShowCityPicker(false);
        setSearchQuery('');
      }}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
            <Text className="text-lg font-semibold">{placeholder}</Text>
            <TouchableOpacity onPress={() => {
              setShowCountryPicker(false);
              setShowStatePicker(false);
              setShowCityPicker(false);
              setSearchQuery('');
            }}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-4 py-3 border-b border-gray-200">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="flex-1 ml-2 text-base"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* List */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.isoCode || item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100"
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    {item.name}
                  </Text>
                  {item.isoCode && (
                    <Text className="text-sm text-gray-500">{item.isoCode}</Text>
                  )}
                </View>
                {item.name === selectedValue && (
                  <Ionicons name="checkmark" size={24} color="#e63946" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500">No items found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="gap-4">
      {/* Country Selector */}
      <View>
        {showLabels && (
          <Text className="text-sm font-medium text-gray-700 mb-2">
            {countryLabel} {required && <Text className="text-red-500">*</Text>}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => !disabled && !countryDisabled && setShowCountryPicker(true)}
          disabled={disabled || countryDisabled}
          className={`flex-row items-center justify-between border rounded-lg px-3 py-3 ${
            disabled || countryDisabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={value.country ? 'text-base text-gray-900' : 'text-base text-gray-400'}>
            {value.country || `Select ${countryLabel.toLowerCase()}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={disabled || countryDisabled ? '#ccc' : '#666'} />
        </TouchableOpacity>
        {countryDisabled && value.country && (
          <Text className="text-xs text-gray-500 mt-1">
            📍 Country locked to admin's default
          </Text>
        )}
      </View>

      {/* State Selector - Always visible */}
      <View>
        {showLabels && (
          <Text className="text-sm font-medium text-gray-700 mb-2">
            {stateLabel} {required && <Text className="text-red-500">*</Text>}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => !disabled && selectedCountry && setShowStatePicker(true)}
          disabled={disabled || !selectedCountry}
          className={`flex-row items-center justify-between border rounded-lg px-3 py-3 ${
            disabled || !selectedCountry ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={value.state ? 'text-base text-gray-900' : 'text-base text-gray-400'}>
            {value.state || `Select ${stateLabel.toLowerCase()}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={disabled || !selectedCountry ? '#ccc' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* City Selector - Always visible */}
      <View>
        {showLabels && (
          <Text className="text-sm font-medium text-gray-700 mb-2">
            {cityLabel} {required && <Text className="text-red-500">*</Text>}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => !disabled && selectedState && setShowCityPicker(true)}
          disabled={disabled || !selectedState}
          className={`flex-row items-center justify-between border rounded-lg px-3 py-3 ${
            disabled || !selectedState ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={value.city ? 'text-base text-gray-900' : 'text-base text-gray-400'}>
            {value.city || `Select ${cityLabel.toLowerCase()}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={disabled || !selectedState ? '#ccc' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {showCountryPicker && renderPicker(filteredCountries, handleSelectCountry, value.country, `Select ${countryLabel}`)}
      {showStatePicker && renderPicker(filteredStates, handleSelectState, value.state, `Select ${stateLabel}`)}
      {showCityPicker && renderPicker(filteredCities, handleSelectCity, value.city, `Select ${cityLabel}`)}
    </View>
  );
});

CountryStateCitySelect.displayName = 'CountryStateCitySelect';

export default CountryStateCitySelect;
