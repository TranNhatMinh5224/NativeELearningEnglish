import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import courseService from '../../Services/courseService';
import CourseCard from '../../Components/Courses/CourseCard';
import EmptyState from '../../Components/Home/EmptyState';
import Toast from '../../Components/Common/Toast';

const OnionScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getMyCourses();
      
      // Backend trả về ServiceResponse với Data là array
      let coursesData = [];
      if (response && response.data) {
        coursesData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        coursesData = response;
      }

      // Map dữ liệu từ backend sang format CourseCard
      const mappedCourses = coursesData.map((course) => ({
        id: course.courseId || course.id,
        courseId: course.courseId || course.id,
        title: course.title || course.Title || course.courseName || 'Khóa học',
        description: course.description || course.Description || course.courseDescription || '',
        thumbnail: course.imageUrl || course.ImageUrl || course.thumbnail,
        level: course.level || course.Level || null,
        totalLessons: course.totalLessons || course.TotalLessons || course.lessonCount || course.LessonCount || 0,
        completedLessons: course.completedLessons || course.CompletedLessons || 0,
        progressPercentage: course.progressPercentage || course.ProgressPercentage || 0,
        difficulty: course.difficulty || course.Difficulty || null,
        isNew: course.isNew || course.IsNew || false,
        isCompleted: course.isCompleted || course.IsCompleted || false,
        enrolledAt: course.enrolledAt || course.EnrolledAt,
        // Giữ nguyên toàn bộ dữ liệu gốc để dùng sau
        ...course,
      }));

      setCourses(mappedCourses);
    } catch (error) {
      console.error('Load courses error:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleJoinCourse = async () => {
    if (!classCode.trim()) {
      setToast({
        visible: true,
        message: 'Vui lòng nhập mã lớp học',
        type: 'error',
      });
      return;
    }

    setJoining(true);
    try {
      await courseService.joinByClassCode(classCode.trim());
      setToast({
        visible: true,
        message: 'Tham gia khóa học thành công!',
        type: 'success',
      });
      setShowJoinModal(false);
      setClassCode('');
      await loadCourses();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Tham gia khóa học thất bại';
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetail', { courseId: course.courseId || course.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khóa học của tôi</Text>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => setShowJoinModal(true)}
          >
            <LinearGradient
              colors={['#3B82F6', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButtonGradient}
            >
              <Ionicons name="add" size={scale(20)} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Nhập mã lớp học</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có khóa học đã đăng ký</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowJoinModal(true)}
              >
                <LinearGradient
                  colors={['#3B82F6', '#60A5FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="add-circle-outline" size={scale(20)} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Nhập mã lớp học</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.coursesList}>
              {courses.map((course) => (
                <CourseCard
                  key={course.courseId || course.id}
                  course={course}
                  showProgress={true}
                  onPress={() => handleCoursePress(course)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Join Course Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowJoinModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nhập mã lớp học</Text>
              <TouchableOpacity
                onPress={() => setShowJoinModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={scale(24)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Mã lớp học</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập mã lớp học"
                placeholderTextColor={colors.textLight}
                value={classCode}
                onChangeText={setClassCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.modalHint}>
                Nhập mã lớp học mà giáo viên đã cung cấp để tham gia khóa học
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setClassCode('');
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.joinModalButton]}
                onPress={handleJoinCourse}
                disabled={joining}
              >
                <LinearGradient
                  colors={['#3B82F6', '#60A5FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinModalButtonGradient}
                >
                  {joining ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.joinModalButtonText}>Tham gia</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32 + SAFE_AREA_PADDING.top,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  joinButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  coursesList: {
    gap: 16,
  },
  bottomSpacing: {
    height: verticalScale(80),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: scale(16),
    padding: 32,
    width: '90%',
    maxWidth: scale(400),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  modalBody: {
    marginBottom: 32,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: scale(12),
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 12 * 1.4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinModalButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  joinModalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  joinModalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OnionScreen;
