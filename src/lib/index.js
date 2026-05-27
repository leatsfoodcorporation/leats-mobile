// Axios instance
export { default as axiosInstance, API_URL } from './axios';

// Currency utilities
export { 
  DEFAULT_CURRENCY,
  getCurrencySymbol,
  formatCurrency,
  formatIndianNumber,
  parsePrice,
} from './currency';

// Discount utilities
export {
  calculateDiscount,
  getDiscountBadge,
  hasDiscount,
  getSavingsAmount,
} from './discount-utils';

// Slugify utilities
export {
  generateProductSlug,
  generateProductParams,
  generateCategorySlug,
  generateCategoryParams,
} from './slugify';