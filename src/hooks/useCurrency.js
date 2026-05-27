import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../lib/axios';

// Cache key for AsyncStorage
const CURRENCY_CACHE_KEY = 'currency_cache';

// Cache duration: 5 minutes (in milliseconds)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache for faster access
let memoryCache = null;

/**
 * Custom hook to fetch and cache admin currency and country
 * Matches frontend hooks/useCurrency.ts patterns
 * 
 * @returns {string} Currency symbol (₹, $, €, etc.)
 */
export const useCurrency = () => {
  const [currencySymbol, setCurrencySymbol] = useState('₹'); // Default to INR

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Check memory cache first
        if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
          setCurrencySymbol(memoryCache.symbol);
          return;
        }

        // Check AsyncStorage cache
        const cachedData = await AsyncStorage.getItem(CURRENCY_CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            memoryCache = parsed;
            setCurrencySymbol(parsed.symbol);
            return;
          }
        }

        // Fetch from API
        const response = await axiosInstance.get('/api/auth/currency');
        
        if (response.data?.success && response.data?.data?.currency) {
          const currency = response.data.data.currency;
          const country = response.data.data.country;
          
          // Get symbol using Intl API
          let symbol = '₹';
          try {
            symbol = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            })
              .formatToParts(0)
              .find((part) => part.type === 'currency')?.value || currency;
          } catch {
            // Fallback to currency code
            symbol = currency;
          }

          // Update caches
          const cacheData = {
            symbol,
            currency,
            country,
            timestamp: Date.now(),
          };
          
          memoryCache = cacheData;
          await AsyncStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData));
          
          setCurrencySymbol(symbol);
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
        // Keep default INR symbol on error
      }
    };

    fetchCurrency();
  }, []);

  return currencySymbol;
};

/**
 * Custom hook to fetch currency data with country
 * @returns {Object} { currencySymbol: string, country: string }
 */
export const useCurrencyData = () => {
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [country, setCountry] = useState('India');

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Check memory cache first
        if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
          setCurrencySymbol(memoryCache.symbol);
          setCountry(memoryCache.country);
          return;
        }

        // Check AsyncStorage cache
        const cachedData = await AsyncStorage.getItem(CURRENCY_CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            memoryCache = parsed;
            setCurrencySymbol(parsed.symbol);
            setCountry(parsed.country);
            return;
          }
        }

        // Fetch from API
        const response = await axiosInstance.get('/api/auth/currency');
        
        if (response.data?.success && response.data?.data?.currency) {
          const currency = response.data.data.currency;
          const countryData = response.data.data.country;
          
          let symbol = '₹';
          try {
            symbol = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            })
              .formatToParts(0)
              .find((part) => part.type === 'currency')?.value || currency;
          } catch {
            symbol = currency;
          }

          const cacheData = {
            symbol,
            currency,
            country: countryData,
            timestamp: Date.now(),
          };
          
          memoryCache = cacheData;
          await AsyncStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData));
          
          setCurrencySymbol(symbol);
          setCountry(countryData);
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
      }
    };

    fetchCurrency();
  }, []);

  return { currencySymbol, country };
};

/**
 * Clear currency cache
 */
export const clearCurrencyCache = async () => {
  memoryCache = null;
  await AsyncStorage.removeItem(CURRENCY_CACHE_KEY);
};

export default useCurrency;