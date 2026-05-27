/**
 * URL slug utilities for mobile app
 * Matches frontend lib/slugify.ts patterns
 */

/**
 * Generate SEO-friendly URL slug from product details
 * Example: "Samsung Galaxy S21 5G 128GB Black" -> "samsung-galaxy-s21-5g-128gb-black"
 */
export const generateProductSlug = (product) => {
  // Combine brand and description for the slug
  const text = `${product.brand || ""} ${product.shortDescription || ""}`.trim();
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length to 100 characters
};

/**
 * Generate product navigation params for expo-router
 */
export const generateProductParams = (product, variantIndex = 0) => {
  const variant = product.variants?.[variantIndex];
  
  return {
    productId: product.id,
    variantIndex: variantIndex.toString(),
    slug: generateProductSlug(product),
    inventoryProductId: variant?.inventoryProductId || '',
  };
};

/**
 * Generate SEO-friendly URL slug from category name
 * Example: "Fruits & Vegetables" -> "fruits-vegetables"
 */
export const generateCategorySlug = (categoryName) => {
  if (!categoryName) return '';
  
  return categoryName
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length to 100 characters
};

/**
 * Generate category navigation params for expo-router
 */
export const generateCategoryParams = (category) => {
  return {
    categoryId: category.id,
    categoryName: category.name,
    slug: generateCategorySlug(category.name),
  };
};

export default {
  generateProductSlug,
  generateProductParams,
  generateCategorySlug,
  generateCategoryParams,
};