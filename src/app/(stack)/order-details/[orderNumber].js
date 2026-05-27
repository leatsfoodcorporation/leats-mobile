import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LoginRequired from '../../../components/LoginRequired';
import { useAuthCheck } from '../../../hooks/useAuthProtection';
import OrderDetailsCard from '../../../components/orders/OrderDetailsCard';

const PRIMARY_COLOR = '#e63946';

const OrderDetailsScreen = () => {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams();
  const { isAuthenticated, isLoading } = useAuthCheck();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
        <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY_COLOR }} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
              <Text style={styles.headerTitle}>Order Details</Text>
            </View>
          </View>
          <View style={styles.container}>
            <LoginRequired 
              title="Sign In to View Order"
              message="Please sign in to view your order details"
              icon="receipt-outline"
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
      <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY_COLOR }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
            <Text style={styles.headerTitle}>Order Details</Text>
          </View>
        </View>
        
        <View style={styles.container}>
          <OrderDetailsCard orderNumber={orderNumber} />
        </View>
      </SafeAreaView>
    </>
  );
};



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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PRIMARY_COLOR,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default OrderDetailsScreen;
