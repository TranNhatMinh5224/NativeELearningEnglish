import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale, verticalScale, fontSize, spacing } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const GradientButton = React.memo(({ title, onPress, style, textStyle }) => {
  return (
    <TouchableOpacity
      style={[styles.buttonContainer, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

GradientButton.displayName = 'GradientButton';

const HeroSection = React.memo(({ heroImage, onGetStarted }) => {
  const fadeIn = useFadeIn(800, 200);
  const slideUp = useSlideIn('up', 600, 300);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeIn,
          transform: [{ translateY: slideUp }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          Ghi nhớ 1000 từ vựng{'\n'}trong 1 tháng
        </Text>

        <Text style={styles.description}>
          Học đúng thời điểm vàng giúp bạn học ít vẫn dễ dàng nhớ ngắn từ vựng
        </Text>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ 4.7/5 điểm</Text>
          <Text style={styles.reviews}>với 30,000+ đánh giá</Text>
        </View>

        <GradientButton
          title="Bắt đầu ngay"
          onPress={onGetStarted}
          style={styles.ctaButton}
        />
      </View>

      {heroImage && (
        <Image source={heroImage} style={styles.image} resizeMode="contain" />
      )}
    </Animated.View>
  );
});

HeroSection.displayName = 'HeroSection';

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  content: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: spacing.md,
    lineHeight: scale(40),
  },
  description: {
    fontSize: fontSize.md,
    color: '#64748B',
    marginBottom: spacing.md,
    lineHeight: scale(24),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  rating: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  reviews: {
    fontSize: fontSize.base,
    color: '#64748B',
  },
  buttonContainer: {
    borderRadius: scale(25),
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  gradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  ctaButton: {
    marginTop: spacing.sm,
  },
  image: {
    width: '100%',
    height: verticalScale(200),
    alignSelf: 'center',
  },
});

export { GradientButton };
export default HeroSection;
