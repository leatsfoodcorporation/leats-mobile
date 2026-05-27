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

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneInput, setIsPhoneInput] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      toast.error('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      // Determine if input is email or phone
      const isEmail = /\S+@\S+\.\S+/.test(emailOrPhone);
      let loginIdentifier = emailOrPhone;

      // If it's a phone number, ensure it has country code
      if (!isEmail) {
        const cleanPhone = emailOrPhone.replace(/\D/g, '');
        // If user entered just digits without +91, add it
        if (!emailOrPhone.startsWith('+')) {
          loginIdentifier = `+91${cleanPhone}`;
        }
      }

      // Get FCM token before login
      let fcmToken = null;
      try {
        const messaging = (await import('@react-native-firebase/messaging')).default;
        fcmToken = await messaging().getToken();
        console.log('📱 FCM Token obtained:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'None');
      } catch (fcmError) {
        console.error('⚠️ Failed to get FCM token:', fcmError);
      }

      const response = await authService.login({
        email: loginIdentifier, // Backend accepts both email and phone in this field
        password,
        fcmToken, // Send FCM token with login request
      });

      if (response.success) {
        await login(response.data.token, response.data.user);
        toast.success('Welcome Back', 'Login successful');
        
        // Navigate to home screen
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      const errorData = error.response?.data;
      
      if (errorData?.needsVerification) {
        toast.error('Verification Required', errorData.error);
      } else if (errorData?.useGoogleAuth) {
        toast.info('Google Account', 'Please sign in with Google');
      } else {
        toast.error(
          'Login Failed',
          errorData?.error || 'Invalid credentials'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔵 Starting Google Sign-In...');
      console.log('📋 Using Web Client ID:', GOOGLE_CLIENT_ID);
      
      // Check Play Services availability
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Play Services available');
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('📱 Google Sign-In response:', JSON.stringify(userInfo, null, 2));
      
      // Extract user data from nested structure
      const userData = userInfo.data?.user || userInfo.user || userInfo;
      const googleId = userData.id || userData.googleId || userData.userId;
      const email = userData.email;
      const name = userData.name || userData.displayName;
      const photo = userData.photo || userData.profilePicture || userData.image;
      
      console.log('👤 Extracted user data:', { googleId, email, name, photo });
      
      if (!googleId || !email) {
        console.error('❌ Missing required user data:', { googleId, email });
        throw new Error('Missing required user data from Google Sign-In response');
      }

      // Get FCM token before login
      let fcmToken = null;
      try {
        const messaging = (await import('@react-native-firebase/messaging')).default;
        fcmToken = await messaging().getToken();
        console.log('📱 FCM Token obtained:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'None');
      } catch (fcmError) {
        console.error('⚠️ Failed to get FCM token:', fcmError);
      }

      console.log('🔄 Sending to backend (mobile route - no auto-register)...');
      const response = await authService.googleLogin({
        googleId,
        email,
        name,
        image: photo,
        fcmToken, // Send FCM token with Google login
      });

      console.log('✅ Backend response:', response);

      if (response.success) {
        await login(response.data.token, response.data.user);
        toast.success('Welcome', 'Google login successful');
        
        // Navigate to home screen
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        toast.info('Cancelled', 'Google sign-in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        toast.info('In Progress', 'Google sign-in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        toast.error('Error', 'Google Play Services not available');
      } else if (error.code === 10 || error.message?.includes('DEVELOPER_ERROR')) {
        // DEVELOPER_ERROR - Configuration issue
        console.error('🔧 DEVELOPER_ERROR - Configuration Issue:');
        console.error('1. Check if SHA-1 fingerprint is added to Firebase Console');
        console.error('2. Verify GOOGLE_CLIENT_ID in .env matches Web Client ID from Firebase');
        console.error('3. Ensure google-services.json is up to date');
        console.error('Current Web Client ID:', GOOGLE_CLIENT_ID);
        
        toast.error(
          'Configuration Error',
          'Google Sign-In is not properly configured. Please contact support.'
        );
      } else if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if user needs to register first
        if (errorData.needsRegistration) {
          toast.error(
            'Registration Required',
            'Please register first before using Google Sign-In'
          );
          setTimeout(() => {
            router.push('/(auth)/register');
          }, 2000);
        } else {
          toast.error(
            'Google Login Failed',
            errorData.error || 'Backend authentication failed'
          );
        }
      } else {
        toast.error(
          'Google Login Failed',
          error.message || 'An error occurred during Google Sign-In'
        );
      }
    } finally {
      setGoogleLoading(false);
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
        <View className="flex-1 p-4 justify-center">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Logo and Title */}
            <View className="items-center mb-6">
              <Logo size="large" style={{ marginBottom: 16 }} />
              <Text className="text-xl font-bold text-gray-800">Welcome Back!</Text>
              <Text className="text-sm text-gray-500 mt-1">Sign in to continue</Text>
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
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

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-3 text-xs text-gray-500 uppercase">Or continue with</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Email/Phone/Password Form */}
            <View>
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email or Phone</Text>
                {isPhoneInput ? (
                  <PhoneInput
                    value={emailOrPhone}
                    onChange={setEmailOrPhone}
                    placeholder="Enter phone number"
                    disabled={loading || googleLoading}
                  />
                ) : (
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm"
                    placeholder="Enter email or phone"
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading && !googleLoading}
                  />
                )}
                <TouchableOpacity
                  onPress={() => {
                    setIsPhoneInput(!isPhoneInput);
                    setEmailOrPhone('');
                  }}
                  className="mt-2"
                  disabled={loading || googleLoading}
                >
                  <Text className="text-xs text-red-500">
                    {isPhoneInput ? 'Use email instead' : 'Use phone number instead'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                <View className="relative">
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm"
                    placeholder="Enter password"
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
              </View>

              <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                  disabled={loading || googleLoading}
                >
                  <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${rememberMe ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text className="text-sm text-gray-600">Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  disabled={loading || googleLoading}
                >
                  <Text className="text-sm text-red-500">Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className={`bg-red-500 py-3 rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                onPress={handleLogin}
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-semibold text-sm ml-2">Signing in...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-sm">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Create Account Link */}
            <View className="mt-6">
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                disabled={loading || googleLoading}
              >
                <Text className="text-center text-sm text-gray-600">
                  New to LEATS?{' '}
                  <Text className="text-red-500 font-semibold">Create Account</Text>
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

export default LoginScreen;
