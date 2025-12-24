import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const EmptyState = ({ 
  title = 'Chưa có khóa học nào',
  message = 'Hãy khám phá các khóa học dưới đây để bắt đầu hành trình học tập của bạn!',
  icon 
}) => {
  return (
    <View style={styles.container}>
      {/* Circular Icon Container with Stacked Books */}
      <View style={styles.iconContainer}>
        {icon ? (
          icon
        ) : (
          <View style={styles.booksContainer}>
            {/* Green Book (Top) */}
            <View style={[styles.book, styles.bookGreen]} />
            {/* Red Book (Middle) */}
            <View style={[styles.book, styles.bookRed]} />
            {/* Blue Book (Bottom) */}
            <View style={[styles.book, styles.bookBlue]} />
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(30),
    paddingHorizontal: 32,
    width: '100%',
  },
  iconContainer: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)', // Light purple border
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  booksContainer: {
    width: scale(80),
    height: scale(80),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  book: {
    position: 'absolute',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookGreen: {
    width: scale(50),
    height: scale(35),
    backgroundColor: '#10B981', // Green
    top: scale(5),
    zIndex: 3,
    transform: [{ rotate: '-5deg' }],
  },
  bookRed: {
    width: scale(55),
    height: scale(38),
    backgroundColor: '#EF4444', // Red
    top: scale(20),
    zIndex: 2,
    transform: [{ rotate: '2deg' }],
  },
  bookBlue: {
    width: scale(60),
    height: scale(40),
    backgroundColor: '#3B82F6', // Blue
    top: scale(35),
    zIndex: 1,
    transform: [{ rotate: '-3deg' }],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14 * 1.5,
    paddingHorizontal: 24,
    maxWidth: scale(300),
  },
});

export default EmptyState;
