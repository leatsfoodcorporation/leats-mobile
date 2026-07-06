import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const PRIMARY_COLOR = '#e63946';

const InfoRow = ({ icon, label, value }) => (
  <View className="flex-row items-start py-4 border-b border-gray-100">
    <View
      className="w-10 h-10 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: '#FEE2E2' }}
    >
      <Ionicons name={icon} size={20} color={PRIMARY_COLOR} />
    </View>
    <View className="flex-1">
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <Text className="text-base text-gray-900 font-medium">
        {value || 'Not provided'}
      </Text>
    </View>
  </View>
);

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAddress = () => {
    const parts = [];
    if (user?.address) parts.push(user.address);
    if (user?.city) parts.push(user.city);
    if (user?.state) parts.push(user.state);
    if (user?.zipCode) parts.push(user.zipCode);
    if (user?.country) parts.push(user.country);
    return parts.length > 0 ? parts.join(', ') : null;
  };

    const handleBackPress = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)");
  }
};


  return (
    <>
        <StatusBar style="light" backgroundColor="#e63946" translucent />
            <SafeAreaView
              style={[styles.container, { backgroundColor: "#e63946" }]}
              edges={["top", "left", "right"]}>
              <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "#e63946",
                  }}>
                  <TouchableOpacity
                    onPress={() => handleBackPress()}
                    style={{
                      width: 40,
                      height: 40,
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
                      My Profile
                    </Text>
                  </View>
                </View>
          {/* <Stack.Screen
            options={{
              title: 'My Profile',
              headerShown: true,
            }}
          /> */}

      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white px-6 py-8 items-center border-b border-gray-200">
          {/* Avatar */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <Text className="text-white text-3xl font-bold">
                {getUserInitials()}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {user?.name || 'Guest User'}
          </Text>

          {/* Email */}
          <Text className="text-sm text-gray-600 mb-3">
            {user?.email || 'guest@example.com'}
          </Text>

          {/* Role Badge */}
          {user?.role && (
            <View
              className="px-4 py-1 rounded-full"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Text
                className="text-xs font-semibold uppercase"
                style={{ color: PRIMARY_COLOR }}
              >
                {user.role}
              </Text>
            </View>
          )}

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() => router.push('/(stack)/edit-profile')}
            className="flex-row items-center justify-center px-6 py-3 rounded-lg mt-6"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View className="bg-white mt-2 px-6">
          <Text className="text-lg font-bold text-gray-900 py-4">
            Personal Information
          </Text>

          <InfoRow
            icon="person-outline"
            label="Full Name"
            value={user?.name}
          />

          <InfoRow
            icon="mail-outline"
            label="Email Address"
            value={user?.email}
          />

          <InfoRow
            icon="call-outline"
            label="Phone Number"
            value={user?.phoneNumber}
          />

          <InfoRow
            icon="calendar-outline"
            label="Date of Birth"
            value={formatDate(user?.dateOfBirth)}
          />
        </View>

        {/* Address Information */}
        <View className="bg-white mt-2 px-6 mb-4">
          <Text className="text-lg font-bold text-gray-900 py-4">
            Address Information
          </Text>

          <InfoRow
            icon="location-outline"
            label="Complete Address"
            value={formatAddress()}
          />

          <InfoRow
            icon="home-outline"
            label="Street Address"
            value={user?.address}
          />

          <InfoRow
            icon="business-outline"
            label="City"
            value={user?.city}
          />

          <InfoRow
            icon="map-outline"
            label="State"
            value={user?.state}
          />

          <InfoRow
            icon="mail-open-outline"
            label="ZIP/Postal Code"
            value={user?.zipCode}
          />

          <InfoRow
            icon="globe-outline"
            label="Country"
            value={user?.country}
          />
        </View>
      </ScrollView>
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
