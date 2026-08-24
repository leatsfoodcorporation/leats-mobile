import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import LoginRequired from '../../components/LoginRequired';
import { useAuthCheck } from '../../hooks/useAuthProtection';
import MyOrdersCard from '../../components/orders/MyOrdersCard';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function OrdersScreen() {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const router = useRouter();
  if (isLoading) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
        <SafeAreaView style={[styles.container, { backgroundColor: '#e63946' }]} edges={['top', 'left', 'right']}>
          <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <LoginRequired            title="Sign In to View Orders"
            message="Please sign in to view your order history and track shipments"
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

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
                My Orders
              </Text>
              <Text style={{ color: "#FEE2E2", fontSize: 13 }}>
                View and track all your orders
              </Text>
            </View>
          </View>
          <MyOrdersCard />
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
