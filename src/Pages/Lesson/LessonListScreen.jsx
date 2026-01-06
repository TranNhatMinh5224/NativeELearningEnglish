import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import lessonService from '../../Services/lessonService';
import Toast from '../../Components/Common/Toast';
import { mochiKhoaHoc } from '../../../assets/images';

const LessonListScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { courseId, courseTitle } = route.params || {};
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (courseId) {
      loadLessons();
    }
  }, [courseId]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const response = await lessonService.getLessonsByCourse(courseId);
      
      // Handle response flexible structure
      let lessonsData = [];
      const resData = response?.data || response;

      if (Array.isArray(resData)) {
          lessonsData = resData;
      } else if (resData?.data && Array.isArray(resData.data)) {
          lessonsData = resData.data;
      } else if (resData?.items && Array.isArray(resData.items)) {
          lessonsData = resData.items; // PagedResult structure
      } else if (resData?.lessons && Array.isArray(resData.lessons)) {
          lessonsData = resData.lessons; // Custom object structure
      }
      
      // Sort by orderIndex
      const sortedLessons = lessonsData.sort((a, b) => {
        const orderA = a.OrderIndex || a.orderIndex || 0;
        const orderB = b.OrderIndex || b.orderIndex || 0;
        return orderA - orderB;
      });
      
      setLessons(sortedLessons);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.response?.data?.message || error?.message || 'Không thể tải danh sách bài giảng',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson) => {
    const lessonId = lesson.LessonId || lesson.lessonId || lesson.id;
    const lessonTitle = lesson.Title || lesson.title || lesson.lessonName || 'Bài học';
    
    navigation.navigate('LessonDetail', {
      lessonId,
      lessonTitle,
      courseId,
      courseTitle,
    });
  };

  const renderLessonCard = (lesson, index) => {
    const lessonTitle = lesson.Title || lesson.title || lesson.lessonName || `Bài ${index + 1}`;
    const lessonDescription = lesson.Description || lesson.description || '';
    const isCompleted = lesson.IsCompleted || lesson.isCompleted || false;
    const orderIndex = lesson.OrderIndex || lesson.orderIndex || index + 1;

    return (
      <TouchableOpacity
        key={lesson.LessonId || lesson.lessonId || lesson.id || index}
        style={styles.lessonCard}
        onPress={() => handleLessonPress(lesson)}
        activeOpacity={0.7}
      >
        <View style={styles.lessonIconContainer}>
          <LinearGradient
            colors={isCompleted ? ['#10B981', '#059669'] : ['#6366F1', '#4F46E5']}
            style={styles.lessonIconGradient}
          >
            <Text style={styles.lessonNumber}>{orderIndex}</Text>
          </LinearGradient>
        </View>

        <View style={styles.lessonContent}>
          <View style={styles.lessonHeader}>
            <Text style={styles.lessonTitle} numberOfLines={2}>
              {lessonTitle}
            </Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={scale(20)} color={colors.success} />
              </View>
            )}
          </View>
          {lessonDescription && (
            <Text style={styles.lessonDescription} numberOfLines={2}>
              {lessonDescription}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={scale(20)} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài giảng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />

      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + verticalScale(16) }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {courseTitle || 'Danh sách bài giảng'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {lessons.length} bài giảng
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={mochiKhoaHoc}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Chưa có bài giảng nào</Text>
            <Text style={styles.emptySubtitle}>
              Khóa học này đang được cập nhật thêm bài giảng
            </Text>
          </View>
        ) : (
          <View style={styles.lessonsList}>
            {lessons.map((lesson, index) => renderLessonCard(lesson, index))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    paddingBottom: verticalScale(24),
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  lessonsList: {
    gap: 12,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonIconContainer: {
    marginRight: scale(16),
  },
  lessonIconGradient: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lessonContent: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  completedBadge: {
    marginLeft: 8,
  },
  lessonDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(24),
  },
  emptyImage: {
    width: scale(160),
    height: scale(160),
    marginBottom: verticalScale(24),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: verticalScale(20),
  },
});

export default LessonListScreen;
