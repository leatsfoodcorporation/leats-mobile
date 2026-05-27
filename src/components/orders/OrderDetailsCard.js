import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import orderService from '../../services/orderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { getFullImageUrl } from '../../lib/image-utils';
import RatingModal from './RatingModal';
// TODO: Enable real-time order tracking in future
// import { useSocket } from '../../context/SocketContext';
// import { subscribeToOrderTracking, unsubscribeFromOrderEvents } from '../../lib/socket/socketClient';

const OrderDetailsCard = ({ orderNumber }) => {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  // TODO: Enable real-time connection status in future
  // const { isConnected } = useSocket();

  // TODO: Enable real-time delivery updates in future
  // // Real-time delivery update handler
  // const handleDeliveryUpdate = useCallback((data) => {
  //   if (order && data.orderId === order.id) {
  //     setOrder(prev => prev ? { ...prev, orderStatus: data.status } : null);
  //   }
  // }, [order]);

  // // Subscribe to real-time order tracking
  // useEffect(() => {
  //   let cleanup;
  //   
  //   if (order?.id && isConnected) {
  //     cleanup = subscribeToOrderTracking(order.id, {
  //       onDeliveryUpdate: handleDeliveryUpdate,
  //     });
  //   }

  //   return () => {
  //     if (cleanup) {
  //       cleanup();
  //     }
  //     if (order?.id) {
  //       unsubscribeFromOrderEvents(order.id);
  //     }
  //   };
  // }, [order?.id, isConnected, handleDeliveryUpdate]);

  const pollingRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Terminal statuses that don't need polling
  const isActiveOrder = useCallback((status) => {
    return status && !['delivered', 'cancelled'].includes(status);
  }, []);

  useEffect(() => {
    loadOrder();
    loadCurrency();
  }, [orderNumber, user]);

  // Auto-poll every 10s for active (non-delivered/cancelled) orders
  useEffect(() => {
    if (order && isActiveOrder(order.orderStatus)) {
      pollingRef.current = setInterval(() => {
        refreshOrder();
      }, 10000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [order?.orderStatus]);

  // Refresh when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        order &&
        isActiveOrder(order.orderStatus)
      ) {
        refreshOrder();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [order?.orderStatus]);

  const loadCurrency = async () => {
    try {
      const symbol = await AsyncStorage.getItem('currencySymbol');
      if (symbol) setCurrencySymbol(symbol);
    } catch (error) {
      console.log('Error loading currency:', error);
    }
  };

  // Silent refresh (no loading spinner) for polling
  const refreshOrder = async () => {
    try {
      if (!user || !user.id) return;
      const response = await orderService.getOrderById(orderNumber);
      if (response.data.userId === user.id) {
        setOrder(response.data);
      }
    } catch (error) {
      // Silent fail for background polling
    }
  };

  const loadOrder = async () => {
    try {
      setIsLoading(true);

      if (!user || !user.id) {
        console.error('No user found');
        setIsLoading(false);
        return;
      }

      const response = await orderService.getOrderById(orderNumber);

      if (response.data.userId !== user.id) {
        console.error('Order does not belong to user');
        router.back();
        return;
      }

      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
      if (error.response?.status === 404) {
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' };
      case 'shipped':
        return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
      case 'confirmed':
      case 'packing':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'shipped':
        return 'car';
      case 'confirmed':
      case 'packing':
        return 'cube';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatScheduleDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRatingSuccess = () => {
    loadOrder();
  };

  const handleCallPartner = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getOrderTimeline = () => {
    if (!order) return [];

    if (order.orderStatus === 'cancelled') {
      return [
        {
          status: 'Order Placed',
          date: order.createdAt,
          completed: true,
          icon: 'receipt-outline',
        },
        {
          status: 'Cancelled',
          date: order.cancelledAt || order.updatedAt,
          completed: true,
          icon: 'close-circle',
        },
      ];
    }

    const statusHierarchy = ['pending', 'confirmed', 'packing', 'shipped', 'delivered'];
    const currentStatusIndex = statusHierarchy.indexOf(order.orderStatus);

    return [
      {
        status: 'Order Placed',
        date: order.createdAt,
        completed: true,
        icon: 'receipt-outline',
      },
      {
        status: 'Order Confirmed',
        date: order.confirmedAt,
        completed: currentStatusIndex >= 1,
        icon: 'checkmark-circle',
      },
      {
        status: 'Packing',
        date: order.packingAt,
        completed: currentStatusIndex >= 2,
        icon: 'cube',
      },
      {
        status: 'Shipped',
        date: order.shippedAt,
        completed: currentStatusIndex >= 3,
        icon: 'car',
      },
      {
        status: 'Delivered',
        date: order.deliveredAt,
        completed: currentStatusIndex >= 4,
        icon: 'checkmark-circle',
      },
    ];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  if (!order) {
    return null;
  }

  const statusColors = getStatusColor(order.orderStatus);
  const timeline = getOrderTimeline();
  const partnerRating = typeof order.partnerRating === 'number'
    ? order.partnerRating
    : order.rating?.rating;
  const partnerRatingComment = order.partnerRatingComment || order.rating?.comment;
  const partnerRatedAt = order.ratedAt || order.rating?.createdAt;
  const canRatePartner =
    order.orderStatus === 'delivered' &&
    (order.deliveryPartnerId || order.deliveryPartner) &&
    !partnerRating;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#6b7280" />
        <Text style={styles.backButtonText}>Back to Orders</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
              {order.isScheduled ? (
                <View style={[styles.typeBadge, styles.preOrderBadge]}>
                  <Text style={styles.typeBadgeText}>PRE-ORDER</Text>
                </View>
              ) : (
                <View style={[styles.typeBadge, styles.liveOrderBadge]}>
                  <Text style={styles.typeBadgeText}>LIVE ORDER</Text>
                </View>
              )}
            </View>
            {order.invoiceNumber && (
              <Text style={styles.invoiceNumber}>Invoice: {order.invoiceNumber}</Text>
            )}
            <View style={styles.scheduleInfo}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.scheduleText}>
                Delivery: <Text style={styles.scheduleValue}>{order.isScheduled ? (order.scheduledSlot || 'Scheduled') : 'Immediate'}</Text>
              </Text>
            </View>
            {order.isScheduled && order.scheduledDate && (
              <View style={[styles.scheduleInfo, { marginTop: 4 }]}>
                <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                <Text style={styles.scheduleText}>
                  Date: <Text style={styles.scheduleValue}>{formatScheduleDate(order.scheduledDate)}</Text>
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg, borderColor: statusColors.border },
            ]}
          >
            <Ionicons
              name={getStatusIcon(order.orderStatus)}
              size={16}
              color={statusColors.text}
            />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{order.paymentMethod.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    order.paymentStatus === 'completed'
                      ? '#059669'
                      : order.paymentStatus === 'pending'
                      ? '#d97706'
                      : '#dc2626',
                },
              ]}
            >
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Delivery Partner Info - hide for delivered/cancelled */}
      {order.deliveryPartner && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#e63946" />
            <Text style={styles.sectionTitle}>Delivery Partner</Text>
          </View>
          <View style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{order.deliveryPartner.name}</Text>
              <TouchableOpacity
                style={styles.partnerPhone}
                onPress={() => handleCallPartner(order.deliveryPartner.phone)}
              >
                <Ionicons name="call" size={14} color="#2563eb" />
                <Text style={styles.partnerPhoneText}>
                  {order.deliveryPartner.phone}
                </Text>
              </TouchableOpacity>
              {order.deliveryAssignAt && (
                <Text style={styles.partnerAssignDate}>
                  Assigned on {formatDate(order.deliveryAssignAt)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Customer Rating */}
      {order.orderStatus === 'delivered' && partnerRating && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.sectionTitle}>Your Rating</Text>
          </View>
          <View style={styles.ratingCard}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= partnerRating ? 'star' : 'star-outline'}
                  size={24}
                  color={star <= partnerRating ? '#fbbf24' : '#d1d5db'}
                />
              ))}
            </View>
            {partnerRatingComment && (
              <Text style={styles.ratingComment}>{partnerRatingComment}</Text>
            )}
            {partnerRatedAt && <Text style={styles.ratingDate}>Rated on {formatDate(partnerRatedAt)}</Text>}
          </View>
        </View>
      )}

      {/* Rate Delivery Partner Button */}
      {canRatePartner && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => setIsRatingModalVisible(true)}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.rateButtonText}>Rate Delivery Partner</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order Timeline */}
      {timeline.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timeline}>
            {timeline.map((item, index) => (
              <View key={`${item.status}-${index}`} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineIcon,
                      {
                        backgroundColor: item.completed ? '#d1fae5' : '#f3f4f6',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.completed ? '#059669' : '#9ca3af'}
                    />
                  </View>
                  {index < timeline.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: item.completed ? '#a7f3d0' : '#e5e7eb' },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineRight}>
                  <Text
                    style={[
                      styles.timelineStatus,
                      { color: item.completed ? '#111827' : '#6b7280' },
                    ]}
                  >
                    {item.status}
                  </Text>
                  {item.date ? (
                    <Text style={styles.timelineDate}>{formatDate(item.date)}</Text>
                  ) : (
                    <Text style={styles.timelinePending}>
                      {item.completed ? 'In progress' : 'Pending'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
        <View style={styles.items}>
          {order.items.map((item, index) => {
            const imageUrl = getFullImageUrl(item.productImage);
            return (
              <View key={`${item.id}-${index}`} style={styles.item}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemImagePlaceholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.itemDetails}>
                  {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemVariant}>
                    {item.displayName || item.variantName}
                    {item.variantUom && item.variantUomValue && (
                      <Text style={styles.itemUom}>
                        {' '}({item.variantUomValue}{item.variantUom})
                      </Text>
                    )}
                  </Text>
                  {item.selectedCuttingStyle && (
                    <Text style={styles.itemCutting}>
                      Cutting Style: {item.selectedCuttingStyle}
                    </Text>
                  )}
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemUnitPrice}>
                      Unit Price: {currencySymbol}{(item.unitPrice || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemPriceContainer}>
                  <Text style={styles.itemPrice}>
                    {currencySymbol}
                    {(item.total || (item.unitPrice * item.quantity) || 0).toFixed(2)}
                  </Text>
                  {item.mrp > item.unitPrice && (
                    <Text style={styles.itemMrp}>
                      {currencySymbol}
                      {((item.mrp || 0) * (item.quantity || 0)).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={20} color="#e63946" />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <View style={styles.address}>
          <Text style={styles.addressName}>{order.deliveryAddress.name}</Text>
          <Text style={styles.addressLine}>{order.deliveryAddress.addressLine1}</Text>
          {order.deliveryAddress.addressLine2 && (
            <Text style={styles.addressLine}>{order.deliveryAddress.addressLine2}</Text>
          )}
          {order.deliveryAddress.landmark && (
            <Text style={styles.addressLandmark}>
              Landmark: {order.deliveryAddress.landmark}
            </Text>
          )}
          <Text style={styles.addressLine}>
            {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
            {order.deliveryAddress.pincode}
          </Text>
          <Text style={styles.addressLine}>{order.deliveryAddress.country}</Text>
          <View style={styles.addressContact}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={14} color="#6b7280" />
              <Text style={styles.contactText}>{order.deliveryAddress.phone}</Text>
            </View>
            {order.deliveryAddress.alternatePhone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color="#6b7280" />
                <Text style={styles.contactText}>
                  {order.deliveryAddress.alternatePhone}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {currencySymbol}{(order.subtotal || 0).toFixed(2)}
            </Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>
                -{currencySymbol}{(order.discount || 0).toFixed(2)}
              </Text>
            </View>
          )}
          {order.couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Coupon Discount {order.couponCode && `(${order.couponCode})`}
              </Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>
                -{currencySymbol}{(order.couponDiscount || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Charge</Text>
            <Text style={styles.summaryValue}>
              {(order.shippingCharge || 0) === 0
                ? 'FREE'
                : `${currencySymbol}${(order.shippingCharge || 0).toFixed(2)}`}
            </Text>
          </View>
          {!order.gstType && (order.tax || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Tax ({(order.taxRate || 0).toFixed(2)}%)
              </Text>
              <Text style={styles.summaryValue}>
                {currencySymbol}{(order.tax || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {currencySymbol}{(order.total || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Rating Modal */}
      <RatingModal
        isVisible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        orderId={order.id || order._id}
        orderNumber={order.orderNumber}
        partnerName={order.deliveryPartner?.name}
        onRatingSuccess={handleRatingSuccess}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  preOrderBadge: {
    backgroundColor: '#dbeafe',
  },
  liveOrderBadge: {
    backgroundColor: '#ffedd5',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af', 
    letterSpacing: 0.5,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  scheduleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  scheduleValue: {
    fontWeight: '600',
    color: '#111827',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    flexShrink: 0,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerInfo: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  timelinePending: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  items: {
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  itemDetails: {
    flex: 1,
  },
  itemBrand: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemUom: {
    color: '#9ca3af',
  },
  itemCutting: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  itemFooter: {
    gap: 4,
  },
  itemQty: {
    fontSize: 12,
    color: '#374151',
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#374151',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemMrp: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  address: {
    gap: 4,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: '#374151',
  },
  addressLandmark: {
    fontSize: 12,
    color: '#6b7280',
  },
  addressContact: {
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#374151',
  },
  summary: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 13,
    color: '#374151',
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e63946',
  },
  partnerCard: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  partnerInfo: {
    gap: 6,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  partnerPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerPhoneText: {
    fontSize: 13,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  partnerAssignDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingComment: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e63946',
    paddingVertical: 12,
    borderRadius: 8,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default OrderDetailsCard;
