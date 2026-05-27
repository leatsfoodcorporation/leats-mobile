import axiosInstance from '../lib/axios';

/**
 * Get all categories with subcategories
 */
export const getCategories = async () => {
  try {
    const response = await axiosInstance.get('/api/online/category-subcategory');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get category by ID with subcategories
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/api/online/category-subcategory/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    throw error;
  }
};

/**
 * Get subcategories by category ID
 */
export const getSubcategories = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/api/online/category-subcategory/${categoryId}/subcategories`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching subcategories:', error);
    throw error;
  }
};

// Default export for backward compatibility
const categoryService = {
  getCategories,
  getCategoryById,
  getSubcategories,
};

export default categoryService;