import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const WelcomeFooter = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>© 2025 Catalunya English</Text>
      <Text style={styles.subtext}>Học tiếng Anh thật dễ dàng</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(24),
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: verticalScale(4),
  },
  subtext: {
    fontSize: 12,
    color: colors.textLight,
  },
});

export default WelcomeFooter;
