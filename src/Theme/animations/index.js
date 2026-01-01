import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

// Hook for fade in animation
export const useFadeIn = (duration = 800, delay = 0) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return fadeAnim;
};

// Hook for slide in animation
export const useSlideIn = (direction = 'up', duration = 600, delay = 0) => {
  const slideAnim = useRef(new Animated.Value(direction === 'up' ? 50 : -50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      delay,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return slideAnim;
};

// Hook for scale animation
export const useScale = (duration = 500, delay = 0) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return scaleAnim;
};

// Pulse animation for loading
export const usePulse = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return pulseAnim;
};

// Shimmer animation for skeleton loading
export const useShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return shimmerAnim;
};
