import { useState, useRef, useEffect } from 'react';
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
import authService from '../../services/authService';
import toast from '../../utils/toast';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';

const OTPVerificationScreen = () => {
  const { email, onSuccess } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast.error('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOTP({
        email,
        otp: otpCode,
      });

      if (response && response.success) {
        router.replace('/(auth)/login');
        setTimeout(() => {
          toast.success('Email Verified', 'You can now sign in with your credentials');
        }, 500);
        
        if (onSuccess) {
          onSuccess(response.data || response);
        }
      } else {
        toast.error('Error', 'Verification failed. Please try again.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Invalid or expired OTP';
      
      if (errorMessage.includes('already verified')) {
        toast.info('Already Verified', 'Your email is already verified. Redirecting to login...');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      } else {
        toast.error('Verification Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResending(true);
    try {
      const response = await authService.resendOTP({
        email,
      });

      if (response && response.success) {
        toast.success('OTP Sent', 'New OTP sent to your email');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error('Error', 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      toast.error(
        'Error',
        error.response?.data?.error || error.message || 'Failed to resend OTP'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor="#f9fafb" translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#f9fafb' }}>
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
                <Text className="text-xl font-bold text-gray-800">Verify Your Email</Text>
                <Text className="text-sm text-gray-500 mt-2 text-center">
                  We've sent a 6-digit code to{'\n'}
                  <Text className="font-semibold text-red-500">{email}</Text>
                </Text>
              </View>

              <View className="flex-row justify-between mb-6">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    className={`w-12 h-14 border-2 rounded-lg text-2xl font-bold text-center ${
                      digit ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                className={`bg-red-500 py-3 rounded-lg items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-semibold text-sm ml-2">Verifying...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-sm">Verify</Text>
                )}
              </TouchableOpacity>

              <View className="items-center mb-4">
                {canResend ? (
                  <TouchableOpacity onPress={handleResend} disabled={resending}>
                    <Text className="text-red-500 text-sm font-semibold">
                      {resending ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-gray-600 text-sm">
                    Resend code in {timer}s
                  </Text>
                )}
              </View>

              <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <Text className="text-gray-600 text-center text-sm">Change Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  </>
);
};

export default OTPVerificationScreen;
