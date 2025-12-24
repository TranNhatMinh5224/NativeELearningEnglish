import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useFadeIn } from '../../Theme/animations';
import { scale } from '../../Theme/responsive';

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
    padding: 32,
  },
  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  link: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default WelcomeFooter;
