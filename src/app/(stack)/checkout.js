import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useAuthCheck } from '../../hooks/useAuthProtection';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import LoginRequired from '../../components/LoginRequired';
import addressService from '../../services/addressService';
import axiosInstance from '../../lib/axios';
import orderService from '../../services/orderService';
import { validateCoupon } from '../../services/couponService';
import { getActiveDeliveryCharges } from '../../services/deliveryChargeService';
import { calculateDeliveryFee } from '../../lib/delivery-charge-utils';
import { hasStockIssues } from '../../lib/cart-utils';
import { getFullImageUrl } from '../../lib/image-utils';
import { getProductById } from '../../services/frontendService';
import orderScheduleService from '../../services/orderScheduleService';
import toast from '../../utils/toast';

const PRIMARY_COLOR = '#e63946';

const CheckoutScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Buy Now state
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(false);

  // Determine if this is a buy now checkout
  const isBuyNow = !!params.buyNow;

  // Get effective cart items (buy now item or regular cart items)
  const effectiveCartItems = isBuyNow && buyNowProduct ? [buyNowProduct] : cartItems;
  
  // Calculate effective cart total
  const effectiveCartTotal = effectiveCartItems.reduce((total, item) => {
    const price = item.variant?.variantSellingPrice || item.variantSellingPrice || 0;
    const quantity = item.quantity || 1;
    return total + (price * quantity);
  }, 0);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCODAvailable, setIsCODAvailable] = useState(true);
  const [codUnavailableProducts, setCodUnavailableProducts] = useState([]);
  const [showCODModal, setShowCODModal] = useState(false);
  const [activePaymentGateways, setActivePaymentGateways] = useState([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [deliveryChargeRules, setDeliveryChargeRules] = useState([]);

  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayData, setRazorpayData] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Scheduling state
  const [scheduleSettings, setScheduleSettings] = useState(null);
  const [selectedDate, setSelectedDate] = useState('Today'); // 'Today', 'Tomorrow'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [dateOptions, setDateOptions] = useState([]);

  // Serviceability state
  const [addressServiceability, setAddressServiceability] = useState({}); // { [addressId]: { serviceable: boolean, loading: boolean } }

  // Date formatter helper
  const getFormattedDate = (label) => {
    const today = new Date();
    if (label === 'Today') {
      return today.toISOString().split('T')[0];
    }
    if (label === 'Tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return label;
  };

  // Helper to show serviceability badge
  const renderServiceabilityBadge = (addressId) => {
    const status = addressServiceability[addressId];
    if (!status || status.loading) {
      return (
        <View className="bg-gray-100 px-2 py-0.5 rounded ml-2 shadow-sm">
          <ActivityIndicator size="small" color="#666" style={{ transform: [{ scale: 0.6 }] }} />
        </View>
      );
    }

    return (
      <View className={`px-2 py-0.5 rounded ml-2 shadow-sm ${status.serviceable ? 'bg-green-100' : 'bg-red-100'}`}>
        <Text className={`text-[10px] font-bold ${status.serviceable ? 'text-green-700' : 'text-red-700'}`}>
          {status.serviceable ? 'SERVICEABLE' : 'NOT SERVICEABLE'}
        </Text>
      </View>
    );
  };

  // Fetch active payment gateways
  // const fetchActivePaymentGateways = async () => {
  //   try {
  //     const response = await axiosInstance.get('/api/payment-gateway/active');
      
  //     if (response.data.success) {
  //       const activeGatewayNames = response.data.data.map((g) => g.name);
  //       setActivePaymentGateways(activeGatewayNames);
  //       console.log('Active payment gateways:', activeGatewayNames);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching active payment gateways:', error);
  //     setActivePaymentGateways([]);
  //   }
  // };

  // Fetch addresses on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDeliveryCharges();
      fetchAvailableCoupons();
      fetchActivePaymentGateways();
      checkCODAvailability();
      fetchScheduleSettings();
    }
  }, [isAuthenticated, user?.id]);

  // Fetch buy now product if buyNow param exists
  useEffect(() => {
    if (isBuyNow && params.buyNow) {
      fetchBuyNowProduct();
    }
  }, [isBuyNow, params.buyNow]);

  // Fetch buy now product
  const fetchBuyNowProduct = async () => {
    try {
      setLoadingBuyNow(true);
      const buyNowData = JSON.parse(params.buyNow);
      setBuyNowItem(buyNowData);

      // Fetch product details
      const response = await getProductById(buyNowData.productId);
      
      if (response.success && response.data) {
        const product = response.data;
        const variant = product.variants[buyNowData.variantIndex];

        // Create cart-like item structure matching cart context format
        const cartItem = {
          productId: product.id,
          inventoryProductId: buyNowData.inventoryProductId,
          variantIndex: buyNowData.variantIndex,
          cuttingStyle: buyNowData.cuttingStyle,
          quantity: buyNowData.quantity || 1,
          // Flatten the structure to match cart items
          id: product.id,
          shortDescription: product.shortDescription,
          displayName: variant.displayName,
          brand: product.brand,
          category: product.category,
          categoryId: product.categoryId,
          type: product.type,
          variantName: variant.variantName,
          variantImage: variant.variantImages?.[0],
          variantSellingPrice: variant.variantSellingPrice,
          variantMRP: variant.variantMRP,
          variantUom: variant.variantUom,
          variantUomValue: variant.variantUomValue,
          variantStockQuantity: variant.variantStockQuantity,
          variantStockStatus: variant.variantStockStatus,
        };

        setBuyNowProduct(cartItem);
      } else {
        toast.error('Error', 'Failed to load product');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching buy now product:', error);
      toast.error('Error', 'Failed to load product');
      router.back();
    } finally {
      setLoadingBuyNow(false);
    }
  };

  // Refetch addresses when screen comes into focus (after adding new address)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchAddresses();
      }
    }, [isAuthenticated, user?.id])
  );

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      
      {/* Fetch saved addresses and user profile in parallel */}
      const [addressResponse, userResponse] = await Promise.all([
        addressService.getAddresses(user.id),
        axiosInstance.get('/api/auth/me'),
      ]);

      const data = Array.isArray(addressResponse) ? addressResponse : (addressResponse.data || []);
      const allAddresses = [...data];

      // Add user profile address if it has complete address information
      if (userResponse.data.success && userResponse.data.data) {
        const userData = userResponse.data.data;

        // Check if user has complete address information
        if (
          userData.address &&
          userData.city &&
          userData.state &&
          userData.zipCode &&
          userData.country
        ) {
          const profileAddress = {
            id: 'profile-address',
            customerId: 'profile',
            name: userData.name,
            phone: userData.phoneNumber || '',
            alternatePhone: '',
            addressLine1: userData.address,
            addressLine2: '',
            landmark: '',
            city: userData.city,
            state: userData.state,
            pincode: userData.zipCode,
            country: userData.country,
            addressType: 'home',
            isDefault: false,
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: userData.updatedAt || new Date().toISOString(),
          };

          // Check if this address already exists in saved addresses
          const isDuplicate = data.some(
            (addr) =>
              addr.addressLine1.toLowerCase().trim() ===
                userData.address.toLowerCase().trim() &&
              addr.city.toLowerCase().trim() ===
                userData.city.toLowerCase().trim() &&
              addr.pincode === userData.zipCode
          );

          // Only add if it's not a duplicate
          if (!isDuplicate) {
            allAddresses.unshift(profileAddress);
          }
        }
      }

      setAddresses(allAddresses);
      
      // Auto-select first address (profile or default)
      const defaultAddr = allAddresses.find(addr => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else if (allAddresses.length > 0) {
        setSelectedAddress(allAddresses[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const checkAddressServiceability = async (address) => {
    if (!address?.pincode || addressServiceability[address.id]) return;
    
    setAddressServiceability(prev => ({
      ...prev,
      [address.id]: { loading: true }
    }));

    try {
      const result = await addressService.checkServiceability(address.pincode || address.zipCode);
      setAddressServiceability(prev => ({
        ...prev,
        [address.id]: { 
          loading: false, 
          serviceable: result.serviceable 
        }
      }));
    } catch (error) {
      setAddressServiceability(prev => ({
        ...prev,
        [address.id]: { loading: false, serviceable: false }
      }));
    }
  };

  // Effect to re-check serviceability when addresses change
  useEffect(() => {
    if (addresses.length > 0) {
      addresses.forEach(addr => {
        checkAddressServiceability(addr);
      });
    }
  }, [addresses]);

  // Fetch delivery charge rules
  const fetchDeliveryCharges = async () => {
    try {
      const data = await getActiveDeliveryCharges();
      setDeliveryChargeRules(data);
    } catch (error) {
      console.error('Failed to fetch delivery charges:', error);
    }
  };

  // Fetch active payment gateways
  const fetchActivePaymentGateways = async () => {
    try {
      const response = await axiosInstance.get('/api/payment-gateway/active');
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const activeGatewayNames = response.data.data.map((g) => g.name);
        setActivePaymentGateways(activeGatewayNames);
        console.log('Active payment gateways:', activeGatewayNames);
      } else {
        // Fallback to COD if empty response
        setActivePaymentGateways(['cod']);
      }
    } catch (error) {
      console.error('Error fetching active payment gateways:', error);
      // Fallback to COD on error
      setActivePaymentGateways(['cod']);
    }
  };

  // Fetch order scheduling settings
  const fetchScheduleSettings = async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingSchedule(true);
      const response = await orderScheduleService.getActiveSettings();
      if (response.success && response.data) {
        const newData = response.data;
        const oldWindow = scheduleSettings?.windowStatus?.activeWindow;
        const newWindow = newData.windowStatus?.activeWindow;

        setScheduleSettings(newData);
        
        // Filter date options based on active window
        const options = [{ label: 'Today', value: 'Today' }, { label: 'Tomorrow', value: 'Tomorrow' }];
        const filteredOptions = newWindow === 'PRE_ORDER' 
          ? options.filter(opt => opt.value !== 'Today')
          : options;
          
        setDateOptions(filteredOptions);
        
        // Auto-switch logic: if Today was selected but is no longer available
        if (selectedDate === 'Today' && newWindow === 'PRE_ORDER') {
          setSelectedDate('Tomorrow');
          setIsScheduled(true);
          toast.info('Order window closed', 'The Live Order window has closed. Delivery date shifted to Tomorrow.');
        } else if (!selectedDate && filteredOptions.length > 0) {
          // Initial load default date
          const defaultDate = filteredOptions[0].value;
          setSelectedDate(defaultDate);
          if (defaultDate === 'Tomorrow') {
            setIsScheduled(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching schedule settings:', error);
    } finally {
      if (!isSilent) setLoadingSchedule(false);
    }
  };

  // Background polling for order schedule (every 30s)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    const interval = setInterval(() => {
      fetchScheduleSettings(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, selectedDate, scheduleSettings?.windowStatus?.activeWindow]);

  // Re-check COD when cart items load/change (important for Buy Now flow)
  useEffect(() => {
    if (isAuthenticated && user?.id && effectiveCartItems.length > 0) {
      checkCODAvailability();
    }
  }, [isAuthenticated, user?.id, effectiveCartItems]);

  // Auto-select first available payment method
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      const firstAvailable = paymentMethods.find(m => {
        const isCOD = m.id === 'cod';
        const isDisabled = isCOD && !isCODAvailable;
        return !isDisabled;
      });
      if (firstAvailable) {
        setSelectedPaymentMethod(firstAvailable.id);
      } else {
        setSelectedPaymentMethod(paymentMethods[0].id);
      }
    }
  }, [paymentMethods, isCODAvailable, selectedPaymentMethod]);

  // Auto-select first delivery slot when Tomorrow is selected
  useEffect(() => {
    if (selectedDate === 'Tomorrow' && scheduleSettings?.deliverySlots?.length > 0 && !selectedSlot) {
      setSelectedSlot(scheduleSettings.deliverySlots[0]);
    }
  }, [selectedDate, scheduleSettings, selectedSlot]);

  // Check COD availability
  const checkCODAvailability = async () => {
    if (!user?.id) return;
    
    if (effectiveCartItems.length === 0) {
      setIsCODAvailable(true);
      return;
    }
    
    try {
      const response = await axiosInstance.get(
        '/api/online/orders/check-cod-availability',
        { params: { userId: user.id } }
      );
      
      if (response.data.success) {
        setIsCODAvailable(response.data.isCODAvailable);
        if (!response.data.isCODAvailable && response.data.unavailableProducts) {
          setCodUnavailableProducts(response.data.unavailableProducts);
        }
      }
    } catch (error) {
      console.error('Error checking COD availability:', error);
      setIsCODAvailable(true);
    }
  };

  // Fetch available coupons
  const fetchAvailableCoupons = async () => {
    if (!user?.id || effectiveCartTotal <= 0) return;

    try {
      const response = await axiosInstance.get('/api/online/coupons/available', {
        params: {
          userId: user.id,
          orderValue: effectiveCartTotal,
        },
      });

      if (response.data.success) {
        setAvailableCoupons(response.data.data.coupons);
        setIsFirstTimeUser(response.data.data.isFirstTimeUser);
      }
    } catch (error) {
      console.error('Error fetching available coupons:', error);
    }
  };

  // Apply coupon from available coupons list (direct apply)
  const handleApplyCouponFromList = async (code) => {
    if (!user?.id) {
      toast.error('Please login to apply coupon');
      return;
    }

    try {
      setIsValidatingCoupon(true);

      // Get unique category IDs from cart items
      const categoryIds = Array.from(
        new Set(effectiveCartItems.map(item => item.categoryId).filter(id => !!id))
      );

      const requestData = {
        code: code.toUpperCase(),
        userId: user.id,
        orderValue: effectiveCartTotal,
        categories: categoryIds,
      };

      const response = await axiosInstance.post(
        '/api/online/coupons/validate',
        requestData
      );

      if (response.data.success) {
        setAppliedCoupon({
          code: response.data.data.code,
          discountAmount: response.data.data.discountAmount,
        });
        setShowAvailableCoupons(false);
        toast.success(`Coupon applied! You saved ₹${response.data.data.discountAmount.toFixed(2)}`);
      } else {
        toast.error(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to apply coupon');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Apply coupon from manual input
  const handleApplyCoupon = async () => {
    if (!couponCode || !couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (!user?.id) {
      setCouponError('Please login to apply coupon');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponError('');

      // Get unique category IDs from cart items
      const categoryIds = Array.from(
        new Set(effectiveCartItems.map(item => item.categoryId).filter(id => !!id))
      );

      const requestData = {
        code: couponCode.toUpperCase(),
        userId: user.id,
        orderValue: effectiveCartTotal,
        categories: categoryIds,
      };

      const response = await axiosInstance.post(
        '/api/online/coupons/validate',
        requestData
      );

      if (response.data.success) {
        setAppliedCoupon({
          code: response.data.data.code,
          discountAmount: response.data.data.discountAmount,
        });
        setShowAvailableCoupons(false);
        setCouponCode('');
        toast.success(`Coupon applied! You saved ₹${response.data.data.discountAmount.toFixed(2)}`);
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
        toast.error(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setCouponError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        setCouponError('Failed to apply coupon');
        toast.error('Failed to apply coupon');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('Coupon removed');
  };

  // Handle add address navigation
  const handleAddAddress = () => {
    router.push('/add-address?returnTo=checkout');
  };

  // Calculate delivery fee
  const { finalDeliveryFee: deliveryFee } = calculateDeliveryFee(
    effectiveCartTotal,
    deliveryChargeRules,
    effectiveCartItems
  );

  // Calculate totals
  const subtotal = effectiveCartTotal;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = subtotal - discount + deliveryFee;

  // Handle Razorpay WebView messages
  const handleRazorpayMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'PAYMENT_SUCCESS') {
        setIsVerifyingPayment(true);
        toast.info('Verifying payment...');
        
        try {
          // Verify payment
          await orderService.verifyPayment({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
          });

          // Confirm order
          await orderService.confirmOrder({
            userId: user.id,
            deliveryAddressId: selectedAddress.id,
            paymentMethod: 'razorpay',
            couponCode: appliedCoupon?.code || null,
            orderNumber: razorpayData.orderNumber,
            paymentId: data.razorpay_payment_id,
            razorpayOrderId: data.razorpay_order_id,
            orderType: scheduleSettings?.windowStatus?.activeWindow || 'LIVE',
            scheduledDate: getFormattedDate(selectedDate),
            scheduledSlot: (selectedDate === 'Today' && scheduleSettings?.windowStatus?.activeWindow === 'LIVE') ? 'LIVE' : selectedSlot,
            isScheduled: selectedDate === 'Tomorrow' || (selectedDate === 'Today' && !!selectedSlot),
            isBuyNow: isBuyNow,
            buyNowItem: isBuyNow ? buyNowItem : null,
          });

          if (!isBuyNow) {
            clearCart();
          }
          setShowRazorpayModal(false);
          setIsVerifyingPayment(false);
          toast.success('Payment successful! Order placed.');
          router.replace({
            pathname: '/order-success',
            params: { orderId: razorpayData.orderNumber }
          });
        } catch (error) {
          console.error('Payment verification failed:', error);
          setShowRazorpayModal(false);
          setIsVerifyingPayment(false);
          toast.error('Payment verification failed. Please contact support.');
        }
      } else if (data.type === 'PAYMENT_CANCELLED') {
        setShowRazorpayModal(false);
        setIsPlacingOrder(false);
        toast.error('Payment cancelled');
      } else if (data.type === 'PAYMENT_FAILED') {
        setShowRazorpayModal(false);
        setIsPlacingOrder(false);
        toast.error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error handling payment message:', error);
      setShowRazorpayModal(false);
      setIsPlacingOrder(false);
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Check serviceability
    const serviceability = addressServiceability[selectedAddress.id];
    if (serviceability && !serviceability.serviceable) {
      toast.error('Unserviceable Address', 'This address is not serviceable for delivery.');
      return;
    }

    // Validate stock before placing order
    if (hasStockIssues(effectiveCartItems)) {
      toast.error('Some items are out of stock or exceed available quantity');
      return;
    }

    // Mandatory slot for Tomorrow (Pre-Order) - only if slots are configured by the admin
    const hasSlots = scheduleSettings?.deliverySlots && scheduleSettings.deliverySlots.length > 0;
    if (selectedDate === 'Tomorrow' && hasSlots && !selectedSlot) {
      toast.error('Please select a delivery slot for your pre-order');
      return;
    }

    try {
      setIsPlacingOrder(true);

      // Map 'online' to 'razorpay' for backend compatibility
      const backendPaymentMethod = selectedPaymentMethod === 'online' ? 'razorpay' : selectedPaymentMethod;

      const orderData = {
        userId: user?.id,
        deliveryAddressId: selectedAddress.id,
        paymentMethod: backendPaymentMethod,
        couponCode: appliedCoupon?.code || null,
        // Scheduling data aligned with frontend
        orderType: scheduleSettings?.windowStatus?.activeWindow || 'LIVE',
        scheduledDate: getFormattedDate(selectedDate),
        scheduledSlot: (selectedDate === 'Today' && scheduleSettings?.windowStatus?.activeWindow === 'LIVE') ? 'LIVE' : selectedSlot,
        isScheduled: selectedDate === 'Tomorrow' || (selectedDate === 'Today' && !!selectedSlot),
        isBuyNow: isBuyNow,
        buyNowItem: isBuyNow ? buyNowItem : null,
      };

      const response = await orderService.createOrder(orderData);

      console.log('📦 Order response:', response);

      if (selectedPaymentMethod === 'cod') {
        if (!isBuyNow) {
          clearCart();
        }
        toast.success('Order placed successfully!');
        router.replace({
          pathname: '/order-success',
          params: { orderId: response.data.orderNumber }
        });
      } else if (selectedPaymentMethod === 'online') {
        // Check if payment is required (response.data contains the actual API response)
        if (response.success && response.requiresPayment && response.data.razorpay) {
          console.log('🔐 Opening Razorpay with data:', response.data.razorpay);
          
          
          
          // Store order data for verification after payment
          setRazorpayData({
            keyId: response.data.razorpay.keyId,
            amount: response.data.razorpay.amount,
            currency: response.data.razorpay.currency,
            orderId: response.data.razorpay.orderId,
            orderNumber: response.data.orderNumber,
            name: user.name || selectedAddress.name || '',
            email: user.email || '',
            contact: user.phoneNumber || selectedAddress.phone || '',
          });
          
          setShowRazorpayModal(true);
          setIsPlacingOrder(false);
        } else {
          console.error('❌ Invalid payment response:', response);
          toast.error('Failed to initiate online payment');
          setIsPlacingOrder(false);
        }
      }
    } catch (error) {
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to place order';
      
      // Check if it's a delivery unavailable error
      if (errorMessage.includes('Delivery is not available') || errorMessage.includes('not serviceable')) {
        toast.error('Delivery Not Available', errorMessage);
      } else {
        toast.error('Order Failed', errorMessage);
      }
      
      setIsPlacingOrder(false);
    }
  };

  const paymentMethods = useMemo(() => {
    return [
      { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive', icon: 'cash-outline' },
      { id: 'online', name: 'Pay Now', description: 'Secure online payment', icon: 'card-outline' },
    ].filter(method => {
      // Filter based on active payment gateways from backend
      if (method.id === 'cod') {
        return activePaymentGateways.includes('cod');
      }
      if (method.id === 'online') {
        // Show online payment if either Razorpay or Stripe is active
        return activePaymentGateways.includes('razorpay') || activePaymentGateways.includes('stripe');
      }
      return false;
    });
  }, [activePaymentGateways]);

  // Loading state
  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginRequired />;
  }

  // Empty cart
  if (!effectiveCartItems || effectiveCartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="cart-outline" size={80} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mt-4">Your cart is empty</Text>
          <Text className="text-gray-500 text-center mt-2">
            Add items to your cart to proceed with checkout
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/home')}
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Text className="text-white font-semibold">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: PRIMARY_COLOR }}>
        <View className="flex-1 bg-gray-50">
          {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Checkout</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Delivery Address Section */}
        <View className="bg-white p-4 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900">Delivery Address</Text>
            <TouchableOpacity
              onPress={handleAddAddress}
              className="flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={20} color={PRIMARY_COLOR} />
              <Text className="text-red-600 font-medium ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {loadingAddresses ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          ) : selectedAddress ? (
            <TouchableOpacity
              onPress={() => setShowAddressDropdown(true)}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-semibold text-gray-900">{selectedAddress.name}</Text>
                    {selectedAddress.id === 'profile-address' && (
                      <View className="bg-blue-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-blue-700">Profile</Text>
                      </View>
                    )}
                    {renderServiceabilityBadge(selectedAddress.id)}
                  </View>
                  <Text className="text-sm text-gray-600 mb-1">{selectedAddress.phone}</Text>
                  <Text className="text-sm text-gray-600">
                    {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleAddAddress}
              className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 items-center"
            >
              <Ionicons name="location-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2">Add delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-base font-bold text-gray-900 mb-3">Order Items ({effectiveCartItems.length})</Text>
          {effectiveCartItems.map((item, index) => {
            const imageUrl = getFullImageUrl(item.variantImage);
            const name = item.displayName || item.shortDescription || 'Product';
            const price = item.variantSellingPrice || 0;
            
            // Create unique key for both cart items and buy now items
            const uniqueKey = `${item.productId || item.id}-${item.inventoryProductId || ''}-${item.variantIndex || index}`;
            
            return (
              <View key={uniqueKey} className="flex-row mb-3 pb-3 border-b border-gray-100">
                <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Ionicons name="image-outline" size={24} color="#D1D5DB" />
                    </View>
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>
                    {name}
                  </Text>
                  {item.variantName && (
                    <Text className="text-xs text-gray-500 mt-1">{item.variantName}</Text>
                  )}
                  {item.variantUom && item.variantUomValue && (
                    <Text className="text-xs text-gray-500">
                      {item.variantUomValue}{item.variantUom}
                    </Text>
                  )}
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-xs text-gray-500">Qty: {item.quantity}</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      ₹{(price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Coupon Section */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-base font-bold text-gray-900 mb-3">Apply Coupon</Text>
          
          {!appliedCoupon ? (
            <View>
              {/* Show Available Coupons Button */}
              {availableCoupons.length > 0 && !showAvailableCoupons && (
                <TouchableOpacity
                  onPress={() => setShowAvailableCoupons(true)}
                  className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-3 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-2">🎟️</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-red-800">
                        {availableCoupons.length} Coupon{availableCoupons.length > 1 ? 's' : ''} Available
                      </Text>
                      <Text className="text-xs text-red-600">
                        Save up to ₹{Math.max(...availableCoupons.map(c => c.estimatedDiscount)).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#991b1b" />
                </TouchableOpacity>
              )}

              {/* Available Coupons List */}
              {showAvailableCoupons && availableCoupons.length > 0 && (
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-semibold text-gray-900">Available Coupons</Text>
                    <TouchableOpacity onPress={() => setShowAvailableCoupons(false)}>
                      <Text className="text-xs text-gray-500">Hide</Text>
                    </TouchableOpacity>
                  </View>

                  {/* First Time User Badge */}
                  {isFirstTimeUser && availableCoupons.some(c => c.isFirstTimeUserOnly) && (
                    <View className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5 mb-2">
                      <Text className="text-xs text-green-800 font-medium">
                        🎉 First-time user special offers!
                      </Text>
                    </View>
                  )}

                  <ScrollView 
                    style={{ maxHeight: 300 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {availableCoupons.map((coupon) => (
                      <View
                        key={coupon.id}
                        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 mb-2"
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1.5">
                              <View className="bg-red-600 px-2 py-1 rounded">
                                <Text className="text-xs text-white font-bold">{coupon.code}</Text>
                              </View>
                              {coupon.isFirstTimeUserOnly && (
                                <View className="bg-green-100 px-2 py-0.5 rounded">
                                  <Text className="text-[10px] text-green-700 font-semibold">NEW USER</Text>
                                </View>
                              )}
                            </View>
                            {coupon.description && (
                              <Text className="text-xs text-gray-700 mb-1.5" numberOfLines={2}>
                                {coupon.description}
                              </Text>
                            )}
                            <View className="flex-row items-center gap-2">
                              <Text className="text-[10px] text-gray-500 font-medium">
                                {coupon.discountType === 'percentage'
                                  ? `${coupon.discountValue}% OFF`
                                  : `₹${coupon.discountValue} OFF`}
                              </Text>
                              {coupon.minOrderValue && (
                                <Text className="text-[10px] text-gray-500">
                                  • Min: ₹{coupon.minOrderValue}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View className="items-end ml-2">
                            <Text className="text-sm font-bold text-green-600 mb-1">
                              Save ₹{coupon.estimatedDiscount.toFixed(2)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleApplyCouponFromList(coupon.code)}
                              disabled={isValidatingCoupon}
                              className="px-3 py-1 rounded"
                              style={{ backgroundColor: isValidatingCoupon ? '#9CA3AF' : PRIMARY_COLOR }}
                            >
                              <Text className="text-xs text-white font-semibold">
                                {isValidatingCoupon ? 'APPLYING...' : 'APPLY'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Manual Coupon Input */}
              <View>
                <Text className="text-xs font-medium text-gray-700 mb-1.5">
                  Or enter coupon code manually
                </Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={couponCode}
                    onChangeText={(text) => {
                      setCouponCode(text.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder="Enter code"
                    className="flex-1 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    autoCapitalize="characters"
                    editable={!isValidatingCoupon}
                  />
                  <TouchableOpacity
                    onPress={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: (isValidatingCoupon || !couponCode.trim()) ? '#D1D5DB' : PRIMARY_COLOR 
                    }}
                  >
                    {isValidatingCoupon ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-medium text-sm">Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {couponError && (
                  <Text className="text-xs text-red-600 mt-1">{couponError}</Text>
                )}
              </View>
            </View>
          ) : (
            <View className="bg-green-50 border border-green-200 rounded-lg p-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-green-800">
                  Coupon Applied: {appliedCoupon.code}
                </Text>
                <Text className="text-xs text-green-600 mt-1">
                  You saved ₹{appliedCoupon.discountAmount.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Ionicons name="close-circle" size={24} color="#16a34a" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Price Details */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-base font-bold text-gray-900 mb-3">Price Details</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-900">₹{subtotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-green-600">Discount</Text>
                <Text className="text-green-600">-₹{discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Delivery Fee</Text>
              <Text className="text-gray-900">
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            <View className="border-t border-gray-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-lg font-bold text-red-600">₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Delivery */}
        {scheduleSettings && (
          <View className="bg-white p-4 mb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-900">Delivery Schedule</Text>
              {!isScheduled ? (
                <View className="bg-orange-100 px-2 py-1 rounded">
                  <Text className="text-[10px] text-orange-700 font-bold">LIVE ORDER</Text>
                </View>
              ) : (
                <View className="bg-blue-100 px-2 py-1 rounded">
                  <Text className="text-[10px] text-blue-700 font-bold">PRE-ORDER</Text>
                </View>
              )}
            </View>

            {/* Date Selection */}
            <View className="flex-row gap-2 mb-4">
              {dateOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setSelectedDate(option.value);
                    if (option.value === 'Today') {
                      setSelectedSlot(null);
                      setIsScheduled(false);
                    } else {
                      setIsScheduled(true);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 items-center ${
                    selectedDate === option.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className={`font-semibold ${selectedDate === option.value ? 'text-red-600' : 'text-gray-700'}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Slot Selection - Only show for Tomorrow or if not Live Today */}
            {selectedDate === 'Tomorrow' && scheduleSettings.deliverySlots && scheduleSettings.deliverySlots.length > 0 && (
              <View>
                <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                  Select Delivery Slot
                </Text>
                <View className="flex-row flex-wrap gap-2">

                  {scheduleSettings.deliverySlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedSlot(slot);
                        setIsScheduled(true);
                      }}
                      className={`py-2 px-4 rounded-full border ${
                        selectedSlot === slot
                          ? 'bg-red-600 border-red-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${selectedSlot === slot ? 'text-white' : 'text-gray-700'}`}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment Method */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-base font-bold text-gray-900 mb-3">Payment Method</Text>
          {paymentMethods.map((method) => {
            const isCOD = method.id === 'cod';
            const isDisabled = isCOD && !isCODAvailable;
            
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => {
                  if (isDisabled) {
                    setShowCODModal(true);
                  } else {
                    setSelectedPaymentMethod(method.id);
                  }
                }}
                disabled={isDisabled && false}
                className={`flex-row items-center p-3 rounded-lg border-2 mb-2 ${
                  isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : selectedPaymentMethod === method.id
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={
                    isDisabled
                      ? '#9CA3AF'
                      : selectedPaymentMethod === method.id
                      ? PRIMARY_COLOR
                      : '#666'
                  }
                />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      className={`font-semibold ${
                        isDisabled
                          ? 'text-gray-400'
                          : selectedPaymentMethod === method.id
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {method.name}
                    </Text>
                    {isDisabled && (
                      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                    )}
                  </View>
                  <Text className="text-xs text-gray-600">
                    {isDisabled ? 'Not available for some items' : method.description}
                  </Text>
                </View>
                {selectedPaymentMethod === method.id && !isDisabled && (
                  <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View 
        className="bg-white border-t border-gray-200 px-4 py-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-600">Total Amount</Text>
          <Text className="text-xl font-bold text-red-600">₹{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || !selectedPaymentMethod || isPlacingOrder}
          className="py-3 rounded-lg"
          style={{
            backgroundColor:
              !selectedAddress || !selectedPaymentMethod || isPlacingOrder
                ? '#D1D5DB'
                : PRIMARY_COLOR,
          }}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-center text-base">
              Place Order
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Dropdown Modal */}
      <Modal
        visible={showAddressDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressDropdown(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-40 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Address</Text>
              <TouchableOpacity onPress={() => setShowAddressDropdown(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedAddress(item);
                    setShowAddressDropdown(false);
                  }}
                  className="px-4 py-3 border-b border-gray-100"
                >
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-semibold text-gray-900">{item.name}</Text>
                    {item.id === 'profile-address' && (
                      <View className="bg-blue-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-blue-700">Profile</Text>
                      </View>
                    )}
                    {item.isDefault && (
                      <View className="bg-green-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-green-700">Default</Text>
                      </View>
                    )}
                    {renderServiceabilityBadge(item.id)}
                  </View>
                  <Text className="text-sm text-gray-600 mb-1">{item.phone}</Text>
                  <Text className="text-sm text-gray-600">
                    {item.addressLine1}, {item.city}, {item.state} - {item.pincode}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* COD Unavailable Modal */}
      <Modal
        visible={showCODModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCODModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-lg w-full max-w-md p-6">
            <TouchableOpacity
              onPress={() => setShowCODModal(false)}
              className="absolute top-4 right-4"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                <Ionicons name="alert-circle" size={28} color="#D97706" />
              </View>
              <Text className="text-xl font-semibold text-gray-900 flex-1">
                COD Not Available
              </Text>
            </View>

            <Text className="text-gray-700 mb-4">
              Cash on Delivery is not available for the following products in your cart:
            </Text>

            <View className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48">
              <ScrollView showsVerticalScrollIndicator={true}>
                {codUnavailableProducts.map((product, index) => (
                  <View key={index} className="flex-row items-start gap-2 mb-2">
                    <Text className="text-amber-600 mt-1">•</Text>
                    <Text className="text-gray-800 text-sm flex-1">{product}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <Text className="text-sm text-gray-600 mb-6">
              Please use online payment method to complete your order.
            </Text>

            <TouchableOpacity
              onPress={() => setShowCODModal(false)}
              className="w-full py-3 rounded-lg"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Text className="text-white font-semibold text-center">Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Razorpay Payment Modal */}
      <Modal
        visible={showRazorpayModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (!isVerifyingPayment) {
            setShowRazorpayModal(false);
            setIsPlacingOrder(false);
          }
        }}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={() => {
                    if (!isVerifyingPayment) {
                      setShowRazorpayModal(false);
                      setIsPlacingOrder(false);
                    }
                  }} 
                  className="mr-3"
                  disabled={isVerifyingPayment}
                >
                  <Ionicons name="close" size={24} color={isVerifyingPayment ? "#9CA3AF" : "#000"} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Payment</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
                <Text className="text-xs text-green-600 ml-1">Secure</Text>
              </View>
            </View>
          </View>

          {/* WebView or Processing */}
          {isVerifyingPayment ? (
            <View className="flex-1 items-center justify-center bg-white">
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text className="text-gray-600 mt-4 text-base">Verifying payment...</Text>
              <Text className="text-gray-500 mt-2 text-sm">Please wait</Text>
            </View>
          ) : razorpayData ? (
            <WebView
              source={{ 
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #e63946;
      text-align: center;
      margin: 10px 0;
    }
    .order-info {
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .payment-form {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: 500;
      font-size: 14px;
    }
    input, select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #e63946;
    }
    .btn {
      background: #e63946;
      color: white;
      border: none;
      padding: 15px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 20px;
    }
    .btn:active {
      background: #c1121f;
    }
    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .secure-badge {
      text-align: center;
      color: #16a34a;
      font-size: 12px;
      margin-top: 15px;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #e63946;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading {
      text-align: center;
      padding: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="amount">₹${(parseInt(razorpayData.amount) / 100).toFixed(2)}</div>
      <div class="order-info">
        <p>Order: ${razorpayData.orderNumber}</p>
        <p>Payment to: Leats</p>
      </div>
    </div>
    
    <div class="payment-form">
      <form id="razorpay-form">
        <input type="hidden" name="key_id" value="${razorpayData.keyId}">
        <input type="hidden" name="order_id" value="${razorpayData.orderId}">
        <input type="hidden" name="amount" value="${razorpayData.amount}">
        <input type="hidden" name="currency" value="${razorpayData.currency}">
        <input type="hidden" name="name" value="Leats">
        <input type="hidden" name="description" value="Order #${razorpayData.orderNumber}">
        <input type="hidden" name="prefill[name]" value="${razorpayData.name.replace(/"/g, '&quot;')}">
        <input type="hidden" name="prefill[email]" value="${razorpayData.email.replace(/"/g, '&quot;')}">
        <input type="hidden" name="prefill[contact]" value="${razorpayData.contact.replace(/"/g, '&quot;')}">
        <input type="hidden" name="callback_url" value="https://your-app.com/payment/callback">
        <input type="hidden" name="cancel_url" value="https://your-app.com/payment/cancel">
        
        <button type="button" class="btn" onclick="initiatePayment()">
          Proceed to Payment
        </button>
      </form>
      
      <div class="secure-badge">
        🔒 Secured by Razorpay
      </div>
    </div>
  </div>
  
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function sendMessage(data) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      } catch (e) {
        console.error('Error sending message:', e);
      }
    }
    
    function initiatePayment() {
      try {
        if (typeof Razorpay === 'undefined') {
          alert('Payment gateway not loaded. Please check your internet connection.');
          return;
        }
        
        const options = {
          key: '${razorpayData.keyId}',
          amount: ${razorpayData.amount},
          currency: '${razorpayData.currency}',
          order_id: '${razorpayData.orderId}',
          name: 'Leats',
          description: 'Order #${razorpayData.orderNumber}',
          prefill: {
            name: '${razorpayData.name.replace(/'/g, "\\'")}',
            email: '${razorpayData.email.replace(/'/g, "\\'")}',
            contact: '${razorpayData.contact.replace(/'/g, "\\'")}'
          },
          theme: { 
            color: '#e63946'
          },
          handler: function(response) {
            document.body.innerHTML = '<div class="loading"><div class="spinner"></div><p>Payment successful! Verifying...</p></div>';
            
            sendMessage({
              type: 'PAYMENT_SUCCESS',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          modal: {
            ondismiss: function() {
              sendMessage({ type: 'PAYMENT_CANCELLED' });
            },
            escape: true,
            confirm_close: true
          }
        };
        
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function(response) {
          sendMessage({
            type: 'PAYMENT_FAILED',
            error: response.error.description || 'Payment failed'
          });
        });
        
        rzp.open();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  </script>
</body>
</html>
                ` 
              }}
              onMessage={handleRazorpayMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              startInLoadingState={true}
              mixedContentMode="always"
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptCanOpenWindowsAutomatically={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                toast.error('Failed to load payment page');
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error:', nativeEvent);
              }}
              renderLoading={() => (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  <Text className="text-gray-600 mt-4">Loading payment gateway...</Text>
                </View>
              )}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
      </View>
      </SafeAreaView>
    </>
  );
};

export default CheckoutScreen;
