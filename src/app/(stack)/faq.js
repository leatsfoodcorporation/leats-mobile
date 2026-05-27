import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import FAQComponent from '../../components/info/FAQComponent';

export default function FAQScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" backgroundColor="#e63946" translucent={true} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: '#e63946' }}>
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          <Stack.Screen
            options={{
              title: 'FAQ',
              headerShown: true,
              headerStyle: { backgroundColor: '#e63946' },
              headerTintColor: '#fff',
            }}
          />
          <FAQComponent />
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
