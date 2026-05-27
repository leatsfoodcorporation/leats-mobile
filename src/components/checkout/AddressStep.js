import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#e63946';

const AddressStep = memo(({
  addresses,
  selectedAddress,
  onSelectAddress,
  loadingAddresses,
  onAddAddress,
}) => {
  if (loadingAddresses) {
    return (
      <View className="p-4">
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-900 mb-4">Select Delivery Address</Text>

      {addresses.length === 0 ? (
        <View className="bg-white p-6 rounded-lg items-center">
          <Ionicons name="location-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-800 font-semibold mt-4 mb-2">No Addresses Found</Text>
          <Text className="text-gray-500 text-center mb-4">
            Add a delivery address to continue
          </Text>
          <TouchableOpacity
            onPress={onAddAddress}
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Text className="text-white font-semibold">Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              onPress={() => onSelectAddress(address)}
              className={`bg-white p-4 rounded-lg mb-3 border-2 ${
                selectedAddress?.id === address.id
                  ? 'border-[#e63946]'
                  : 'border-gray-200'
              }`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap gap-2 mb-2">
                    <Text className="font-bold text-gray-900">{address.name}</Text>
                    {address.id === 'profile-address' && (
                      <View className="bg-blue-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-blue-800 font-semibold">Profile</Text>
                      </View>
                    )}
                    {address.isDefault && (
                      <View className="bg-green-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-green-800 font-semibold">Default</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-600 mb-1">{address.phone}</Text>
                  <Text className="text-sm text-gray-600">
                    {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}
                    {address.landmark && `, ${address.landmark}`}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                </View>
                {selectedAddress?.id === address.id && (
                  <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={onAddAddress}
            className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 items-center"
          >
            <Ionicons name="add-circle-outline" size={32} color={PRIMARY_COLOR} />
            <Text className="text-[#e63946] font-semibold mt-2">Add New Address</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

AddressStep.displayName = 'AddressStep';

export default AddressStep;
