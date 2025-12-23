import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useFadeIn } from '../../Theme/animations';
import { scale, fontSize, spacing } from '../../Theme/responsive';

const WelcomeFooter = React.memo(() => {
  const fadeIn = useFadeIn(800, 1000);

  const footerData = {
    courses: ['Từ vựng tiếng Anh', 'Luyện thi IELTS', 'Luyện nghe'],
    resources: ['1000 Từ vựng cơ bản', '1200 Từ vựng IELTS'],
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <Text style={styles.brand}>Catalunya English</Text>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Khóa học</Text>
          {footerData.courses.map((course, index) => (
            <Text key={index} style={styles.link}>
              {course}
            </Text>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Tài liệu</Text>
          {footerData.resources.map((resource, index) => (
            <Text key={index} style={styles.link}>
              {resource}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.copyright}>© 2025 Catalunya English</Text>
    </Animated.View>
  );
});

WelcomeFooter.displayName = 'WelcomeFooter';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    padding: spacing.xl,
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  link: {
    fontSize: fontSize.sm,
    color: '#94A3B8',
    marginBottom: spacing.sm,
  },
  copyright: {
    fontSize: fontSize.sm,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default WelcomeFooter;
