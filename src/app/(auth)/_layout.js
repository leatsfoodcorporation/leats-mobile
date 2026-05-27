import { Stack } from 'expo-router';

const PRIMARY_COLOR = '#e63946';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="otp-verification" 
        options={{ 
          headerShown: true,
          title: 'Verify Email',
          headerStyle: {
            backgroundColor: PRIMARY_COLOR,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
    </Stack>
  );
}
