import { API_URL } from './axios';

/**
 * Convert relative image URLs to absolute URLs for mobile app
 * Backend returns proxy URLs like "/image/..." which need to be converted to full URLs
 * 
 * @param {string|null|undefined} imageUrl - Image URL from backend
 * @returns {string|null} - Full image URL or null
 */
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative proxy URL, prepend API_URL
  if (imageUrl.startsWith('/image/') || imageUrl.startsWith('/api/image/')) {
    // Remove /api prefix if present (backend might return with or without it)
    const cleanPath = imageUrl.startsWith('/api/') ? imageUrl.substring(4) : imageUrl;
    return `${API_URL}/api${cleanPath}`;
  }
  
  // If it's any other relative URL, prepend API_URL
  if (imageUrl.startsWith('/')) {
    return `${API_URL}${imageUrl}`;
  }
  
  // If no leading slash, assume it's a path that needs /api/image/ prefix
  return `${API_URL}/api/image/${imageUrl}`;
};

/**
 * Convert array of image URLs to absolute URLs
 * @param {Array<string>} images - Array of image URLs
 * @returns {Array<string>} - Array of full image URLs
 */
export const getFullImageUrls = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(getFullImageUrl).filter(Boolean);
};

/**
 * Get product image URL (handles variants and combo products)
 * @param {Object} product - Product object
 * @param {number} variantIndex - Variant index (default 0)
 * @returns {string|null} - Full image URL or null
 */
export const getProductImageUrl = (product, variantIndex = 0) => {
  if (!product) return null;
  
  // Try to get variant image
  const variant = product.variants?.[variantIndex];
  if (variant?.variantImages?.[0]) {
    return getFullImageUrl(variant.variantImages[0]);
  }
  
  // Fallback to combo thumbnail
  if (product.type === 'combo' && product.thumbnail) {
    return getFullImageUrl(product.thumbnail);
  }
  
  // Fallback to default product image
  if (product.defaultProductImage) {
    return getFullImageUrl(product.defaultProductImage);
  }
  
  return null;
};
