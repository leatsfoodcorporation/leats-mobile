/**
 * Currency utilities for mobile app
 * Matches frontend lib/currency.ts patterns
 */

export const DEFAULT_CURRENCY = 'INR';

// Currency symbol mapping
const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  AED: 'د.إ',
  SAR: '﷼',
};

/**
 * Get currency symbol by code
 */
export const getCurrencySymbol = (currencyCode = DEFAULT_CURRENCY) => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

/**
 * Format amount with currency
 */
export const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY, options = {}) => {
  const { showSymbol = true, precision = 0 } = options;
  
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = formatIndianNumber(amount, precision);
  
  return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
};

/**
 * Format number in Indian style (with lakhs and crores)
 */
export const formatIndianNumber = (amount, precision = 0) => {
  if (amount === null || amount === undefined) return '0';
  
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  
  const parts = absoluteAmount.toFixed(precision).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part with Indian comma placement
  let formattedInteger = '';
  const reversed = integerPart.split('').reverse();
  
  for (let i = 0; i < reversed.length; i++) {
    if (i === 3) {
      formattedInteger = ',' + formattedInteger;
    } else if (i > 3 && (i - 3) % 2 === 0) {
      formattedInteger = ',' + formattedInteger;
    }
    formattedInteger = reversed[i] + formattedInteger;
  }
  
  const prefix = isNegative ? '-' : '';
  
  // Add decimal part if precision > 0
  if (precision > 0 && decimalPart) {
    return `${prefix}${formattedInteger}.${decimalPart}`;
  }
  
  return `${prefix}${formattedInteger}`;
};

/**
 * Parse price string to number
 */
export const parsePrice = (priceString) => {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Remove currency symbols and commas
  const cleaned = priceString.toString().replace(/[₹$€£¥,\s]/g, '');
  return parseFloat(cleaned) || 0;
};

export default {
  DEFAULT_CURRENCY,
  getCurrencySymbol,
  formatCurrency,
  formatIndianNumber,
  parsePrice,
};