import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#e63946';

const OrderSuccessScreen = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: PRIMARY_COLOR }}>
        <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        {/* Success Animation */}
        <View className="w-40 h-40 mb-4">
          <View className="w-32 h-32 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
          </View>
        </View>

        {/* Success Message */}
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Order Placed Successfully!
        </Text>
        <Text className="text-base text-gray-600 text-center mb-2">
          Thank you for your order
        </Text>
        {orderId && (
          <Text className="text-sm text-gray-500 text-center mb-6">
            Order ID: #{orderId.slice(-8)}
          </Text>
        )}


        <View className="w-full bg-blue-50 p-4 rounded-lg mb-8">
          <View className="flex-row items-center">
            <Ionicons name="notifications-outline" size={20} color="#2563EB" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-blue-800">
                Order Updates
              </Text>
              <Text className="text-sm text-blue-700">
                You'll receive notifications about your order status
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full">
          <TouchableOpacity
            onPress={() => router.push('/(stack)/orders')}
            className="py-4 rounded-lg items-center mb-3"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Text className="text-white font-bold text-base">Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/home')}
            className="py-4 rounded-lg items-center border border-gray-200"
          >
            <Text className="text-gray-700 font-bold text-base">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
      </SafeAreaView>
    </>
  );
};

export default OrderSuccessScreen;