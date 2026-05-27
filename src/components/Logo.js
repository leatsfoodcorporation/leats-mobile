import { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { getWebSettings } from '../services/webSettingsService';
import { getFullImageUrl } from '../lib/image-utils';

/**
 * Logo Component
 * Displays web settings logo or fallback text
 * Used across the app for consistent branding
 */
const Logo = ({ size = 'medium', style }) => {
  const [webSettings, setWebSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebSettings();
  }, []);

  const fetchWebSettings = async () => {
    try {
      const response = await getWebSettings();
      if (response.success && response.data) {
        setWebSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching web settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Size configurations
  const sizes = {
    small: { width: 60, height: 24, textSize: 'text-base' },
    medium: { width: 80, height: 32, textSize: 'text-xl' },
    large: { width: 100, height: 40, textSize: 'text-2xl' },
    xlarge: { width: 120, height: 48, textSize: 'text-3xl' },
  };

  const currentSize = sizes[size] || sizes.medium;

  if (loading) {
    return (
      <View 
        style={[
          { 
            width: currentSize.width, 
            height: currentSize.height,
            justifyContent: 'center',
            alignItems: 'center'
          },
          style
        ]}
      >
        <ActivityIndicator size="small" color="#e63946" />
      </View>
    );
  }

  // Show logo image if available
  if (webSettings?.logoUrl && webSettings.logoUrl.trim() !== '') {
    return (
      <Image
        source={{ uri: getFullImageUrl(webSettings.logoUrl) }}
        style={[
          { 
            width: currentSize.width, 
            height: currentSize.height 
          },
          style
        ]}
        resizeMode="contain"
        transition={200}
        priority="high"
        cachePolicy="memory-disk"
      />
    );
  }

  // Fallback to text logo
  return (
    <View style={style}>
      <Text className={`text-[#e63946] font-bold ${currentSize.textSize}`}>
        LEATS
      </Text>
    </View>
  );
};

export default Logo;
