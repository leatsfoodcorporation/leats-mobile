import React, { memo, useContext, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TabRefreshContext from '../context/TabRefreshContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const SCREEN_WIDTH  = Dimensions.get('window').width;
const ACCENT        = '#e63946';
const ACCENT_SOFT   = '#FFF0F1';
const ACCENT_MID    = '#FFBFC3';
const WHITE         = '#FFFFFF';
const LABEL_IDLE    = '#B8C0CC';
const TAB_COUNT     = 5;
const BAR_H         = 68;
const CENTER_SIZE   = 58;
const DOT_W         = 5;
const TAB_W         = SCREEN_WIDTH / TAB_COUNT;
// Active background pill — tall enough for icon + label inside
const ACTIVE_BG_W   = TAB_W - 10;
const ACTIVE_BG_H   = 54;
const ACTIVE_BG_R   = 20;

// ─── Sliding Active Background Pill ─────────────────────────────────────────
const SlidingActiveBg = memo(({ activeIndex, tabs }) => {
  const isCenter = tabs[activeIndex]?.isCenter;
  const targetX  = TAB_W * activeIndex + 5;

  const tx      = useRef(new Animated.Value(targetX)).current;
  const scaleY  = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(isCenter ? 0 : 1)).current;

  useEffect(() => {
    const nowCenter = tabs[activeIndex]?.isCenter;
    Animated.parallel([
      Animated.spring(tx, {
        toValue: TAB_W * activeIndex + 5,
        useNativeDriver: true,
        damping: 22,
        stiffness: 210,
        mass: 0.8,
      }),
      Animated.sequence([
        Animated.timing(scaleY, { toValue: 0.88, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleY, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 260 }),
      ]),
      Animated.timing(opacity, {
        toValue: nowCenter ? 0 : 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

  // Center pill vertically: top border (1.5) + (BAR_H - ACTIVE_BG_H) / 2
  const topOffset = 1.5 + (BAR_H - ACTIVE_BG_H) / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.activeBgPill,
        {
          width: ACTIVE_BG_W,
          top: topOffset,
          opacity,
          transform: [{ translateX: tx }, { scaleY }],
        },
      ]}
    />
  );
});

// ─── Animated Sliding Dot (top accent) ─────────────────────────────────────
const SlidingDot = memo(({ activeIndex }) => {
  const dotX  = useRef(new Animated.Value(TAB_W * activeIndex + (TAB_W - DOT_W) / 2)).current;
  const scaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const toX = TAB_W * activeIndex + (TAB_W - DOT_W) / 2;
    Animated.parallel([
      Animated.spring(dotX, {
        toValue: toX,
        useNativeDriver: true,
        damping: 22,
        stiffness: 230,
        mass: 0.75,
      }),
      Animated.sequence([
        Animated.timing(scaleX, { toValue: 2.2, duration: 130, useNativeDriver: true }),
        Animated.spring(scaleX, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 240 }),
      ]),
    ]).start();
  }, [activeIndex]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.slidingDot, { transform: [{ translateX: dotX }, { scaleX }] }]}
    />
  );
});

// ─── Badge ──────────────────────────────────────────────────────────────────
const Badge = memo(({ count, large }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 7,
        stiffness: 300,
      }).start();
    }
  }, [count]);

  if (!count || count <= 0) return null;
  const label = large ? (count > 99 ? '99+' : `${count}`) : (count > 9 ? '9+' : `${count}`);

  return (
    <Animated.View
      style={[large ? styles.centerBadge : styles.badge, { transform: [{ scale: anim }] }]}
    >
      <Text style={large ? styles.centerBadgeText : styles.badgeText}>{label}</Text>
    </Animated.View>
  );
});

// ─── Center Cart Button ─────────────────────────────────────────────────────
const CenterButton = memo(({ tab, active, onPress }) => {
  const btnScale    = useRef(new Animated.Value(1)).current;
  const ring1Rotate = useRef(new Animated.Value(0)).current; // slow clockwise
  const ring2Rotate = useRef(new Animated.Value(0)).current; // fast counter-clockwise
  const ring1Ref    = useRef(null);
  const ring2Ref    = useRef(null);

  // ── Always-running spin animations (start on mount, never stop) ────────────
  useEffect(() => {
    ring1Ref.current = Animated.loop(
      Animated.timing(ring1Rotate, {
        toValue: 1,
        duration: 2800,
        useNativeDriver: true,
      })
    );
    ring1Ref.current.start();

    ring2Ref.current = Animated.loop(
      Animated.timing(ring2Rotate, {
        toValue: -1,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    ring2Ref.current.start();

    return () => {
      ring1Ref.current?.stop();
      ring2Ref.current?.stop();
    };
  }, []);

  // ── Active scale bump ──────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(btnScale, {
      toValue: active ? 1.08 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 200,
    }).start();
  }, [active]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.84, useNativeDriver: true, damping: 4, stiffness: 700 }),
      Animated.spring(btnScale, {
        toValue: active ? 1.08 : 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 220,
      }),
    ]).start();
    onPress(tab);
  }, [active, tab, onPress]);

  const spin1 = ring1Rotate.interpolate({ inputRange: [0, 1],  outputRange: ['0deg',   '360deg']  });
  const spin2 = ring2Rotate.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg','0deg'] });

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.centerBtn}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.centerOuter, { transform: [{ scale: btnScale }] }]}>

        {/* Ring 1 — dashed, slow clockwise */}
        <Animated.View
          pointerEvents="none"
          style={[styles.orbitRing, styles.orbitRing1, { transform: [{ rotate: spin1 }] }]}
        />

        {/* Ring 2 — dashed, fast counter-clockwise */}
        <Animated.View
          pointerEvents="none"
          style={[styles.orbitRing, styles.orbitRing2, { transform: [{ rotate: spin2 }] }]}
        />

        {/* Main gradient button */}
        <LinearGradient
          colors={active ? [ACCENT, '#B01020'] : ['#EDEFF4', '#DDE1EA']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[
            styles.centerGradient,
            active && Platform.OS === 'ios' && styles.centerGradientShadow,
          ]}
        >
          <Ionicons
            name={active ? tab.icon : tab.iconOutline}
            size={26}
            color={active ? WHITE : LABEL_IDLE}
          />
          {tab.badge > 0 && <Badge count={tab.badge} large />}
        </LinearGradient>
      </Animated.View>

      <Text style={[styles.tabLabel, { color: active ? ACCENT : LABEL_IDLE, marginTop: 5 }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Regular Tab Button ─────────────────────────────────────────────────────
const TabButton = memo(({ tab, active, onPress }) => {
  const groupS  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(groupS, {
      toValue: active ? 1.06 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 200,
    }).start();
  }, [active]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(groupS, { toValue: 0.88, useNativeDriver: true, damping: 4, stiffness: 700 }),
      Animated.spring(groupS, {
        toValue: active ? 1.06 : 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 220,
      }),
    ]).start();
    onPress(tab);
  }, [active, tab, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.tabBtn}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
    >
      {/* Icon + label together scale as one group, stays inside the pill */}
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: groupS }] }]}
      >
        <View style={styles.iconArea}>
          <Ionicons
            name={active ? tab.icon : tab.iconOutline}
            size={22}
            color={active ? ACCENT : LABEL_IDLE}
          />
          {tab.badge > 0 && <Badge count={tab.badge} large={false} />}
        </View>

        {/* Label always visible */}
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            {
              color: active ? ACCENT : LABEL_IDLE,
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── Main BottomTabBar ───────────────────────────────────────────────────────
const BottomTabBar = memo(() => {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const { triggerRefresh } = useContext(TabRefreshContext);
  const { cartCount }      = useCart();
  const { wishlistCount }  = useWishlist();

  const tabs = [
    {
      name: 'home',
      route: '/(tabs)/home',
      cleanRoute: '/home',
      icon: 'home',
      iconOutline: 'home-outline',
      label: 'Home',
    },
    {
      name: 'products',
      route: '/(tabs)/products',
      cleanRoute: '/products',
      icon: 'grid',
      iconOutline: 'grid-outline',
      label: 'Shop',
    },
    {
      name: 'cart',
      route: '/(tabs)/cart',
      cleanRoute: '/cart',
      icon: 'cart',
      iconOutline: 'cart-outline',
      isCenter: true,
      badge: cartCount,
    },
    {
      name: 'categories',
      route: '/(tabs)/categories',
      cleanRoute: '/categories',
      icon: 'apps',
      iconOutline: 'apps-outline',
      label: 'Category',
    },
    // {
    //   name: 'wishlist',
    //   route: '/(tabs)/wishlist',
    //   cleanRoute: '/wishlist',
    //   icon: 'heart',
    //   iconOutline: 'heart-outline',
    //   label: 'Saved',
    //   badge: wishlistCount,
    // },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      cleanRoute: '/profile',
      icon: 'person',
      iconOutline: 'person-outline',
      label: 'Profile',
    },
  ];

  const isActive = useCallback(
    (tab) =>
      pathname === tab.cleanRoute || pathname.startsWith(tab.cleanRoute + '/'),
    [pathname]
  );

  const activeIndex = tabs.findIndex((t) => isActive(t));

  const handleTabPress = useCallback(
    (tab) => {
      if (isActive(tab)) triggerRefresh(tab.name);
      else router.push(tab.route);
    },
    [isActive, triggerRefresh, router]
  );

  // ─── Swipe Gesture Handler ────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (dx > dy)
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const swipeThreshold = 50;
        const velocityThreshold = 0.3;

        // Swipe right (go to previous tab)
        if ((dx > swipeThreshold || vx > velocityThreshold) && activeIndex > 0) {
          const prevTab = tabs[activeIndex - 1];
          router.push(prevTab.route);
        }
        // Swipe left (go to next tab)
        else if ((dx < -swipeThreshold || vx < -velocityThreshold) && activeIndex < tabs.length - 1) {
          const nextTab = tabs[activeIndex + 1];
          router.push(nextTab.route);
        }
      },
    })
  ).current;

  const pb = Platform.select({
    ios:     insets.bottom > 0 ? insets.bottom : 10,
    android: insets.bottom > 0 ? insets.bottom : 12,
    default: 10,
  });

  return (
    <View style={[styles.wrapper, { paddingBottom: pb }]} {...panResponder.panHandlers}>
      {/* Gradient hairline top border */}
      <LinearGradient
        colors={[ACCENT_MID, ACCENT, ACCENT_MID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />

      {/* Sliding accent dot on top border */}
      {activeIndex >= 0 && <SlidingDot activeIndex={activeIndex} />}

      {/* Sliding rounded active background pill */}
      {activeIndex >= 0 && (
        <SlidingActiveBg activeIndex={activeIndex} tabs={tabs} />
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) =>
          tab.isCenter ? (
            <CenterButton
              key={tab.name}
              tab={tab}
              active={isActive(tab)}
              onPress={handleTabPress}
            />
          ) : (
            <TabButton
              key={tab.name}
              tab={tab}
              active={isActive(tab)}
              onPress={handleTabPress}
            />
          )
        )}
      </View>
    </View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: WHITE,
    paddingTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#2D3142',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  // ── Top border ───────────────────────────────────────────────────────────
  topBorder: {
    height: 1.5,
    width: '100%',
    opacity: 0.55,
  },

  // ── Sliding active background pill ───────────────────────────────────────
  activeBgPill: {
    position: 'absolute',
    left: 0,
    height: ACTIVE_BG_H,
    borderRadius: ACTIVE_BG_R,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: ACCENT_MID,
    zIndex: 0,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ── Sliding dot ──────────────────────────────────────────────────────────
  slidingDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DOT_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 5,
      },
    }),
  },

  // ── Tab row ──────────────────────────────────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_H,
    zIndex: 1,
  },

  // ── Regular tab ──────────────────────────────────────────────────────────
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  // The animated group that scales as one unit — must fit inside ACTIVE_BG_H
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: ACTIVE_BG_H,
  },
  iconArea: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // ── Center cart ───────────────────────────────────────────────────────────
  centerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingBottom: 4,
  },
  // Just wide enough for the outermost ring (CENTER_SIZE + 12 each side = +12 total)
  centerOuter: {
    width: CENTER_SIZE + 16,
    height: CENTER_SIZE + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shared orbit ring base
  orbitRing: {
    position: 'absolute',
    borderRadius: 999,
    borderStyle: 'dashed',
  },
  // Ring 1 — outermost, 8px larger than button, slow clockwise
  orbitRing1: {
    width: CENTER_SIZE + 12,
    height: CENTER_SIZE + 12,
    borderWidth: 1.6,
    borderColor: ACCENT,
    opacity: 0.4,
  },
  // Ring 2 — inner, 4px larger than button, fast counter-clockwise
  orbitRing2: {
    width: CENTER_SIZE + 6,
    height: CENTER_SIZE + 6,
    borderWidth: 1.2,
    borderColor: ACCENT_MID,
    opacity: 0.7,
  },
  centerGradient: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerGradientShadow: {
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.35,
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Regular badge ─────────────────────────────────────────────────────────
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: ACCENT,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: WHITE,
  },
  badgeText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Center badge ──────────────────────────────────────────────────────────
  centerBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 11,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: WHITE,
  },
  centerBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '800',
  },
});

BottomTabBar.displayName = 'BottomTabBar';
export default BottomTabBar;