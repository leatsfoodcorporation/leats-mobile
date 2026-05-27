import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import PolicyComponent from '../../components/info/PolicyComponent';

export default function TermsConditionsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#e63946' }}>
        <View style={[styles.container]}>
          <Stack.Screen
            options={{
              title: 'Terms & Conditions',
              headerShown: true,
              headerStyle: { backgroundColor: '#e63946' },
              headerTintColor: '#fff',
            }}
          />
          <PolicyComponent slug="terms-conditions" defaultTitle="Terms & Conditions" />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
