import '../../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { LocationProvider } from '../context/LocationContext';
import { NotificationProvider } from '../context/NotificationContext.web';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import ToastManager from '../components/ToastManager';
import { useEffect } from 'react';
import DeliveryLocationModal from '../components/DeliveryLocationModal';
import { PRIMARY_COLOR } from '../constants/theme';

// Prevent the native splash screen from auto-hiding on web as well
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  useEffect(() => {
    console.log('🔥 Web root layout loaded - native Firebase modules skipped');
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <LocationProvider>
                <StatusBar style="light" backgroundColor={PRIMARY_COLOR} translucent={true} />
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(stack)" options={{ headerShown: false }} />
                </Stack>
                <DeliveryLocationModal />
                <ToastManager />
              </LocationProvider>
            </WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
