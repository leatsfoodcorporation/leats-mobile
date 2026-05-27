import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';
import { getActiveDeliveryCharges } from '../services/deliveryChargeService';
import { calculateDeliveryFee } from '../lib/delivery-charge-utils';
import toast from '../utils/toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  // Store delivery rules so optimistic updates don't need to re-fetch
  const [deliveryRules, setDeliveryRules] = useState([]);

  // Fetch cart from server
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setCart(null);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return;
    }

    try {
      setIsLoading(true);
      // Fetch cart items and delivery charge rules in parallel
      const [response, deliveryRules] = await Promise.all([
        cartService.getCart(user.id),
        getActiveDeliveryCharges(),
      ]);
      
      if (response.success) {
        // Backend returns cart items in response.data (array)
        const items = Array.isArray(response.data) ? response.data : [];
        
        setCart(response);
        setCartItems(items);
        setDeliveryRules(deliveryRules);
        calculateTotals(items, deliveryRules);
      }
    } catch (error) {
      // Silently handle error - don't show toast for background fetch
      setCart(null);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Calculate cart totals using DeliveryCharge rules from DB
  const calculateTotals = (items, deliveryRules = []) => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => {
      const price = item.variantSellingPrice || item.variant?.variantSellingPrice || item.product?.defaultSellingPrice || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    // ✅ Use DeliveryCharge rules (same logic as frontend utility)
    const { finalDeliveryFee: deliveryCharge } = calculateDeliveryFee(total, deliveryRules, items);
    
    setCartCount(count);
    setCartTotal(total);
    
    // Update cart object with delivery charge
    setCart(prev => ({
      ...prev,
      deliveryCharge,
      discount: prev?.discount || 0,
    }));
  };

  // Load cart when auth changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to cart
  const addToCart = async (product, variantIndex = 0, cuttingStyle = null, quantity = 1) => {
    if (!isAuthenticated || !user?.id) {
      toast.info('Login Required', 'Please login to add items to cart');
      return false;
    }

    try {
      setIsLoading(true);
      
      const variant = product.variants?.[variantIndex];
      const inventoryProductId = variant?.inventoryProductId || product.id;

      const response = await cartService.addToCart({
        userId: user.id,
        inventoryProductId,
        variantIndex,
        quantity,
        selectedCuttingStyle: cuttingStyle,
      });

      if (response.success) {
        await fetchCart();
        toast.success('Added to Cart', `${product.shortDescription} added to your cart`);
        return true;
      } else {
        toast.error('Error', response.error || 'Failed to add to cart');
        return false;
      }
    } catch (error) {
      // Silently handle error - only show toast to user
      toast.error('Error', error.response?.data?.error || 'Failed to add to cart');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item quantity with optimistic updates
  const updateQuantity = async (productId, inventoryProductId, variantIndex, quantity, cuttingStyle = null) => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      if (quantity <= 0) {
        return removeFromCart(productId, inventoryProductId, variantIndex, cuttingStyle);
      }

      // Find the item to update
      const targetItem = cartItems.find(
        item => item.productId === productId && 
                item.inventoryProductId === inventoryProductId &&
                item.variantIndex === variantIndex &&
                (item.selectedCuttingStyle || null) === (cuttingStyle || null)
      );

      if (!targetItem) {
        return false;
      }

      // Store previous state for revert
      const previousItems = [...cartItems];

      // Optimistic update - update UI immediately
      const updatedItems = cartItems.map(item => {
        if (item.productId === productId && 
            item.inventoryProductId === inventoryProductId &&
            item.variantIndex === variantIndex &&
            (item.selectedCuttingStyle || null) === (cuttingStyle || null)) {
          return { ...item, quantity };
        }
        return item;
      });

      setCartItems(updatedItems);
      calculateTotals(updatedItems, deliveryRules);

      // Make API call
      const response = await cartService.updateCartItem(
        user.id,
        inventoryProductId,
        variantIndex,
        quantity,
        cuttingStyle
      );

      if (response.success) {
        // Success - keep the optimistic update, no refresh needed
        return true;
      } else {
        // Revert on error
        setCartItems(previousItems);
        calculateTotals(previousItems, deliveryRules);
        toast.error('Cannot Update', response.error || 'Failed to update quantity');
        return false;
      }
    } catch (error) {
      // Revert on error - fetch fresh data
      try {
        const refreshResponse = await cartService.getCart(user.id);
        if (refreshResponse.success) {
          const items = Array.isArray(refreshResponse.data) ? refreshResponse.data : [];
          setCartItems(items);
          calculateTotals(items, deliveryRules);
        }
      } catch (refreshError) {
        // Ignore refresh errors
      }
      
      const errorMessage = error.response?.data?.error || 'Failed to update quantity';
      toast.error('Cannot Update', errorMessage);
      return false;
    }
  };

  // Remove from cart with optimistic updates
  const removeFromCart = async (productId, inventoryProductId, variantIndex, cuttingStyle = null) => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      // Store previous state for revert
      const previousItems = [...cartItems];

      // Optimistic update - remove item from UI immediately
      const updatedItems = cartItems.filter(item => {
        const isSameProduct = item.productId === productId && 
                              item.inventoryProductId === inventoryProductId &&
                              item.variantIndex === variantIndex &&
                              (item.selectedCuttingStyle || null) === (cuttingStyle || null);
        return !isSameProduct;
      });

      setCartItems(updatedItems);
      calculateTotals(updatedItems, deliveryRules);

      // Make API call
      const response = await cartService.removeFromCart(
        user.id,
        inventoryProductId,
        variantIndex,
        cuttingStyle
      );

      if (response.success) {
        toast.info('Removed', 'Item removed from cart');
        return true;
      } else {
        // Revert on failure
        setCartItems(previousItems);
        calculateTotals(previousItems, deliveryRules);
        toast.error('Error', response.error || 'Failed to remove item');
        return false;
      }
    } catch (error) {
      // Revert on error
      const previousItems = cartItems;
      setCartItems(previousItems);
      calculateTotals(previousItems, deliveryRules);
      toast.error('Error', error.response?.data?.error || 'Failed to remove item');
      return false;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      const response = await cartService.clearCart(user.id);

      if (response.success) {
        setCart(null);
        setCartItems([]);
        setCartCount(0);
        setCartTotal(0);
        toast.info('Cart Cleared', 'All items removed from cart');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return false;
    }
  };

  // Apply coupon
  const applyCoupon = async (couponCode) => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      setIsLoading(true);
      const response = await cartService.applyCoupon(user.id, couponCode);

      if (response.success) {
        await fetchCart();
        toast.success('Coupon Applied', response.message || 'Discount applied successfully');
        return true;
      } else {
        toast.error('Invalid Coupon', response.error || 'Coupon code is invalid');
        return false;
      }
    } catch (error) {
      console.error('❌ Error applying coupon:', error);
      toast.error('Error', error.response?.data?.error || 'Failed to apply coupon');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove coupon
  const removeCoupon = async () => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      const response = await cartService.removeCoupon(user.id);

      if (response.success) {
        await fetchCart();
        toast.info('Coupon Removed', 'Discount has been removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error removing coupon:', error);
      return false;
    }
  };

  // Get item quantity by product and variant
  const getItemQuantity = (productId, inventoryProductId, variantIndex = 0, cuttingStyle = null) => {
    const item = cartItems.find(item => 
      item.productId === productId && 
      item.inventoryProductId === inventoryProductId &&
      item.variantIndex === variantIndex &&
      (cuttingStyle ? item.selectedCuttingStyle === cuttingStyle : true)
    );
    return item?.quantity || 0;
  };

  // Check if item is in cart
  const isInCart = (productId, inventoryProductId, variantIndex = 0) => {
    return cartItems.some(item => 
      item.productId === productId && 
      item.inventoryProductId === inventoryProductId &&
      item.variantIndex === variantIndex
    );
  };

  const value = useMemo(() => ({
    cart,
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    getItemQuantity,
    isInCart,
  }), [cart, cartItems, cartCount, cartTotal, isLoading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon, getItemQuantity, isInCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;