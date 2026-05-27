import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import orderService from '../../services/orderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { getFullImageUrl } from '../../lib/image-utils';
import RatingModal from './RatingModal';

const MyOrdersCard = memo(() => {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  const statusFilters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const initialLoadDone = useRef(false);

  const loadOrders = useCallback(async (status, page) => {
    try {
      // Show full loading only on first load, otherwise silent refresh
      if (!initialLoadDone.current) {
        setIsLoading(true);
      }

      if (!user || !user.id) {
        console.error('No user found');
        setIsLoading(false);
        return;
      }

      const filterStatus = status ?? selectedStatus;
      const filterPage = page ?? currentPage;

      const params = {
        userId: user.id,
        page: filterPage,
        limit: 10,
      };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await orderService.getOrders(params);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      initialLoadDone.current = true;
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load orders when status or page changes
  useEffect(() => {
    loadOrders(selectedStatus, currentPage);
  }, [selectedStatus, currentPage, loadOrders]);

  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders(selectedStatus, currentPage);
    }, [selectedStatus, currentPage, loadOrders])
  );

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = useCallback(async () => {
    try {
      const symbol = await AsyncStorage.getItem('currencySymbol');
      if (symbol) setCurrencySymbol(symbol);
    } catch (error) {
      console.log('Error loading currency:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'delivered':
        return { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' };
      case 'shipped':
        return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
      case 'confirmed':
      case 'processing':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'shipped':
        return 'car';
      case 'confirmed':
      case 'processing':
        return 'cube';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  }, []);

  const getPaymentStatusColor = useCallback((status) => {
    switch (status) {
      case 'completed':
        return '#059669';
      case 'pending':
        return '#d97706';
      case 'failed':
      case 'cancelled':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  }, []);

  const getDisplayPaymentStatus = useCallback((order) => {
    if (order.orderStatus === 'cancelled' && order.paymentStatus !== 'completed') {
      return 'cancelled';
    }
    return order.paymentStatus;
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const getPartnerRating = useCallback((order) => {
    if (typeof order?.partnerRating === 'number') {
      return order.partnerRating;
    }
    if (order?.rating && typeof order.rating.rating === 'number') {
      return order.rating.rating;
    }
    return null;
  }, []);

  const renderOrderItem = useCallback(({ item: order }) => {
    const statusColors = getStatusColor(order.orderStatus);
    const partnerRating = getPartnerRating(order);

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          {/* Order Number and Badge Row */}
          <View style={styles.orderNumberRow}>
            <View style={styles.orderNumberSection}>
              <Text style={styles.orderLabel}>Order Number</Text>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            </View>
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

          {/* Delivery Slot Row */}
          <View style={styles.deliverySlotRow}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.deliverySlotLabel}>Delivery:</Text>
            <Text style={styles.deliverySlotValue}>
              {order.isScheduled ? (order.scheduledSlot || 'Scheduled') : 'Immediate'}
            </Text>
          </View>

          {/* Scheduled Date Row */}
          {order.isScheduled && order.scheduledDate && (
            <View style={styles.scheduledDateRow}>
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text style={styles.scheduledDateText}>
                {formatDate(order.scheduledDate)}
              </Text>
            </View>
          )}

          {/* Total and Status Row */}
          <View style={styles.orderHeaderBottom}>
            <Text style={styles.orderTotal}>
              {currencySymbol}{(order.total || 0).toFixed(2)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.bg, borderColor: statusColors.border },
              ]}
            >
              <Ionicons
                name={getStatusIcon(order.orderStatus)}
                size={14}
                color={statusColors.text}
              />
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.orderItems}>
          {order.items.slice(0, 2).map((item, index) => {
            const imageUrl = getFullImageUrl(item.productImage);
            return (
              <View key={`${item.id}-${index}`} style={styles.orderItem}>
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
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.productName}
                  </Text>
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
                      Cutting: {item.selectedCuttingStyle}
                    </Text>
                  )}
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      {currencySymbol}
                      {(item.total || (item.unitPrice * item.quantity) || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Order Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.paymentInfo}>
            <Ionicons name="receipt-outline" size={16} color="#6b7280" />
            <Text style={styles.paymentLabel}>Payment:</Text>
            <Text
              style={[
                styles.paymentStatus,
                { color: getPaymentStatusColor(getDisplayPaymentStatus(order)) },
              ]}
            >
              {getDisplayPaymentStatus(order).charAt(0).toUpperCase() + getDisplayPaymentStatus(order).slice(1)}
            </Text>
            <Text style={styles.paymentMethod}>
              ({order.paymentMethod.toUpperCase()})
            </Text>
          </View>
          {order.invoiceNumber && (
            <Text style={styles.invoiceNumber}>
              Invoice: <Text style={styles.invoiceValue}>{order.invoiceNumber}</Text>
            </Text>
          )}
          {order.deliveryPartner && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
            <View style={styles.partnerInfo}>
              <Ionicons name="person-outline" size={16} color="#2563eb" />
              <Text style={styles.partnerName}>{order.deliveryPartner.name}</Text>
              {order.deliveryPartner.phone && (
                <>
                  <Text style={styles.partnerDot}>|</Text>
                  <Text style={styles.partnerPhone}>{order.deliveryPartner.phone}</Text>
                </>
              )}
            </View>
          )}
          {order.orderStatus === 'delivered' && (order.deliveryPartnerId || order.deliveryPartner) && (
            <>
              {partnerRating ? (
                <View style={styles.ratedBadge}>
                  <Ionicons name="star" size={14} color="#d97706" />
                  <Text style={styles.ratedBadgeText}>
                    {partnerRating.toFixed(1)} Rated
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.rateButtonInline}
                  onPress={() => {
                    setSelectedOrderForRating(order);
                    setIsRatingModalVisible(true);
                  }}
                >
                  <Ionicons name="star-outline" size={14} color="#d97706" />
                  <Text style={styles.rateButtonInlineText}>Rate Delivery</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => router.push(`/order-details/${order.orderNumber}`)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#e63946" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [currencySymbol, getPartnerRating, getStatusColor, getStatusIcon, getPaymentStatusColor, getDisplayPaymentStatus, formatDate]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus === 'all'
          ? "You haven't placed any orders yet"
          : `No ${selectedStatus} orders found`}
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  ), [selectedStatus]);

  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>
        <View style={styles.paginationPages}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <TouchableOpacity
              key={page}
              style={[
                styles.paginationPage,
                currentPage === page && styles.paginationPageActive,
              ]}
              onPress={() => setCurrentPage(page)}
            >
              <Text
                style={[
                  styles.paginationPageText,
                  currentPage === page && styles.paginationPageTextActive,
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [currentPage, totalPages]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === item.value && styles.filterButtonActive,
              ]}
              onPress={() => {
                setSelectedStatus(item.value);
                setCurrentPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === item.value && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderPagination}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e63946']}
            tintColor="#e63946"
          />
        }
      />
      {selectedOrderForRating && (
        <RatingModal
          isVisible={isRatingModalVisible}
          onClose={() => {
            setIsRatingModalVisible(false);
            setSelectedOrderForRating(null);
          }}
          orderId={selectedOrderForRating.id || selectedOrderForRating._id}
          orderNumber={selectedOrderForRating.orderNumber}
          partnerName={selectedOrderForRating.deliveryPartner?.name}
          onRatingSuccess={loadOrders}
        />
      )}
    </View>
  );
});

MyOrdersCard.displayName = 'MyOrdersCard';

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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  orderNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumberSection: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  preOrderBadge: {
    backgroundColor: '#dbeafe',
  },
  liveOrderBadge: {
    backgroundColor: '#ffedd5',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#374151',
  },
  deliverySlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  deliverySlotLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  deliverySlotValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  scheduledDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  scheduledDateText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  orderHeaderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e63946',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderItems: {
    padding: 16,
    gap: 16,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
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
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 13,
    color: '#374151',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  moreItems: {
    fontSize: 13,
    color: '#6b7280',
  },
  orderFooter: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  paymentStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  paymentMethod: {
    fontSize: 13,
    color: '#6b7280',
  },
  invoiceNumber: {
    fontSize: 13,
    color: '#6b7280',
  },
  invoiceValue: {
    fontWeight: '500',
    color: '#111827',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  partnerName: {
    fontSize: 13,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  partnerDot: {
    fontSize: 13,
    color: '#60a5fa',
  },
  partnerPhone: {
    fontSize: 13,
    color: '#2563eb',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratedBadgeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  rateButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
  },
  rateButtonInlineText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e63946',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#e63946',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  paginationButtonTextDisabled: {
    color: '#9ca3af',
  },
  paginationPages: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationPage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  paginationPageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  paginationPageTextActive: {
    color: '#fff',
  },
});

export default MyOrdersCard;
