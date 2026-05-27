import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DatePicker = ({ value, onChange, disabled = false, placeholder = 'Select date' }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(value ? value.getDate() : null);
  const [selectedMonth, setSelectedMonth] = useState(value ? value.getMonth() : null);
  const [selectedYear, setSelectedYear] = useState(value ? value.getFullYear() : null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const handleConfirm = () => {
    if (selectedDay && selectedMonth !== null && selectedYear) {
      const date = new Date(selectedYear, selectedMonth, selectedDay);
      onChange(date);
      setShowPicker(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 bg-white"
      >
        <Text className={value ? 'text-base text-gray-900' : 'text-base text-gray-400'}>
          {formatDate(value)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-40 bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            <View className="flex-row p-4 gap-2">
              {/* Day */}
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Day</Text>
                <ScrollView 
                  className="border border-gray-300 rounded-lg bg-gray-50"
                  style={{ height: 200 }}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      className={`py-3 px-4 border-b border-gray-100 ${
                        selectedDay === day ? 'bg-red-50' : ''
                      }`}
                    >
                      <Text className={`text-center ${
                        selectedDay === day ? 'text-red-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month */}
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Month</Text>
                <ScrollView 
                  className="border border-gray-300 rounded-lg bg-gray-50"
                  style={{ height: 200 }}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedMonth(index)}
                      className={`py-3 px-4 border-b border-gray-100 ${
                        selectedMonth === index ? 'bg-red-50' : ''
                      }`}
                    >
                      <Text className={`text-center ${
                        selectedMonth === index ? 'text-red-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year */}
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Year</Text>
                <ScrollView 
                  className="border border-gray-300 rounded-lg bg-gray-50"
                  style={{ height: 200 }}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => setSelectedYear(year)}
                      className={`py-3 px-4 border-b border-gray-100 ${
                        selectedYear === year ? 'bg-red-50' : ''
                      }`}
                    >
                      <Text className={`text-center ${
                        selectedYear === year ? 'text-red-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Confirm Button */}
            <View className="px-4 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!selectedDay || selectedMonth === null || !selectedYear}
                className={`py-3 rounded-lg ${
                  selectedDay && selectedMonth !== null && selectedYear
                    ? 'bg-red-500'
                    : 'bg-gray-300'
                }`}
              >
                <Text className="text-center text-white font-medium text-base">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DatePicker;
