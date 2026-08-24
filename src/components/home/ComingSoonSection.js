import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const ComingSoonSection = () => {
  const cards = [
    {
      id: 1,
      subtitle: 'QUALITY CLEAN & FRESH',
      title: 'Dry Fish & Salted',
      image: require('../../../assets/images/promo_dry_fish_1787338379178.jpg'),
      bgColor: '#FEFBF3',
    },
    {
      id: 2,
      subtitle: 'OIL, GHEE & MASALA',
      title: 'Kitchen Essentials',
      image: require('../../../assets/images/promo_masala_1787338394089.jpg'),
      bgColor: '#F3F8FE',
    },
    {
      id: 3,
      subtitle: 'QUALITY RICE FOR EVERY MEAL',
      title: 'PREMIUM RICE',
      image: require('../../../assets/images/promo_rice_1787338409774.jpg'),
      bgColor: '#FFF5F7',
    }
  ];

  return (
    <View className="my-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {cards.map((card) => (
          <View
            key={card.id}
            className="flex-row rounded-2xl overflow-hidden mr-4 shadow-sm border border-gray-100"
            style={{ width: CARD_WIDTH, backgroundColor: card.bgColor, height: 160 }}
          >
            {/* Left Content */}
            <View className="flex-1 p-4 justify-center">
              <Text className="text-[10px] text-gray-500 font-bold mb-1 tracking-widest uppercase">
                {card.subtitle}
              </Text>
              <Text className="text-[20px] font-extrabold text-[#1a202c] mb-4" numberOfLines={2}>
                {card.title}
              </Text>
              
              <View className="flex-row items-center mt-auto">
                <View className="bg-[#e63946] px-3 py-1.5 rounded-md">
                  <Text className="text-white text-xs font-bold">Coming Soon</Text>
                </View>
                <TouchableOpacity className="ml-auto">
                  <Text className="text-[#e63946] text-xs font-bold">Show More ></Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Right Image */}
            <View className="w-[120px] h-full">
              <Image
                source={card.image}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ComingSoonSection;
