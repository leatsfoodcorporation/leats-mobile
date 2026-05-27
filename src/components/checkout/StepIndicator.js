import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StepIndicator = ({ step, label, active, completed }) => (
  <View className="items-center">
    <View
      className={`w-8 h-8 rounded-full items-center justify-center ${
        completed
          ? 'bg-green-500'
          : active
          ? 'bg-[#e63946]'
          : 'bg-gray-300'
      }`}
    >
      {completed ? (
        <Ionicons name="checkmark" size={18} color="#fff" />
      ) : (
        <Text className="text-white font-bold text-sm">{step}</Text>
      )}
    </View>
    <Text
      className={`text-xs mt-1 ${
        active ? 'text-[#e63946] font-semibold' : 'text-gray-500'
      }`}
    >
      {label}
    </Text>
  </View>
);

export default StepIndicator;
