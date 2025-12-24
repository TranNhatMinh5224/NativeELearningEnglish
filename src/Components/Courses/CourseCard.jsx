import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import { mochiKhoaHoc } from '../../../assets/images';

const CourseCard = ({ course, onPress, showProgress = false }) => {
  // Map dữ liệu từ backend (hỗ trợ cả PascalCase và camelCase)
  const {
    title = course.Title || course.courseName || 'Khóa học',
    description = course.Description || course.courseDescription || '',
    thumbnail = course.ImageUrl || course.imageUrl || course.thumbnail,
    level = course.Level || course.level || null,
    totalLessons = course.TotalLessons || course.totalLessons || course.lessonCount || course.LessonCount || 0,
    completedLessons = course.CompletedLessons || course.completedLessons || 0,
    difficulty = course.Difficulty || course.difficulty || null,
    isNew = course.IsNew || course.isNew || false,
    progressPercentage = course.ProgressPercentage || course.progressPercentage || 0,
  } = course;

  // Calculate progress percentage (ưu tiên progressPercentage từ backend, nếu không có thì tính từ completed/total)
  const progress = progressPercentage > 0 
    ? progressPercentage 
    : (totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0);

  // Get difficulty badge
  const getDifficultyBadge = () => {
    if (isNew) return { label: 'MỚI', color: colors.info };
    
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return { label: 'DỄ', color: colors.success };
      case 'medium':
        return { label: 'VỪA', color: colors.warning };
      case 'hard':
        return { label: 'KHÓ', color: colors.error };
      default:
        return null;
    }
  };

  const badge = getDifficultyBadge();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.gradient}>
        {/* Course Image */}
        <View style={styles.imageContainer}>
          <Image
            source={
              thumbnail
                ? { uri: thumbnail }
                : mochiKhoaHoc
            }
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Difficulty Badge */}
          {badge && (
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          )}
        </View>

        {/* Course Info */}
        <View style={styles.content}>
          {/* Level Tag */}
          {level && (
            <View style={styles.levelTag}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Description */}
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}

          {/* Lessons Count */}
          <Text style={styles.lessons}>
            {totalLessons} Bài học
            {showProgress && completedLessons > 0 && ` • ${completedLessons} hoàn thành`}
          </Text>

          {/* Progress Bar (only if showProgress is true) */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor:
                        progress === 100 ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: verticalScale(180),
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  levelTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginBottom: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 16 * 1.3,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 13 * 1.5,
  },
  lessons: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: scale(6),
    backgroundColor: colors.border,
    borderRadius: scale(3),
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(3),
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    minWidth: scale(35),
    textAlign: 'right',
  },
});

export default React.memo(CourseCard);
