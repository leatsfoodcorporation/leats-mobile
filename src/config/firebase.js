import { Platform } from 'react-native';

/**
 * Firebase Configuration
 * This file initializes Firebase for React Native
 * 
 * IMPORTANT:
 * - Android: Uses google-services.json (automatically loaded by @react-native-firebase/app)
 * - iOS: Uses GoogleService-Info.plist (automatically loaded by @react-native-firebase/app)
 * 
 * No manual initialization needed for React Native Firebase!
 * The native modules handle configuration automatically.
 */

// Firebase is automatically initialized by @react-native-firebase/app
// using the google-services.json (Android) and GoogleService-Info.plist (iOS)

// Export Firebase config for reference (optional)
export const firebaseConfig = {
  apiKey: 'AIzaSyCZ5aVT3sjHzVd3ILbOv8Hx3te23dtwJNI',
  projectId: 'leats-food-corporation-6cf78',
  appId: Platform.select({
    android: '1:352155423348:android:223cc7a322a80ad4c8b721',
    ios: '1:352155423348:ios:04d96248ffee2e2ec8b721', // Add iOS app ID when available
  }),
  messagingSenderId: '352155423348',
  projectNumber: '352155423348',
  storageBucket: 'leats-food-corporation-6cf78.firebasestorage.app',
  databaseURL: 'https://leats-food-corporation-6cf78-default-rtdb.firebaseio.com',
};

// Log Firebase initialization
console.log('🔥 Firebase config loaded for platform:', Platform.OS);
console.log('📱 Project ID:', firebaseConfig.projectId);

export default firebaseConfig;
