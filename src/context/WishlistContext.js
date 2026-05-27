import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import wishlistService from '../services/wishlistService';
import toast from '../utils/toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetch wishlist from server
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWishlistItems([]);
      setWishlistIds(new Set());
      setWishlistCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const response = await wishlistService.getWishlist(user.id);
      
      if (response.success) {
        const items = response.data || [];
        setWishlistItems(items);
        setWishlistIds(new Set(items.map(item => item.productId || item.id)));
        setWishlistCount(items.length);
      }
    } catch (error) {
      console.error('❌ Error fetching wishlist:', error);
      // Don't show error toast for initial fetch failures
      // User might not be logged in or network might be unavailable
      setWishlistItems([]);
      setWishlistIds(new Set());
      setWishlistCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Load wishlist when auth changes
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Add to wishlist
  const addToWishlist = async (product) => {
    if (!isAuthenticated || !user?.id) {
      toast.info('Login Required', 'Please login to add items to wishlist');
      return false;
    }

    // Optimistic update
    setWishlistIds(prev => new Set([...prev, product.id]));
    setWishlistCount(prev => prev + 1);

    try {
      // Prepare product data for caching in wishlist
      const productData = {
        productId: product.id,
        shortDescription: product.shortDescription,
        category: product.category,
        subCategory: product.subCategory,
        brand: product.brand,
        defaultProductImage: product.defaultProductImage || product.thumbnail,
        variants: product.variants,
        variantIndex: product.variantIndex || 0,
        variantName: product.variantName,
        variantDisplayName: product.variantDisplayName,
        variantMRP: product.variantMRP,
        variantSellingPrice: product.variantSellingPrice,
        variantStockQuantity: product.variantStockQuantity,
        variantStockStatus: product.variantStockStatus,
        variantUom: product.variantUom,
        variantUomValue: product.variantUomValue,
        discountType: product.discountType,
        variantDiscount: product.variantDiscount,
        type: product.type,
        enableVariants: product.enableVariants,
        cuttingStyles: product.cuttingStyles || [],
      };

      const response = await wishlistService.addToWishlist(user.id, product.id, productData);

      if (response.success) {
        await fetchWishlist();
        toast.success('Added to Wishlist', `${product.shortDescription} saved to wishlist`);
        return true;
      } else {
        // Revert optimistic update
        setWishlistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
        setWishlistCount(prev => prev - 1);
        toast.error('Error', response.error || 'Failed to add to wishlist');
        return false;
      }
    } catch (error) {
      // Revert optimistic update
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      setWishlistCount(prev => prev - 1);
      console.error('❌ Error adding to wishlist:', error);
      toast.error('Error', error.response?.data?.error || 'Failed to add to wishlist');
      return false;
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated || !user?.id) return false;

    // Optimistic update
    setWishlistIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    setWishlistCount(prev => Math.max(0, prev - 1));

    try {
      const response = await wishlistService.removeFromWishlist(user.id, productId);

      if (response.success) {
        await fetchWishlist();
        toast.info('Removed', 'Item removed from wishlist');
        return true;
      } else {
        // Revert optimistic update
        setWishlistIds(prev => new Set([...prev, productId]));
        setWishlistCount(prev => prev + 1);
        return false;
      }
    } catch (error) {
      // Revert optimistic update
      setWishlistIds(prev => new Set([...prev, productId]));
      setWishlistCount(prev => prev + 1);
      console.error('❌ Error removing from wishlist:', error);
      return false;
    }
  };

  // Toggle wishlist
  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      return removeFromWishlist(product.id);
    } else {
      return addToWishlist(product);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistIds.has(productId);
  };

  // Clear wishlist
  const clearWishlist = async () => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      const response = await wishlistService.clearWishlist(user.id);

      if (response.success) {
        setWishlistItems([]);
        setWishlistIds(new Set());
        setWishlistCount(0);
        toast.info('Wishlist Cleared', 'All items removed from wishlist');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error clearing wishlist:', error);
      return false;
    }
  };

  const value = useMemo(() => ({
    wishlistItems,
    wishlistCount,
    isLoading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  }), [wishlistItems, wishlistCount, isLoading, fetchWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export default WishlistContext;