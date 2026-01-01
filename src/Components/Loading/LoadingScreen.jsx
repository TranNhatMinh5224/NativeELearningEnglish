import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mochiLoading, mochiWelcome } from '../../../assets/images';
import { useFadeIn, useScale, usePulse } from '../../Theme/animations';
import { scale, verticalScale, screen } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const LoadingScreen = ({ onFinish, duration = 2000 }) => {
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Animations
  const fadeIn = useFadeIn(600);
  const scaleAnim = useScale(800, 200);
  const pulse = usePulse();

  useEffect(() => {
    const interval = duration / 50; // 50 steps to reach 100%
    const step = 100 / 50;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          if (onFinish) {
            setTimeout(() => onFinish(), 500);
          }
          return 100;
        }
        return prev + step;
      });
    }, interval);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: duration,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, [duration, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary, colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header with Logo */}
      <Animated.View style={[styles.header, { opacity: fadeIn }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={mochiWelcome}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Catalunya English</Text>
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Character with Animation */}
        <Animated.View
          style={[
            styles.characterContainer,
            {
              opacity: fadeIn,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.Image
            source={mochiLoading}
            style={[
              styles.characterImage,
              {
                transform: [{ scale: pulse }],
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Welcome Text */}
        <Animated.Text
          style={[
            styles.welcomeText,
            {
              opacity: fadeIn,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          Chào mừng bạn đến với{'\n'}Catalunya English
        </Animated.Text>
      </View>

      {/* Progress Bar */}
      <Animated.View style={[styles.progressContainer, { opacity: fadeIn }]}>
        {/* Loading Percentage */}
        <Animated.Text style={[styles.loadingText, { opacity: fadeIn }]}>
          Loading {Math.round(progress)}%
        </Animated.Text>
        
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: verticalScale(50),
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
  },
  appName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  characterContainer: {
    width: scale(180),
    height: scale(180),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  characterImage: {
    width: '90%',
    height: '90%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: scale(34),
  },
  progressContainer: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 32,
    right: 32,
  },
  progressBar: {
    height: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(4),
  },
});

export default React.memo(LoadingScreen);
