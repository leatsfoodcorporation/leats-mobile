import React from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * SwipeableTabView - Wraps tab screens to enable visual swipe navigation
 * Shows adjacent screens sliding in/out as you swipe
 */
const SwipeableTabView = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Define tab order
  const tabs = [
    { route: '/(tabs)/home', cleanRoute: '/home' },
    { route: '/(tabs)/products', cleanRoute: '/products' },
    { route: '/(tabs)/cart', cleanRoute: '/cart' },
    { route: '/(tabs)/wishlist', cleanRoute: '/wishlist' },
    { route: '/(tabs)/profile', cleanRoute: '/profile' },
  ];

  // Find current tab index
  const getCurrentTabIndex = () => {
    return tabs.findIndex(tab => 
      pathname === tab.cleanRoute || pathname.startsWith(tab.cleanRoute + '/')
    );
  };

  // Navigate to tab
  const navigateToTab = (direction) => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      const prevTab = tabs[currentIndex - 1];
      router.push(prevTab.route);
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      router.push(nextTab.route);
    }
  };

  // Pan gesture handler with proper direction detection
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-15, 15]) // Fail if vertical movement exceeds 15px
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const currentIndex = getCurrentTabIndex();
      
      // Prevent swiping beyond boundaries
      if (currentIndex === 0 && event.translationX > 0) {
        // At first tab, don't allow right swipe
        translateX.value = startX.value + event.translationX * 0.2; // Rubber band effect
      } else if (currentIndex === tabs.length - 1 && event.translationX < 0) {
        // At last tab, don't allow left swipe
        translateX.value = startX.value + event.translationX * 0.2; // Rubber band effect
      } else {
        translateX.value = startX.value + event.translationX;
      }
    })
    .onEnd((event) => {
      const currentIndex = getCurrentTabIndex();
      const swipeThreshold = SCREEN_WIDTH * 0.3; // 30% of screen width
      const velocityThreshold = 800;

      // Check if swipe is strong enough
      const shouldSwipeRight = 
        (event.translationX > swipeThreshold || event.velocityX > velocityThreshold) &&
        currentIndex > 0;
      
      const shouldSwipeLeft = 
        (event.translationX < -swipeThreshold || event.velocityX < -velocityThreshold) &&
        currentIndex < tabs.length - 1;

      if (shouldSwipeRight) {
        // Swipe right - go to previous tab
        translateX.value = withSpring(SCREEN_WIDTH, {
          damping: 25,
          stiffness: 100,
        }, () => {
          runOnJS(navigateToTab)('prev');
          translateX.value = 0;
          startX.value = 0;
        });
      } else if (shouldSwipeLeft) {
        // Swipe left - go to next tab
        translateX.value = withSpring(-SCREEN_WIDTH, {
          damping: 25,
          stiffness: 100,
        }, () => {
          runOnJS(navigateToTab)('next');
          translateX.value = 0;
          startX.value = 0;
        });
      } else {
        // Snap back to original position
        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 100,
        });
        startX.value = 0;
      }
    });

  // Animated style for the container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default SwipeableTabView;
