import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale, fontSize, spacing } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const FeatureSectionTwo = React.memo(({ featureImage, onLearnMore }) => {
  const fadeIn = useFadeIn(800, 600);
  const slideUp = useSlideIn('up', 600, 700);

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: slideUp }],
      }}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            Đạt 6.5 IELTS sau 1 khóa học{'\n'}với Adaptive Learning
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onLearnMore}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Tìm hiểu thêm</Text>
          </TouchableOpacity>
        </View>

        {featureImage && (
          <Image source={featureImage} style={styles.image} resizeMode="contain" />
        )}
      </LinearGradient>
    </Animated.View>
  );
});

FeatureSectionTwo.displayName = 'FeatureSectionTwo';

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
    lineHeight: scale(28),
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(20),
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: colors.secondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  image: {
    width: scale(150),
    height: scale(150),
  },
});

export default FeatureSectionTwo;
