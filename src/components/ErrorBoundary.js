import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🚨 Error Boundary Caught Error:');
    console.error('📛 Error:', error);
    console.error('📛 Message:', error?.message);
    console.error('📛 Stack:', error?.stack);
    
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary - Component Stack:');
    console.error('📛 Error:', error);
    console.error('📛 Error Info:', errorInfo);
    console.error('📛 Component Stack:', errorInfo?.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    console.log('🔄 Resetting error boundary...');
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-red-50">
          <ScrollView className="flex-1 p-5">
            <View className="items-center mb-5">
              <Text className="text-6xl mb-3">⚠️</Text>
              <Text className="text-2xl font-bold text-red-600 mb-2">
                Something went wrong
              </Text>
              <Text className="text-base text-gray-600 text-center mb-5">
                The app encountered an error. Check the console for details.
              </Text>
            </View>

            <View className="bg-white p-4 rounded-lg mb-4 border border-red-200">
              <Text className="text-sm font-bold text-red-600 mb-2">
                Error Message:
              </Text>
              <Text className="text-sm text-gray-800 mb-3">
                {this.state.error?.toString()}
              </Text>

              {this.state.error?.stack && (
                <View>
                  <Text className="text-sm font-bold text-red-600 mb-2">
                    Stack Trace:
                  </Text>
                  <ScrollView 
                    horizontal 
                    className="bg-gray-100 p-2 rounded"
                    style={{ maxHeight: 200 }}
                  >
                    <Text className="text-xs text-gray-700 font-mono">
                      {this.state.error.stack}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity
              className="bg-red-600 p-4 rounded-xl items-center"
              onPress={this.handleReset}
            >
              <Text className="text-white text-base font-bold">
                Try Again
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 text-center mt-4">
              💡 Tip: Check the terminal console for detailed error logs
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
