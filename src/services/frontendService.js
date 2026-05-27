import axiosInstance from '../lib/axios';

/**
 * Frontend Service
 * Handles all frontend-specific API calls (matching web frontend exactly)
 */

/**
 * Get all categories with subcategories
 */
export const getCategories = async () => {
  try {
    const response = await axiosInstance.get('/api/online/frontend/categories');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get category by identifier (ID or slug)
 */
export const getCategoryByIdentifier = async (identifier) => {
  try {
    const response = await axiosInstance.get(`/api/online/frontend/categories/${identifier}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    return { success: false, data: null };
  }
};

/**
 * Get subcategories by category
 */
export const getSubcategories = async (categoryId) => {
  try {
    const response = await axiosInstance.get('/api/online/frontend/subcategories', {
      params: { category: categoryId }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching subcategories:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get all products with filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page  
 * @param {string} params.search - Search query
 * @param {string} params.category - Category filter
 * @param {string} params.subCategory - Subcategory filter
 * @param {string} params.brand - Brand filter
 * @param {number} params.minPrice - Minimum price
 * @param {number} params.maxPrice - Maximum price
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @param {string} params.badge - Badge filter
 * @param {string} params.type - Product type (regular/combo)
 */
export const getProducts = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/online/frontend/products', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return { success: false, data: [], pagination: null };
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/online/frontend/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    return { success: false, data: null };
  }
};

/**
 * Get homepage products by badge
 * @param {Object} params
 * @param {string} params.badge - Badge name
 * @param {string} params.category - Category filter
 * @param {number} params.limit - Number of products
 */
export const getHomepageProducts = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/online/frontend/homepage-products', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching homepage products:', error);
    return { success: false, data: [], count: 0 };
  }
};

/**
 * Get combo products for homepage
 */
export const getComboHomepageProducts = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/online/frontend/combo-homepage', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching combo products:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get frequently bought together products
 */
export const getFrequentlyBoughtTogether = async (productId) => {
  try {
    const response = await axiosInstance.get(`/api/online/frontend/products/${productId}/frequently-bought-together`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching frequently bought together:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get homepage badges (sorted by sortOrder)
 */
export const getHomepageBadges = async () => {
  try {
    const response = await axiosInstance.get('/api/online/badges/homepage');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching homepage badges:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get banners
 */
export const getBanners = async () => {
  try {
    const response = await axiosInstance.get('/api/web/banners');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching banners:', error);
    return { success: false, data: [] };
  }
};

/**
 * Search products
 */
export const searchProducts = async (query, limit = 10) => {
  try {
    const response = await axiosInstance.get('/api/online/frontend/products', {
      params: { search: query, limit, page: 1 }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error searching products:', error);
    return { success: false, data: [], pagination: null };
  }
};

export default {
  getCategories,
  getCategoryByIdentifier,
  getSubcategories,
  getProducts,
  getProductById,
  getHomepageProducts,
  getComboHomepageProducts,
  getFrequentlyBoughtTogether,
  getHomepageBadges,
  getBanners,
  searchProducts,
};