import '../../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { LocationProvider } from '../context/LocationContext';
import { NotificationProvider } from '../context/NotificationContext.js';
// TODO: Enable real-time socket provider in future
// import { SocketProvider } from '../context/SocketContext';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import ToastManager from '../components/ToastManager';
import { useEffect } from 'react';
import DeliveryLocationModal from '../components/DeliveryLocationModal';

// Firebase is automatically initialized by @react-native-firebase/app
// No manual initialization needed for React Native Firebase
import '@react-native-firebase/auth';
import '@react-native-firebase/messaging';
import { PRIMARY_COLOR } from '../constants/theme';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Fade out native splash smoothly when hideAsync is called
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  useEffect(() => {
    // Firebase is automatically initialized by React Native Firebase
    console.log('🔥 Firebase initialized automatically by React Native Firebase');
  }, []);

  return (
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            {/* TODO: Enable SocketProvider in future for real-time features */}
            {/* <SocketProvider> */}
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
            {/* </SocketProvider> */}
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
  );
}