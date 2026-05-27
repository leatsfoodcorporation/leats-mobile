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
import authService from '../../services/authService';
import toast from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';

const ResetPasswordOTPScreen = () => {
  const { email, isPasswordReset } = useLocalSearchParams();
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  
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

  const sendOTP = async () => {
    try {
      // Use the mobile forgot password endpoint to send OTP
      const result = await authService.forgotPassword(email);
      
      if (result.success) {
        setConfirmation({ email }); // Store email for verification
        toast.success('OTP Sent', `Check your email (${email}) for the verification code`);
      } else {
        toast.error('Error', result.error || 'Failed to send OTP');
        router.back();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send OTP. Please try again';
      toast.error('Error', errorMessage);
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
        setTimeout(() => handleVerifyOTP(fullOtp), 300);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      toast.error('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Actually verify OTP with backend before allowing password reset
      const response = await phoneAuthService.verifyPasswordResetOTP(
        { email }, 
        code
      );

      if (response.success) {
        setOtpVerified(true);
        toast.success('Verified', 'OTP verified! Now set your new password');
      } else {
        toast.error('Error', response.error || 'Invalid OTP');
        // Clear the OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'OTP verification failed';
      toast.error('Error', errorMessage);
      // Clear the OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Error', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Get OTP code
      const otpCode = otp.join('');

      if (otpCode.length !== 6) {
        toast.error('Error', 'Please enter the complete 6-digit OTP');
        setLoading(false);
        return;
      }

      // Call backend to reset password
      const response = await phoneAuthService.resetPassword({
        email,
        newPassword,
        otp: otpCode
      });

      if (response.success) {
        toast.success('Success', 'Password reset successful!');
        
        // Navigate to login
        router.replace('/(auth)/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password reset failed';
      toast.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;

    setResending(true);
    try {
      // Use the mobile forgot password endpoint to resend OTP
      const result = await authService.forgotPassword(email);
      
      if (result.success) {
        setConfirmation({ email });
        toast.success('OTP Sent', `New OTP sent to your email (${email})`);
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error('Error', result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to resend OTP';
      toast.error('Error', errorMessage);
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
              {!otpVerified ? (
                <>
                  {/* Logo */}
                  <View className="items-center mb-6">
                    <Logo size="large" style={{ marginBottom: 16 }} />
                    <Text className="text-xl font-bold text-gray-800">Verify Email</Text>
                    <Text className="text-sm text-gray-500 mt-2 text-center">
                      We've sent a 6-digit code to{'\n'}
                      <Text className="font-semibold text-red-500">{email}</Text>
                    </Text>
                  </View>

                  <View className="bg-red-50 p-3 rounded-lg mb-4">
                    <Text className="text-red-700 text-xs text-center">
                      📧 OTP sent to your registered email
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
                        autoComplete="sms-otp"
                        textContentType="oneTimeCode"
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    className={`bg-red-500 py-3 rounded-lg items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                    onPress={() => handleVerifyOTP()}
                    disabled={loading}
                  >
                    {loading ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-semibold text-sm ml-2">Verifying...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-sm">Verify OTP</Text>
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
                </>
              ) : (
                <>
                  {/* Logo */}
                  <View className="items-center mb-6">
                    <Logo size="large" style={{ marginBottom: 16 }} />
                    <Text className="text-xl font-bold text-gray-800">Set New Password</Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      Enter your new password below
                    </Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">New Password</Text>
                    <View className="relative">
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons 
                          name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color="#6B7280" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
                    <View className="relative">
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color="#6B7280" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    className={`bg-red-500 py-3 rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                    onPress={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-semibold text-sm ml-2">Resetting...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-sm">Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  </>
);
};

export default ResetPasswordOTPScreen;
