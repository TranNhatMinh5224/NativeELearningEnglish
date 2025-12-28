import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const HeroSection = ({ heroImage, onGetStarted }) => {
  return (
    <View style={styles.container}>
      <Image
        source={heroImage}
        style={styles.heroImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>Chào mừng đến với{'\n'}Catalunya English</Text>
      <Text style={styles.subtitle}>
        Đăng nhập để khám phá hàng ngàn khóa học tiếng Anh miễn phí!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(24),
    backgroundColor: '#FFFFFF',
  },
  heroImage: {
    width: scale(200),
    height: scale(200),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(24),
    lineHeight: 22,
    paddingHorizontal: scale(8),
  },
});

export default HeroSection;
