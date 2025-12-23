import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from './HeroSection';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale, verticalScale, fontSize, spacing, screen } from '../../Theme/responsive';

const FeatureSectionOne = React.memo(({ featureImage, onJoinGroup }) => {
  const fadeIn = useFadeIn(800, 400);
  const slideUp = useSlideIn('up', 600, 500);

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: slideUp }],
      }}
    >
      <LinearGradient colors={['#F0F9FF', '#FAF5FF']} style={styles.container}>
        {featureImage && (
          <Image source={featureImage} style={styles.image} resizeMode="contain" />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>
            Dễ dàng duy trì{'\n'}thói quen học tiếng Anh
          </Text>

          <Text style={styles.description}>
            Tham gia thử thách 14 ngày để hình thành thói quen học và nhận các phần
            quà đặc biệt từ Catalunya English
          </Text>

          <GradientButton
            title="Gia nhập link nhóm"
            onPress={onJoinGroup}
            style={styles.button}
          />

          <Text style={styles.subText}>Vào Group để nhận quà tặng MIỄN PHÍ</Text>

          <Text style={styles.note}>
            Học đúng trong tâm, ôn tập thông minh, tăng band nhanh chóng!
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

FeatureSectionOne.displayName = 'FeatureSectionOne';

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  image: {
    width: scale(200),
    height: scale(200),
    marginBottom: spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: scale(32),
  },
  description: {
    fontSize: fontSize.base,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: scale(22),
  },
  button: {
    marginBottom: spacing.sm,
  },
  subText: {
    fontSize: fontSize.base,
    color: '#A78BFA',
    marginBottom: spacing.sm,
  },
  note: {
    fontSize: fontSize.sm,
    color: '#64748B',
    fontStyle: 'italic',
  },
});

export default FeatureSectionOne;
