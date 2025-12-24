import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale } from '../../Theme/responsive';
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
    padding: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingRight: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    lineHeight: scale(28),
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: scale(20),
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  image: {
    width: scale(150),
    height: scale(150),
  },
});

export default FeatureSectionTwo;
