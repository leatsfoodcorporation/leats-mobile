import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import phoneAuthService from '../../services/phoneAuthService';
import { useAuth } from '../../context/AuthContext';
import toast from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';

const SMSOTPVerificationScreen = () => {
  const { 
    email, 
    name, 
    isRegistration 
  } = useLocalSearchParams();
  
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  
  const inputRefs = useRef([]);

  // Send OTP on mount
  useEffect(() => {
    sendOTP();
  }, []);

  // Timer countdown
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

  // Auto-fill OTP on Android - Not applicable for email OTP
  useEffect(() => {
    if (Platform.OS === 'android') {
      console.log('📧 Email OTP - manual entry required');
    }
  }, []);

  const sendOTP = async () => {
    try {
      const result = await phoneAuthService.sendSMSOTP(email);
      
      if (result.success) {
        setConfirmation(result.confirmation);
        toast.success('OTP Sent', `Check your email (${result.email}) for the verification code`);
      } else {
        toast.error('Error', result.error);
        router.back();
      }
    } catch (error) {
      toast.error('Error', 'Failed to send OTP. Please try again');
      router.back();
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('');
      if (fullOtp.length === 6) {
        setTimeout(() => handleVerify(fullOtp), 300);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      toast.error('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (!confirmation) {
      toast.error('Error', 'Session expired. Please request a new OTP');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Backend
      const verifyResult = await phoneAuthService.verifySMSOTP(confirmation, code);
      
      if (!verifyResult.success) {
        toast.error('Verification Failed', verifyResult.error);
        setLoading(false);
        return;
      }

      // Login successful - token received from verification
      await login(verifyResult.token, verifyResult.user);
      toast.success('Welcome', isRegistration === 'true' ? 'Registration completed!' : 'Login successful');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(
        'Error',
        error.response?.data?.error || error.message || 'Verification failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;

    setResending(true);
    try {
      const result = await phoneAuthService.sendSMSOTP(email);
      
      if (result.success) {
        setConfirmation(result.confirmation);
        toast.success('OTP Sent', 'New OTP sent to your email');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error('Error', result.error);
      }
    } catch (error) {
      toast.error('Error', 'Failed to resend OTP');
    } finally {
      setResending(false);
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
                <Text className="text-xl font-bold text-gray-800">Verify Email</Text>
                <Text className="text-sm text-gray-500 mt-2 text-center">
                  We've sent a 6-digit code to{'\n'}
                  <Text className="font-semibold text-red-500">{email}</Text>
                </Text>
              </View>

              {Platform.OS === 'android' && (
                <View className="bg-red-50 p-3 rounded-lg mb-4">
                  <Text className="text-red-700 text-xs text-center">
                    📧 OTP sent to your registered email
                  </Text>
                </View>
              )}

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
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                  />
                ))}
              </View>

              <TouchableOpacity
                className={`bg-red-500 py-3 rounded-lg items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                onPress={() => handleVerify()}
                disabled={loading}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-semibold text-sm ml-2">Verifying...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-sm">Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <View className="items-center mb-4">
                {canResend ? (
                  <TouchableOpacity onPress={handleResend} disabled={resending}>
                    <Text className="text-red-500 text-sm font-semibold">
                      {resending ? 'Sending...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-gray-600 text-sm">
                    Resend OTP in {timer}s
                  </Text>
                )}
              </View>

              <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <Text className="text-gray-600 text-center text-sm">Change Email Address</Text>
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

export default SMSOTPVerificationScreen;
