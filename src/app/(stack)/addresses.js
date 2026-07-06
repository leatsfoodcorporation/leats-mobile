import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import addressService from '../../services/addressService';
import axiosInstance from '../../lib/axios';
import { AddressModal } from '../../components/ui';
import toast from '../../utils/toast';

const PRIMARY_COLOR = '#e63946';

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleBackPress = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)");
  }
};


  const fetchAddresses = async () => {
    try {
      setLoading(true);
      
      {/* Fetch saved addresses and user profile in parallel */}
      const [addressResponse, userResponse] = await Promise.all([
        addressService.getAddresses(),
        axiosInstance.get('/api/auth/me'),
      ]);

      const allAddresses = [...(addressResponse.data || [])];

      {/* Add user profile address if it has complete address information */}
      if (userResponse.data.success && userResponse.data.data) {
        const userData = userResponse.data.data;

        {/* Check if user has complete address information */}
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

          {/* Check if this address already exists in saved addresses */}
          const isDuplicate = addressResponse.data?.some(
            (addr) =>
              addr.addressLine1.toLowerCase().trim() ===
                userData.address.toLowerCase().trim() &&
              addr.city.toLowerCase().trim() ===
                userData.city.toLowerCase().trim() &&
              addr.pincode === userData.zipCode
          );

          {/* Only add if it's not a duplicate */}
          if (!isDuplicate) {
            allAddresses.unshift(profileAddress);
          }
        }
      }

      setAddresses(allAddresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (addressData) => {
    try {
      setSaving(true);
      if (editingAddress && editingAddress.id !== 'profile-address') {
        {/* Update existing saved address */}
        await addressService.updateAddress(editingAddress.id, addressData);
        toast.success('Address updated successfully');
      } else {
        {/* Create new address (including when converting profile address) */}
        await addressService.createAddress(addressData);
        toast.success('Address added successfully');
      }
      setShowAddModal(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const handleSetDefault = async (addressId) => {
    {/* Cannot set profile address as default */}
    if (addressId === 'profile-address') {
      Alert.alert(
        'Cannot Set Default',
        'Profile address cannot be set as default. Please save it as a new address first.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await addressService.setDefaultAddress(addressId);
      fetchAddresses();
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
    }
  };

  const handleDelete = (addressId) => {
    {/* Cannot delete profile address */}
    if (addressId === 'profile-address') {
      Alert.alert(
        'Cannot Delete',
        'This is your profile address. Please edit your profile to change it.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressService.deleteAddress(addressId);
              fetchAddresses();
              toast.success('Address deleted');
            } catch (error) {
              console.error('Error deleting address:', error);
              toast.error('Failed to delete address');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
         <SafeAreaView 
              style={[styles.container, { backgroundColor: "#e63946" }]}
                edges={["top", "left", "right"]}>
                <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#e63946", }}>
                    <TouchableOpacity
                      onPress={() => handleBackPress()}
                      style={{ width: 40, height: 40, justifyContent: "center", alignItems: "center",}}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }} >
                      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}> My Addresses</Text> 
                      <TouchableOpacity
                        onPress={handleAddNewAddress}  className="px-4 py-2 rounded-lg" style={{ backgroundColor: "#fff" }}>
                    <Text className="font-medium" style={{ color: "#000", }}>Add New</Text>
                  </TouchableOpacity>
                </View>
              </View>

      <ScrollView className="flex-1">
        {addresses.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 text-lg mt-4">No addresses found</Text>
            <TouchableOpacity
              onPress={handleAddNewAddress}
              className="bg-red-500 px-6 py-3 rounded-lg mt-6"
            >
              <Text className="text-white font-medium">Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-4 gap-3">
            {addresses.map((address) => (
              <View
                key={address.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                {/* Address Type & Default Badge */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={
                        address.addressType === 'home'
                          ? 'home'
                          : address.addressType === 'office'
                          ? 'briefcase'
                          : 'location'
                      }
                      size={20}
                      color={PRIMARY_COLOR}
                    />
                    <Text className="text-base font-semibold capitalize">
                      {address.addressType || 'Other'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {address.id === 'profile-address' && (
                      <View className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-blue-700 text-xs font-medium">
                          Profile
                        </Text>
                      </View>
                    )}
                    {address.isDefault && (
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-700 text-xs font-medium">
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Name & Phone */}
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {address.name}
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                  {address.phone}
                </Text>

                {/* Address */}
                <Text className="text-sm text-gray-700 mb-1">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                </Text>
                {address.landmark && (
                  <Text className="text-sm text-gray-600 mb-1">
                    Landmark: {address.landmark}
                  </Text>
                )}
                <Text className="text-sm text-gray-700">
                  {address.city}, {address.state} - {address.pincode}
                </Text>
                {address.country && address.country !== 'India' && (
                  <Text className="text-sm text-gray-700">{address.country}</Text>
                )}

                {/* Actions */}
                <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100">
                  {!address.isDefault && address.id !== 'profile-address' && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(address.id)}
                      className="flex-1 bg-gray-100 py-2 rounded-lg"
                    >
                      <Text className="text-center text-gray-700 font-medium">
                        Set as Default
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleEditAddress(address)}
                    className="flex-1 bg-blue-50 py-2 rounded-lg"
                  >
                    <Text className="text-center text-blue-600 font-medium">
                      Edit
                    </Text>
                  </TouchableOpacity>
                  {address.id !== 'profile-address' && (
                    <TouchableOpacity
                      onPress={() => handleDelete(address.id)}
                      className="flex-1 bg-red-50 py-2 rounded-lg"
                    >
                      <Text className="text-center text-red-600 font-medium">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AddressModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editingAddress={editingAddress}
        isLoading={saving}
      />
      </View>
      </SafeAreaView>
    </>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
