import { useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomToast = ({ visible, type, message, description, onHide }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Auto-hide timer
  const hideTimerRef = useRef(null);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped more than 100px, dismiss
        if (Math.abs(gestureState.dx) > 100) {
          dismissToast(gestureState.dx > 0 ? 'right' : 'left');
        } else {
          // Spring back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      showToast();
    } else {
      hideToast();
    }
  }, [visible]);

  const showToast = () => {
    // Clear any existing timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    // Reset position
    translateX.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after duration
    const duration = type === 'error' ? 4000 : 3000;
    hideTimerRef.current = setTimeout(() => {
      dismissToast('up');
    }, duration);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dismissToast = (direction) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    if (direction === 'left' || direction === 'right') {
      // Swipe out animation
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: direction === 'right' ? 500 : -500,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    } else {
      // Slide up animation
      hideToast();
      setTimeout(onHide, 300);
    }
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#FFFFFF',
          borderLeftColor: '#10B981',
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          textColor: '#1F2937',
        };
      case 'error':
        return {
          backgroundColor: '#FFFFFF',
          borderLeftColor: '#EF4444',
          icon: 'close-circle',
          iconColor: '#EF4444',
          textColor: '#1F2937',
        };
      case 'info':
        return {
          backgroundColor: '#FFFFFF',
          borderLeftColor: '#3B82F6',
          icon: 'information-circle',
          iconColor: '#3B82F6',
          textColor: '#1F2937',
        };
      case 'warning':
        return {
          backgroundColor: '#FFFFFF',
          borderLeftColor: '#F59E0B',
          icon: 'warning',
          iconColor: '#F59E0B',
          textColor: '#1F2937',
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderLeftColor: '#6B7280',
          icon: 'information-circle',
          iconColor: '#6B7280',
          textColor: '#1F2937',
        };
    }
  };

  if (!visible) return null;

  const config = getToastConfig();

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }, { translateX }],
        opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => dismissToast('up')}
        style={{
          backgroundColor: config.backgroundColor,
          borderLeftWidth: 4,
          borderLeftColor: config.borderLeftColor,
          borderRadius: 8,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {/* Icon */}
        <Ionicons name={config.icon} size={24} color={config.iconColor} />

        {/* Content */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              color: config.textColor,
              fontSize: 14,
              fontWeight: '600',
              marginBottom: description ? 4 : 0,
            }}
            numberOfLines={2}
          >
            {message}
          </Text>
          {description && (
            <Text
              style={{
                color: config.textColor,
                fontSize: 12,
                opacity: 0.7,
              }}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CustomToast;
