import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import toast from '../../utils/toast';
import authService from '../../services/authService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';

const ForgotPasswordScreen = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Error', 'Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        toast.success('OTP Sent', 'Check your email for the reset code');
        router.push({
          pathname: '/(auth)/reset-password-otp',
          params: { 
            email: email,
            isPasswordReset: 'true'
          }
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send reset email';
      toast.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#e63946' }}>
        <View 
          className="flex-1 bg-gray-50"
          style={{ 
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
      <KeyboardAwareScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-4">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <View className="flex-1 justify-center">
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              {/* Logo */}
              <View className="items-center mb-6">
                <Logo size="large" style={{ marginBottom: 16 }} />
                <Text className="text-xl font-bold text-gray-800">Forgot Password?</Text>
                <Text className="text-sm text-gray-500 mt-1 text-center">
                  Enter your email address to reset password
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email Address</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  📧 OTP will be sent to this email address
                </Text>
              </View>

              <TouchableOpacity
                className={`bg-red-500 py-3 rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-semibold text-sm ml-2">Sending...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-sm">Send OTP</Text>
                )}
              </TouchableOpacity>

              <View className="mt-6">
                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={loading}
                >
                  <Text className="text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Text className="text-red-500 font-semibold">Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  </>
);
};

export default ForgotPasswordScreen;
