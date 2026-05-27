import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#e63946';

const PaymentStep = ({ selectedPaymentMethod, onSelectPaymentMethod, total }) => (
  <View className="p-4">
    <Text className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</Text>

    {/* Cash on Delivery */}
    <TouchableOpacity
      onPress={() => onSelectPaymentMethod('cod')}
      className={`bg-white p-4 rounded-lg mb-3 border-2 ${
        selectedPaymentMethod === 'cod' ? 'border-[#e63946]' : 'border-gray-200'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="cash-outline" size={24} color="#000" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">Cash on Delivery</Text>
            <Text className="text-xs text-gray-500 mt-1">Pay when you receive</Text>
          </View>
        </View>
        {selectedPaymentMethod === 'cod' && (
          <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
        )}
      </View>
    </TouchableOpacity>

    {/* Online Payment (Razorpay) */}
    <TouchableOpacity
      onPress={() => onSelectPaymentMethod('razorpay')}
      className={`bg-white p-4 rounded-lg mb-3 border-2 ${
        selectedPaymentMethod === 'razorpay' ? 'border-[#e63946]' : 'border-gray-200'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="card-outline" size={24} color="#000" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">Online Payment</Text>
            <Text className="text-xs text-gray-500 mt-1">UPI, Cards, Net Banking</Text>
          </View>
        </View>
        {selectedPaymentMethod === 'razorpay' && (
          <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
        )}
      </View>
    </TouchableOpacity>

    {/* Payment Summary */}
    <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <View className="flex-row items-center">
        <Ionicons name="information-circle" size={20} color="#2563EB" />
        <Text className="text-sm text-blue-900 ml-2 flex-1">
          You will pay <Text className="font-bold">₹{total.toFixed(2)}</Text> for this order
        </Text>
      </View>
    </View>
  </View>
);

export default PaymentStep;
