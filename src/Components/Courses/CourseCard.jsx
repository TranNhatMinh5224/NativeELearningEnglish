import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import { mochiKhoaHoc } from '../../../assets/images';

const CourseCard = ({ course, onPress, showProgress = false }) => {
  // Defensive check
  if (!course) return null;

  // Map dữ liệu từ backend (hỗ trợ cả PascalCase và camelCase)
  const title = course.title || course.Title || course.courseName || 'Khóa học';
  const thumbnail = course.ImageUrl || course.imageUrl || course.thumbnail || null;
  const totalLessons = course.TotalLessons || course.totalLessons || course.lessonCount || course.LessonCount || 0;
  const completedLessons = course.CompletedLessons || course.completedLessons || 0;
  const difficulty = course.Difficulty || course.difficulty || null;
  const isNew = course.IsNew || course.isNew || false;
  const isPro = course.IsPro || course.isPro || false;
  const price = course.Price || course.price || 0;
  const progressPercentage = course.ProgressPercentage || course.progressPercentage || 0;

  // Calculate progress percentage
  const progress = progressPercentage > 0 
    ? progressPercentage 
    : (totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0);

  // Get difficulty badge
  const getDifficultyBadge = () => {
    if (isNew) return { label: 'MỚI', color: '#3B82F6' };
    
    const diff = difficulty ? String(difficulty).toLowerCase() : '';
    switch (diff) {
      case 'easy':
        return { label: 'DỄ', color: '#10B981' };
      case 'medium':
        return { label: 'VỪA', color: '#F59E0B' };
      case 'hard':
        return { label: 'KHÓ', color: '#EF4444' };
      default:
        return { label: 'DỄ', color: '#10B981' };
    }
  };

  const badge = getDifficultyBadge();

  // Format price
  const formatPrice = (p) => {
    if (!p || p === 0) return 'Miễn phí';
    try {
      return String(p).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
    } catch {
      return 'Miễn phí';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Left Content */}
      <View style={styles.leftContent}>
        {/* Difficulty Badge */}
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Lessons Count or Price */}
        <Text style={styles.lessons}>
          {totalLessons > 0 ? `${totalLessons} Bài học` : formatPrice(price)}
        </Text>

        {/* Progress Bar */}
        {showProgress && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>

      {/* Right Image */}
      <View style={styles.imageContainer}>
        <Image
          source={thumbnail ? { uri: thumbnail } : mochiKhoaHoc}
          style={styles.image}
          resizeMode="cover"
          defaultSource={mochiKhoaHoc}
        />
        
        {/* Pro Badge */}
        {isPro && (
          <View style={styles.proBadge}>
            <Ionicons name="crown" size={scale(14)} color="#F59E0B" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    height: verticalScale(120),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  leftContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: scale(10),
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 20,
  },
  lessons: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    minWidth: 28,
    textAlign: 'right',
  },
  imageContainer: {
    width: scale(110),
    height: '100%',
    position: 'relative',
    backgroundColor: '#374151',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(CourseCard);
