import axiosInstance from '../lib/axios';

/**
 * Product Service
 * Handles all product-related API calls
 */
const productService = {
  /**
   * Get all products with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.category - Category filter
   * @param {string} params.search - Search query
   * @param {string} params.sort - Sort option
   * @returns {Promise} Products list
   */
  getProducts: async (params = {}) => {
    const response = await axiosInstance.get('/api/online/products', { params });
    return response.data;
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise} Product details
   */
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/api/online/products/${id}`);
    return response.data;
  },

  /**
   * Get featured products
   * @returns {Promise} Featured products list
   */
  getFeaturedProducts: async () => {
    const response = await axiosInstance.get('/api/online/products/featured');
    return response.data;
  },

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} Products list
   */
  getProductsByCategory: async (categoryId, params = {}) => {
    const response = await axiosInstance.get(`/api/online/products/category/${categoryId}`, { params });
    return response.data;
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} params - Additional filters
   * @returns {Promise} Search results
   */
  searchProducts: async (query, params = {}) => {
    const response = await axiosInstance.get('/api/online/products/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },
};

export default productService;