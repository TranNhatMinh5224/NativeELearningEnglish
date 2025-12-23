import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale, fontSize, spacing } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const PricingCard = React.memo(({ plan, onSelect, isHighlight = false }) => {
  const { duration, oldPrice, price, features, badge } = plan;

  return (
    <View style={[styles.card, isHighlight && styles.cardHighlight]}>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      <Text style={styles.duration}>{duration}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.oldPrice}>{oldPrice}</Text>
        <Text style={[styles.price, isHighlight && styles.priceHighlight]}>
          {price}
        </Text>
      </View>

      <View style={styles.features}>
        {features.map((feature, index) => (
          <Text key={index} style={styles.feature}>
            ✓ {feature}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, isHighlight && styles.buttonHighlight]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, isHighlight && styles.buttonTextHighlight]}>
          Chọn gói này
        </Text>
      </TouchableOpacity>
    </View>
  );
});

PricingCard.displayName = 'PricingCard';

const PricingSection = React.memo(({ onSelectPlan }) => {
  const fadeIn = useFadeIn(800, 800);
  const slideUp = useSlideIn('up', 600, 900);

  const plans = [
    {
      id: '1year',
      duration: 'Gói 1 năm',
      oldPrice: '1.049.000',
      price: '749.000 đ',
      features: ['Truy cập không giới hạn', 'Học mọi lúc mọi nơi', 'Hỗ trợ 24/7'],
    },
    {
      id: '3years',
      duration: 'Gói 3 năm',
      oldPrice: '2.999.000',
      price: '1.499.000 đ',
      badge: 'HOT!',
      features: [
        'Tiết kiệm hơn 30%',
        'Truy cập không giới hạn',
        'Học mọi lúc mọi nơi',
        'Hỗ trợ 24/7',
        'Ưu đãi độc biệt',
      ],
    },
  ];

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
      <Text style={styles.title}>Nâng cấp tài khoản</Text>
      <Text style={styles.subtitle}>Catalunya English Premium</Text>

      <View style={styles.promoBadge}>
        <Text style={styles.promoBadgeText}>Ưu đãi 30% cho học viên Việt Nam</Text>
      </View>

      <View style={styles.cards}>
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isHighlight={index === 1}
            onSelect={() => onSelectPlan(plan)}
          />
        ))}
      </View>
    </Animated.View>
  );
});

PricingSection.displayName = 'PricingSection';

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  promoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(15),
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: scale(15),
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  cardHighlight: {
    borderColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -spacing.sm,
    right: spacing.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(15),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: spacing.sm,
  },
  priceContainer: {
    marginBottom: spacing.md,
  },
  oldPrice: {
    fontSize: fontSize.base,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  priceHighlight: {
    color: colors.primary,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  feature: {
    fontSize: fontSize.base,
    color: '#64748B',
  },
  button: {
    backgroundColor: '#F1F5F9',
    paddingVertical: spacing.md,
    borderRadius: scale(12),
    alignItems: 'center',
  },
  buttonHighlight: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#64748B',
  },
  buttonTextHighlight: {
    color: '#FFFFFF',
  },
});

export default PricingSection;
