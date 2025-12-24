import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useSlideIn } from '../../Theme/animations';
import { scale } from '../../Theme/responsive';
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
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 8,
  },
  promoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: scale(15),
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: scale(15),
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  cardHighlight: {
    borderColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 24,
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: scale(15),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 16,
  },
  oldPrice: {
    fontSize: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  priceHighlight: {
    color: colors.primary,
  },
  features: {
    gap: 8,
    marginBottom: 24,
  },
  feature: {
    fontSize: 14,
    color: '#64748B',
  },
  button: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: scale(12),
    alignItems: 'center',
  },
  buttonHighlight: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  buttonTextHighlight: {
    color: '#FFFFFF',
  },
});

export default PricingSection;
