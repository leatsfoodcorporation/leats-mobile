/**
 * Utility functions for calculating and displaying product discounts
 * Matches frontend lib/discount-utils.ts
 */

/**
 * Calculate discount information for a product variant
 * @param {number} mrp - Maximum Retail Price
 * @param {number} sellingPrice - Actual selling price
 * @param {string} discountType - Type of discount ("percent" or "flat")
 * @param {number} discountValue - Discount value (percentage or flat amount)
 * @param {string} currencySymbol - Currency symbol (default: ₹)
 * @returns {Object} DiscountInfo object with calculated values
 */
export const calculateDiscount = (
  mrp,
  sellingPrice,
  discountType,
  discountValue,
  currencySymbol = '₹'
) => {
  // Calculate actual discount amount
  const discountAmount = mrp - sellingPrice;
  
  // Calculate percentage
  const discountPercentage = mrp > 0 ? Math.round((discountAmount / mrp) * 100) : 0;
  
  // Determine the type - normalize to lowercase and check
  const normalizedType = discountType?.toLowerCase();
  const isFlatDiscount = normalizedType === 'flat';
  
  // For display, use the configured discount value if available
  let displayText = '';
  
  if (isFlatDiscount && discountValue && discountValue > 0) {
    // Flat discount - show the flat amount with currency symbol
    displayText = `${currencySymbol}${discountValue} OFF`;
  } else if (discountPercentage > 0) {
    // Percentage discount - show the calculated percentage
    displayText = `${discountPercentage}% OFF`;
  }
  
  return {
    amount: discountAmount,
    percentage: discountPercentage,
    type: isFlatDiscount ? 'flat' : 'percentage',
    displayText,
  };
};

/**
 * Get discount badge text for a product
 * @param {Object} product - Product object
 * @param {number} variantIndex - Index of the variant (optional)
 * @param {string} currencySymbol - Currency symbol (default: ₹)
 * @returns {string} Discount display text or empty string
 */
export const getDiscountBadge = (product, variantIndex = 0, currencySymbol = '₹') => {
  const variant = product.variants?.[variantIndex];
  const mrp = variant?.variantMRP || product.defaultMRP;
  const price = variant?.variantSellingPrice || product.defaultSellingPrice;
  
  // Use variant-level discount if available, otherwise use product-level
  const discountType = variant?.discountType || product.discountType;
  const discountValue = variant?.variantDiscount || product.defaultDiscountValue;
  
  const discountInfo = calculateDiscount(mrp, price, discountType, discountValue, currencySymbol);
  
  return discountInfo.displayText;
};

/**
 * Check if product has a discount
 */
export const hasDiscount = (product, variantIndex = 0) => {
  const variant = product.variants?.[variantIndex];
  const mrp = variant?.variantMRP || product.defaultMRP;
  const price = variant?.variantSellingPrice || product.defaultSellingPrice;
  
  return mrp > price;
};

/**
 * Get savings amount
 */
export const getSavingsAmount = (product, variantIndex = 0, quantity = 1) => {
  const variant = product.variants?.[variantIndex];
  const mrp = variant?.variantMRP || product.defaultMRP;
  const price = variant?.variantSellingPrice || product.defaultSellingPrice;
  
  return (mrp - price) * quantity;
};

export default {
  calculateDiscount,
  getDiscountBadge,
  hasDiscount,
  getSavingsAmount,
};