import { Stack } from 'expo-router';
import BottomTabBar from '../../components/BottomTabBar';
import { View } from 'react-native';
import { TabRefreshProvider } from '../../context/TabRefreshContext';

export default function TabsLayout() {
  return (
    <TabRefreshProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="products" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ headerShown: false }} />
          <Stack.Screen name="wishlist" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
        <BottomTabBar />
      </View>
    </TabRefreshProvider>
  );
}
