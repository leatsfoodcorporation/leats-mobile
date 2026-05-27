import { memo } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { getCountryCallingCode } from 'libphonenumber-js';
import { Country } from 'country-state-city';
import { useCurrencyData } from '../../hooks/useCurrency';

const PhoneInput = memo(({
  value = '',
  onChange,
  country, // Optional: if not provided, uses admin's country
  disabled = false,
  placeholder = 'Enter 10-digit number',
  style
}) => {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { country: adminCountry } = useCurrencyData();

  // Use admin's country if no country prop provided
  const effectiveCountry = country || adminCountry || 'India';

  // Get country ISO code from country name
  const countryCode = useMemo(() => {
    if (!effectiveCountry) return 'IN';
    const allCountries = Country.getAllCountries();
    const foundCountry = allCountries.find(
      (c) => c.name.trim().toLowerCase() === effectiveCountry.trim().toLowerCase()
    );
    return foundCountry?.isoCode || 'IN';
  }, [effectiveCountry]);

  // Get current country data
  const currentCountry = useMemo(() => {
    const countryData = Country.getCountryByCode(countryCode);
    try {
      const callingCode = getCountryCallingCode(countryCode);
      return {
        code: countryCode,
        name: countryData?.name || countryCode,
        callingCode: `+${callingCode}`,
        flag: countryData?.flag || '🇮🇳',
        maxDigits: countryCode === 'IN' ? 10 : 15,
      };
    } catch {
      return {
        code: 'IN',
        name: 'India',
        callingCode: '+91',
        flag: '🇮🇳',
        maxDigits: 10,
      };
    }
  }, [countryCode]);

  // Sync external value — strip country code prefix if present
  useEffect(() => {
    if (!value) {
      setLocalValue('');
      return;
    }
    let cleaned = value.replace(/\D/g, '');
    const callingDigits = currentCountry.callingCode.replace('+', '');
    if (cleaned.startsWith(callingDigits) && cleaned.length > currentCountry.maxDigits) {
      cleaned = cleaned.slice(callingDigits.length);
    }
    cleaned = cleaned.slice(0, currentCountry.maxDigits);
    setLocalValue(cleaned);
  }, [value]);

  // Handle input — only digits, enforce max length
  const handleChange = (text) => {
    const digitsOnly = text.replace(/\D/g, '');

    let cleaned = digitsOnly;
    const callingDigits = currentCountry.callingCode.replace('+', '');
    if (cleaned.startsWith(callingDigits) && cleaned.length > currentCountry.maxDigits) {
      cleaned = cleaned.slice(callingDigits.length);
    }

    if (cleaned.length > currentCountry.maxDigits) {
      cleaned = cleaned.slice(0, currentCountry.maxDigits);
    }

    setLocalValue(cleaned);
    onChange?.(cleaned);
  };

  const isValid = localValue.length === currentCountry.maxDigits;
  const hasInput = localValue.length > 0;

  // Show loading while fetching admin country
  if (!effectiveCountry) {
    return (
      <View style={style}>
        <View style={styles.container}>
          <ActivityIndicator size="small" color="#e63946" />
          <Text style={styles.loadingText}>Loading country...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={style}>
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        hasInput && !isValid && styles.containerWarning,
        hasInput && isValid && styles.containerValid,
      ]}>
        {/* Country Code Display */}
        <View style={styles.countryCode}>
          <Text style={styles.flag}>{currentCountry.flag}</Text>
          <Text style={styles.callingCode}>
            {currentCountry.callingCode}
          </Text>
        </View>

        {/* Phone Number Input */}
        <TextInput
          value={localValue}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          keyboardType="number-pad"
          editable={!disabled}
          style={styles.input}
          placeholderTextColor="#999"
          maxLength={currentCountry.maxDigits}
        />
      </View>

      {/* Validation hint */}
      {hasInput && !isValid && (
        <Text style={styles.warningText}>
          Enter {currentCountry.maxDigits - localValue.length} more digit{currentCountry.maxDigits - localValue.length !== 1 ? 's' : ''}
        </Text>
      )}
      {hasInput && isValid && (
        <Text style={styles.validText}>Valid phone number</Text>
      )}
    </View>
  );
});

PhoneInput.displayName = 'PhoneInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  containerFocused: {
    borderColor: '#e63946',
  },
  containerWarning: {
    borderColor: '#f59e0b',
  },
  containerValid: {
    borderColor: '#10b981',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    gap: 4,
  },
  flag: {
    fontSize: 20,
  },
  callingCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    letterSpacing: 1,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  validText: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
  },
});

export default PhoneInput;
