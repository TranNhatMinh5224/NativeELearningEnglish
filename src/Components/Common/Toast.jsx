import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const Toast = ({ visible, message, type = 'success', onHide, duration = 3000 }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide down animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#10B981', icon: 'checkmark-circle' };
      case 'error':
        return { backgroundColor: '#EF4444', icon: 'close-circle' };
      case 'warning':
        return { backgroundColor: '#F59E0B', icon: 'warning' };
      case 'info':
        return { backgroundColor: '#3B82F6', icon: 'information-circle' };
      default:
        return { backgroundColor: '#10B981', icon: 'checkmark-circle' };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor }]}>
        <Ionicons name={toastStyle.icon} size={scale(24)} color="#FFFFFF" />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={scale(20)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? SAFE_AREA_PADDING.top + 8 : StatusBar.currentHeight || 16,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 24,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;

