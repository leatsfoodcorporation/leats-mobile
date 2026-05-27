import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkPincodeServiceability, getAvailableCountries } from '../services/deliveryZoneService';

const LocationContext = createContext();

const LOCATION_STORAGE_KEY = '@delivery_location';

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('India');

  /* Load saved location from AsyncStorage */
  useEffect(() => {
    loadSavedLocation();
    fetchAvailableCountries();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        setLocation(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error('Failed to load saved location:', error);
    }
  };

  const fetchAvailableCountries = async () => {
    try {
      const countries = await getAvailableCountries();
      setAvailableCountries(countries);
      if (countries.length > 0 && !selectedCountry) {
        setSelectedCountry(countries[0]);
      }
    } catch (error) {
      console.error('Failed to fetch available countries:', error);
    }
  };

  const checkPincode = useCallback(async (pincode, country = selectedCountry, city = null, state = null) => {
    setIsLoading(true);
    try {
      const result = await checkPincodeServiceability(pincode, country, city, state);
      return result;
    } catch (error) {
      console.error('Pincode check error:', error);
      return {
        success: false,
        serviceable: false,
        message: 'Failed to check pincode',
        data: null
      };
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry]);

  const saveLocation = useCallback(async (locationData) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
      setLocation(locationData);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  }, []);

  const clearLocation = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      setLocation(null);
    } catch (error) {
      console.error('Failed to clear location:', error);
    }
  }, []);

  const value = useMemo(() => ({
    location,
    isModalOpen,
    setIsModalOpen,
    checkPincode,
    saveLocation,
    clearLocation,
    availableCountries,
    selectedCountry,
    setSelectedCountry,
    isLoading,
  }), [location, isModalOpen, checkPincode, saveLocation, clearLocation, availableCountries, selectedCountry, isLoading]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
