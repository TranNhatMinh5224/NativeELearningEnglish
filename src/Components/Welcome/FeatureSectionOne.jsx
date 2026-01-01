import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const FeatureSectionOne = ({ featureImage }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.badge}>🎯 Học thông minh</Text>
        <Text style={styles.title}>Học tiếng Anh thật dễ dàng</Text>
        <Text style={styles.description}>
          Phương pháp học tập thông minh, kết hợp công nghệ AI giúp bạn tiến bộ nhanh chóng
        </Text>
      </View>
      <Image
        source={featureImage}
        style={styles.featureImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(24),
    backgroundColor: colors.surface,
  },
  textContainer: {
    marginBottom: verticalScale(20),
  },
  badge: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(12),
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  featureImage: {
    width: '100%',
    height: scale(180),
  },
});

export default FeatureSectionOne;
