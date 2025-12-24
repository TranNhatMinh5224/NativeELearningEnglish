import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import { mochiWelcome } from '../../../assets/images';

const WelcomeHeader = React.memo(({ onLoginPress, onRegisterPress }) => {
  const fadeIn = useFadeIn(600);
  const slideDown = useSlideIn('down', 600);

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary, colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Animated.View
        style={[
          styles.headerContent,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideDown }],
          },
        ]}
      >
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

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onLoginPress}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={onRegisterPress}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
});

WelcomeHeader.displayName = 'WelcomeHeader';

const styles = StyleSheet.create({
  header: {
    paddingTop: scale(50),
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WelcomeHeader;
