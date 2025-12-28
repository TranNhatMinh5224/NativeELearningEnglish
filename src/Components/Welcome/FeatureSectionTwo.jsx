import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const FeatureSectionTwo = ({ featureImage }) => {
  const features = [
    { icon: 'book-outline', text: 'Hàng ngàn bài học miễn phí' },
    { icon: 'trophy-outline', text: 'Theo dõi tiến trình học tập' },
    { icon: 'people-outline', text: 'Cộng đồng học viên sôi động' },
    { icon: 'time-outline', text: 'Học mọi lúc, mọi nơi' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tại sao chọn Catalunya English?</Text>
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={feature.icon} size={24} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(24),
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: verticalScale(16),
    alignItems: 'center',
  },
  iconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  featureText: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default FeatureSectionTwo;
