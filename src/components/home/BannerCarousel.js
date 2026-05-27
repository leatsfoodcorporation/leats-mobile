import { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { getFullImageUrl } from '../../lib/image-utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 24; // 12px padding on each side
const BANNER_HEIGHT = 160;

const BannerCarousel = memo(({ banners = [], loading = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoScrollTimer = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  // Convert frontend route to mobile route
  const getMobileRoute = (linkUrl) => {
    if (!linkUrl) return '/(tabs)/products';
    
    // Remove leading slash if present
    const cleanUrl = linkUrl.startsWith('/') ? linkUrl.slice(1) : linkUrl;
    
    // Handle product detail routes: /products/slug/id
    // Example: products/chicken-leg-piece-500gm/696552ba5d8e6325ed564d48f
    if (cleanUrl.startsWith('products/') && cleanUrl.split('/').length >= 3) {
      // Extract the product ID (last part of the URL)
      const parts = cleanUrl.split('/');
      const productId = parts[parts.length - 1];
      
      // Return the route with productId parameter (not id)
      return {
        pathname: '/(stack)/product-detail',
        params: { productId: productId }
      };
    }
    
    // Map frontend routes to mobile routes
    const routeMap = {
      'products': '/(tabs)/products',
      'cart': '/(tabs)/cart',
      'profile': '/(tabs)/profile',
      'home': '/(tabs)/home',
    };
    
    // Check if it's a direct match
    if (routeMap[cleanUrl]) {
      return routeMap[cleanUrl];
    }
    
    // Check if it starts with a known route
    for (const [key, value] of Object.entries(routeMap)) {
      if (cleanUrl.startsWith(key + '/') || cleanUrl.startsWith(key + '?')) {
        return value;
      }
    }
    
    // Default to products page
    return '/(tabs)/products';
  };

  // Auto-slide effect
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const startAutoScroll = () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
      
      autoScrollTimer.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [banners.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // PanResponder for touch handling (similar to HeroSection's touch events)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond if horizontal movement is significant
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: (_, gestureState) => {
        // Touch started
        touchStartX.current = gestureState.x0;
        isDragging.current = true;
        
        // Pause auto-scroll
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Track touch movement
        touchEndX.current = gestureState.moveX;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Touch ended
        isDragging.current = false;
        const swipeDistance = touchStartX.current - gestureState.moveX;
        
        // Swipe threshold: 50px (same as HeroSection)
        if (swipeDistance > 50) {
          // Swipe left - go to next
          goToNext();
        } else if (swipeDistance < -50) {
          // Swipe right - go to previous
          goToPrev();
        }
        
        // Resume auto-scroll
        if (banners.length > 1) {
          autoScrollTimer.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
          }, 5000);
        }
      },
      onPanResponderTerminate: () => {
        // Touch cancelled
        isDragging.current = false;
        
        // Resume auto-scroll
        if (banners.length > 1) {
          autoScrollTimer.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
          }, 5000);
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View className="mx-3 my-2">
        <View 
          className="bg-gray-200 rounded-xl overflow-hidden items-center justify-center"
          style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
        >
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View className="mx-3 my-2">
      {/* Banner Container with Touch Scroll Support */}
      <View 
        className="relative rounded-xl overflow-hidden"
        style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
        {...panResponder.panHandlers}
      >
        {/* Banner Images with Fade Transition */}
        {banners.map((banner, index) => (
          <View
            key={banner.id || index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: index === currentSlide ? 1 : 0,
              zIndex: index === currentSlide ? 10 : 0,
            }}
          >
            {/* Banner Link Wrapper - Use linkUrl if exists, otherwise /products */}
            <Link
              href={getMobileRoute(banner.linkUrl)}
              asChild
              disabled={isDragging.current}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                style={{ width: '100%', height: '100%' }}
                disabled={isDragging.current}
              >
                <Image
                  source={{ uri: getFullImageUrl(banner.imageUrl) }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                  
                  priority={index === 0 ? 'high' : 'normal'}
                  cachePolicy="memory-disk"
                  recyclingKey={`banner-${banner.id}`}
                />
              </TouchableOpacity>
            </Link>
          </View>
        ))}

        {/* Dots Indicator - Inside banner at bottom (like HeroSection) */}
        {banners.length > 1 && (
          <View 
            style={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              zIndex: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {banners.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentSlide ? '#e63946' : 'rgba(255, 255, 255, 0.7)',
                  width: index === currentSlide ? 24 : 8,
                }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

BannerCarousel.displayName = 'BannerCarousel';

export default BannerCarousel;
