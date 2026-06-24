import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from '@env';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import toast from '../../utils/toast';
import { useRouter } from 'expo-router';
import Logo from '../../components/Logo';
import { PhoneInput } from '../../components/ui';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
  offlineAccess: true,
});

const RegisterScreen = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔵 Starting Google Sign-Up...');

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();

      const userData = userInfo.data?.user || userInfo.user || userInfo;
      const googleId = userData.id || userData.googleId || userData.userId;
      const email = userData.email;
      const name = userData.name || userData.displayName;
      const photo = userData.photo || userData.profilePicture || userData.image;

      if (!googleId || !email) {
        throw new Error('Missing required user data from Google Sign-In response');
      }

      const response = await authService.googleLogin({
        googleId,
        email,
        name,
        image: photo,
      });

      if (response.success) {
        await login(response.data.token, response.data.user);
        toast.success('Welcome', 'Google sign-up successful');
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('❌ Google Sign-Up error:', error);

      if (error.code === 'SIGN_IN_CANCELLED') {
        toast.info('Cancelled', 'Google sign-up was cancelled');
      } else if (error.response?.data?.needsRegistration) {
        toast.error('Registration Required', 'Please complete registration first');
      } else {
        toast.error('Google Sign-Up Failed', error.message || 'An error occurred');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
      toast.error('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Error', 'Password must be at least 6 characters');
      return;
    }

    // Validate phone number (basic check for digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Error', 'Please enter a valid phone number');
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
      // Format phone number with country code for backend
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${cleanPhone}`;

      // Register user first
      const response = await authService.register({
        name,
        email,
        phoneNumber: formattedPhone,
        password
      });

      if (response.success) {
        // Navigate to email OTP verification
        router.push({
          pathname: '/(auth)/otp-verification',
          params: {
            email: email,
            name: name,
            isRegistration: 'true'
          }
        });

        toast.success('Registration Successful', 'Please check your email for verification code');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      toast.error('Error', errorMessage);
    } finally {
      setLoading(false);
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
            <View className="flex-1 p-4 justify-center">
              <View className="bg-white rounded-2xl p-6 shadow-sm">
                {/* Logo and Title */}
                <View className="items-center mb-6">
                  <Logo size="large" style={{ marginBottom: 16 }} />
                  <Text className="text-xl font-bold text-gray-800">Create Account</Text>
                  <Text className="text-sm text-gray-500 mt-1">Join LEATS for fresh groceries</Text>
                </View>

                {/* Google Sign Up Button */}
                <TouchableOpacity
                  onPress={handleGoogleSignUp}
                  disabled={loading || googleLoading}
                  className={`border border-gray-300 rounded-lg py-3 mb-4 flex-row items-center justify-center ${googleLoading ? 'opacity-50' : ''}`}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#4285F4" size="small" />
                  ) : (
                    <>
                      <Image
                        source={{ uri: 'https://www.google.com/favicon.ico' }}
                        style={{ width: 20, height: 20, marginRight: 8 }}
                      />
                      <Text className="text-gray-700 font-semibold text-sm">Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-3 text-xs text-gray-500 uppercase">Or continue with</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Registration Form */}
                <View>
                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-sm"
                      placeholder="Enter your name"
                      value={name}
                      onChangeText={setName}
                      editable={!loading && !googleLoading}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-sm"
                      placeholder="Enter email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading && !googleLoading}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number</Text>
                    <PhoneInput
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder="Enter phone number"
                      disabled={loading || googleLoading}
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      📧 OTP will be sent to your email for verification
                    </Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                    <View className="relative">
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm"
                        placeholder="Create password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading && !googleLoading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      Must contain uppercase, lowercase, and number
                    </Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
                    <View className="relative">
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading && !googleLoading}
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
                    onPress={handleRegister}
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-semibold text-sm ml-2">Creating account...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-sm">Create Account</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Terms and Privacy */}
                <Text className="text-xs text-center text-gray-500 mt-4">
                  By creating an account, you agree to our{' '}
                  <Text className="text-red-500">Terms of Service</Text> and{' '}
                  <Text className="text-red-500">Privacy Policy</Text>
                </Text>

                {/* Sign In Link */}
                <View className="mt-6">
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/login')}
                    disabled={loading || googleLoading}
                  >
                    <Text className="text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <Text className="text-red-500 font-semibold">Sign In</Text>
                    </Text>
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

export default RegisterScreen;
