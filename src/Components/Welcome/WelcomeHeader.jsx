import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale, fontSize, spacing } from '../../Theme/responsive';
import colors from '../../Theme/colors';

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
            <Text style={styles.logoText}>C</Text>
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
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
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
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  appName: {
    fontSize: fontSize.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loginButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: colors.secondary,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});

export default WelcomeHeader;
