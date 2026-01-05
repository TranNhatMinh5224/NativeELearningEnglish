import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import courseService from '../../Services/courseService';
import authService from '../../Services/authService';
import CourseCard from '../../Components/Courses/CourseCard';
import Toast from '../../Components/Common/Toast';
import { mochiWelcome } from '../../../assets/images';

const OnionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Chỉ load lần đầu khi mount component, không reload mỗi lần focus
  useEffect(() => {
    checkLoginAndLoadCourses();
  }, []);

  // Reload chỉ khi có tham số refresh từ navigation
  useFocusEffect(
    useCallback(() => {
      // Không làm gì ở đây - chỉ giữ để tương thích
      // Reload sẽ được trigger bởi CourseDetailScreen khi đăng ký thành công
    }, [])
  );

  const checkLoginAndLoadCourses = async () => {
    try {
      setLoading(true);
      const loggedIn = await authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        await loadCourses();
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      
      let coursesData = [];
      if (response && response.data) {
        // API trả về PagedResult với structure: { items: [...], totalCount, pageSize, currentPage }
        if (response.data.items && Array.isArray(response.data.items)) {
          coursesData = response.data.items;
        } else if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else {
          coursesData = [response.data];
        }
      } else if (Array.isArray(response)) {
        coursesData = response;
      }

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
        ...course,
      }));

      setCourses(mappedCourses);
    } catch (error) {
      setCourses([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkLoginAndLoadCourses();
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

  const handleCoursePress = useCallback((course) => {
    const courseId = course.courseId || course.id;
    const courseTitle = course.title || course.Title || course.courseName || 'Khóa học';
    
    // Navigate to lesson list instead of course detail for enrolled courses
    navigation.navigate('LessonList', { 
      courseId, 
      courseTitle 
    });
  }, [navigation]);

  const handleLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  // Memoize filtered courses để tránh re-calculate mỗi lần render
  const { freeCourses, paidCourses } = useMemo(() => {
    const free = courses.filter(course => !course.price || course.price === 0);
    const paid = courses.filter(course => course.price && course.price > 0);
    return { freeCourses: free, paidCourses: paid };
  }, [courses]);

  // Render single course card với navigation đến LessonList
  const renderCourseCard = useCallback((course, index, prefix = 'course') => {
    const courseId = course.courseId || course.id;
    
    return (
      <View key={courseId || `${prefix}-${index}`} style={styles.courseCardWrapper}>
        <CourseCard
          course={course}
          showProgress={true}
          onPress={() => handleCoursePress(course)}
        />
      </View>
    );
  }, [handleCoursePress]);

  // Render UI khi chưa đăng nhập
  const renderGuestUI = () => (
    <View style={styles.guestContainer}>
      <View style={[styles.guestHeader, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.guestHeaderTitle}>Khóa học của tôi</Text>
      </View>
      
      <View style={styles.guestContent}>
        <View style={styles.guestCard}>
          <View style={styles.guestIconContainer}>
            <Image
              source={mochiWelcome}
              style={styles.guestImage}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.guestTitle}>Đăng nhập để xem khóa học</Text>
          <Text style={styles.guestMessage}>
            Bạn cần đăng nhập để xem và quản lý các khóa học đã đăng ký.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              <Ionicons name="log-in-outline" size={scale(20)} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  // Nếu chưa đăng nhập
  if (!isLoggedIn) {
    return renderGuestUI();
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
        <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
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
  // Guest UI Styles
  guestContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  guestHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  guestHeaderTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  guestContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  guestCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  guestIconContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  guestImage: {
    width: scale(80),
    height: scale(80),
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    width: '100%',
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Logged in UI Styles
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
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
  courseSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    borderRadius: scale(12),
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Course Card Wrapper
  courseCardWrapper: {
    marginBottom: 16,
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
