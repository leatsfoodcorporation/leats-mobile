import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewStep = ({
  cartItems,
  selectedAddress,
  subtotal,
  discount,
  deliveryFee,
  total,
  appliedCoupon,
  couponCode,
  setCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  isValidatingCoupon,
  availableCoupons,
  showAvailableCoupons,
  setShowAvailableCoupons,
}) => (
  <View className="p-4">
    {/* Delivery Address */}
    <View className="bg-white p-4 rounded-lg mb-3">
      <Text className="font-bold text-gray-900 mb-3">Delivery Address</Text>
      {selectedAddress && (
        <View>
          <Text className="font-semibold text-gray-800">{selectedAddress.fullName}</Text>
          <Text className="text-sm text-gray-600 mt-1">{selectedAddress.phoneNumber}</Text>
          <Text className="text-sm text-gray-600 mt-1">
            {selectedAddress.addressLine1}, {selectedAddress.addressLine2 && `${selectedAddress.addressLine2}, `}
            {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zipCode}
          </Text>
        </View>
      )}
    </View>

    {/* Order Items */}
    <View className="bg-white p-4 rounded-lg mb-3">
      <Text className="font-bold text-gray-900 mb-3">Order Items ({cartItems.length})</Text>
      {cartItems.map((item, index) => (
        <View key={index} className="flex-row py-2 border-b border-gray-100">
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-800">{item.displayName}</Text>
            <Text className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</Text>
          </View>
          <Text className="text-sm font-semibold text-gray-900">
            ₹{(item.variantSellingPrice * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>

    {/* Coupon Section */}
    <View className="bg-white p-4 rounded-lg mb-3">
      {!appliedCoupon ? (
        <View>
          {availableCoupons.length > 0 && !showAvailableCoupons && (
            <TouchableOpacity
              onPress={() => setShowAvailableCoupons(true)}
              className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="pricetag" size={20} color="#16A34A" />
                  <View className="ml-2 flex-1">
                    <Text className="text-sm font-semibold text-green-900">
                      {availableCoupons.length} Coupon{availableCoupons.length > 1 ? 's' : ''} Available
                    </Text>
                    <Text className="text-xs text-green-700">
                      Save up to ₹{Math.max(...availableCoupons.map(c => c.estimatedDiscount)).toFixed(0)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#16A34A" />
              </View>
            </TouchableOpacity>
          )}

          {showAvailableCoupons && availableCoupons.length > 0 && (
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-900">Available Coupons</Text>
                <TouchableOpacity onPress={() => setShowAvailableCoupons(false)}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView className="max-h-48" nestedScrollEnabled>
                {availableCoupons.map((coupon) => (
                  <View key={coupon.id} className="border border-gray-200 rounded-lg p-3 mb-2">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="bg-green-100 px-2 py-1 rounded self-start mb-1">
                          <Text className="text-xs font-bold text-green-800">{coupon.code}</Text>
                        </View>
                        {coupon.description && (
                          <Text className="text-xs text-gray-600 mt-1">{coupon.description}</Text>
                        )}
                        <Text className="text-xs text-green-600 font-semibold mt-1">
                          Save ₹{coupon.estimatedDiscount.toFixed(0)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onApplyCoupon(coupon.code)}
                        disabled={isValidatingCoupon}
                        className="bg-[#e63946] px-3 py-1.5 rounded ml-2"
                      >
                        <Text className="text-white text-xs font-semibold">Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {showAvailableCoupons ? 'Or enter code manually' : 'Apply Coupon'}
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Enter coupon code"
              placeholderTextColor="#9CA3AF"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-gray-800"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={() => onApplyCoupon(couponCode)}
              disabled={isValidatingCoupon || !couponCode.trim()}
              className={`px-4 py-2 rounded-lg ${
                couponCode.trim() ? 'bg-[#e63946]' : 'bg-gray-200'
              }`}
            >
              {isValidatingCoupon ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className={`font-semibold ${couponCode.trim() ? 'text-white' : 'text-gray-400'}`}>
                  Apply
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Applied Coupon</Text>
          <View className="p-3 bg-green-50 border border-green-200 rounded-lg flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="ticket" size={20} color="#16A34A" />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-bold text-green-800">{appliedCoupon.code}</Text>
                <Text className="text-xs text-green-700">Saved ₹{appliedCoupon.discountAmount.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onRemoveCoupon}>
              <Ionicons name="close-circle" size={24} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>

    {/* Price Summary */}
    <View className="bg-white p-4 rounded-lg">
      <Text className="font-bold text-gray-900 mb-3">Price Details</Text>
      <View className="flex-row justify-between py-2">
        <Text className="text-gray-600">Subtotal</Text>
        <Text className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</Text>
      </View>
      {discount > 0 && (
        <View className="flex-row justify-between py-2">
          <Text className="text-green-600">Discount</Text>
          <Text className="text-green-600 font-medium">-₹{discount.toFixed(2)}</Text>
        </View>
      )}
      <View className="flex-row justify-between py-2">
        <Text className="text-gray-600">Delivery Fee</Text>
        <Text className={deliveryFee === 0 ? 'text-green-600 font-medium' : 'text-gray-900 font-medium'}>
          {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
        </Text>
      </View>
      <View className="border-t border-gray-200 mt-2 pt-3 flex-row justify-between">
        <Text className="text-lg font-bold text-gray-900">Total</Text>
        <Text className="text-lg font-bold text-[#e63946]">₹{total.toFixed(2)}</Text>
      </View>
    </View>
  </View>
);

export default ReviewStep;
