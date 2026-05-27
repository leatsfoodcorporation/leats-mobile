import { memo } from 'react';
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PRIMARY_COLOR } from '../constants/theme';

const LoginRequired = memo(({ 
  title = "Sign In Required",
  message = "Please sign in to access this feature",
  icon = "lock-closed-outline"
}) => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center p-6 bg-gray-50">
      {/* Icon */}
      <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: `${PRIMARY_COLOR}15` }}>
        <Ionicons name={icon} size={48} color={PRIMARY_COLOR} />
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {title}
      </Text>

      {/* Message */}
      <Text className="text-base text-gray-600 mb-8 text-center px-4">
        {message}
      </Text>

      {/* Login Button */}
      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        className="px-8 py-4 rounded-xl mb-3 w-full max-w-xs"
        style={{ backgroundColor: PRIMARY_COLOR }}
      >
        <Text className="text-white text-base font-bold text-center">
          Sign In
        </Text>
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity
        onPress={() => router.push('/(auth)/register')}
        className="px-8 py-3"
      >
        <Text className="text-gray-600 text-center">
          Don't have an account?{' '}
          <Text className="font-semibold" style={{ color: PRIMARY_COLOR }}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
});

LoginRequired.displayName = 'LoginRequired';

export default LoginRequired;
