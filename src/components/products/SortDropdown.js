import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY_COLOR = '#e63946';

const SortDropdown = ({ options = [], value, onChange }) => {
  const [showModal, setShowModal] = useState(false);
  const insets = useSafeAreaInsets();
  
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="flex-row items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
      >
        <Ionicons name="swap-vertical" size={16} color="#6B7280" />
        <Text className="text-sm text-gray-600">Sort</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowModal(false)}
        >
          <Pressable 
            className="bg-white rounded-t-2xl"
            style={{ paddingBottom: insets.bottom || 8 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-center">Sort By</Text>
            </View>
            
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setShowModal(false);
                }}
                className="flex-row items-center justify-between p-4 border-b border-gray-100"
              >
                <Text className={`text-base ${
                  value === option.value
                    ? 'text-[#e63946] font-semibold'
                    : 'text-gray-700'
                }`}>
                  {option.label}
                </Text>
                {value === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default SortDropdown;
