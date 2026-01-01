import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import courseService from '../../Services/courseService';
import Toast from '../../Components/Common/Toast';
import { mochiKhoaHoc } from '../../../assets/images';
import { formatPrice } from '../../Utils/formatters';

const { width } = Dimensions.get('window');

const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params || {};
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (courseId) {
      loadCourseDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);
      
      // Backend trả về ServiceResponse: { success, data, message, statusCode }
      const courseData = response?.data || response;
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course detail:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải thông tin khóa học',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const handleEnroll = useCallback(async () => {
    // Nếu khóa học có phí, chuyển sang màn hình thanh toán
    if (coursePrice > 0) {
      setShowConfirmModal(false);
      navigation.navigate('Payment', {
        courseId: course.courseId || course.id,
        courseTitle: courseTitle,
        price: coursePrice,
        thumbnail: courseImage
      });
      return;
    }

    // Nếu miễn phí, gọi API enroll luôn
    try {
      setEnrolling(true);
      await courseService.enrollCourse(courseId);
      
      setShowConfirmModal(false);
      setToast({
        visible: true,
        message: 'Đăng ký khóa học thành công!',
        type: 'success',
      });
      
      // Reload course để cập nhật trạng thái nút bấm (Đã đăng ký)
      // Không goBack để tránh lỗi nếu user vào từ Deep Link hoặc Home
      loadCourseDetail(); 
      
    } catch (error) {
      console.error('Error enrolling course:', error);
      setShowConfirmModal(false);
      setToast({
        visible: true,
        message: error?.message || 'Đăng ký khóa học thất bại',
        type: 'error',
      });
    } finally {
      setEnrolling(false);
    }
  }, [coursePrice, course, courseTitle, courseImage, courseId, navigation, loadCourseDetail]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={scale(48)} color={colors.error} />
        <Text style={styles.errorText}>Không tìm thấy khóa học</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Map dữ liệu từ backend (hỗ trợ cả PascalCase và camelCase)
  const courseTitle = course.Title || course.title || course.courseName || 'Khóa học';
  const courseDescription = course.Description || course.description || course.courseDescription || '';
  const courseImage = course.ImageUrl || course.imageUrl || course.thumbnail;
  const lessonCount = course.LessonCount || course.lessonCount || course.TotalLessons || course.totalLessons || 0;
  const studentCount = course.StudentCount || course.studentCount || course.EnrollmentCount || course.enrollmentCount || 0;
  const coursePrice = course.Price || course.price || 0;
  const isEnrolled = course.IsEnrolled !== undefined ? course.IsEnrolled : course.isEnrolled || false;

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
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Banner với background đẹp */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            {/* Stars effect */}
            <View style={styles.starsContainer}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.star,
                    {
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.5 + 0.5,
                    },
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.bannerTitle}>{courseTitle}</Text>
          </LinearGradient>
        </View>

        {/* Breadcrumbs */}
        <View style={styles.breadcrumbs}>
          <TouchableOpacity onPress={() => navigation.navigate('MyCourses')}>
            <Text style={styles.breadcrumbLink}>Khóa học của tôi</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSeparator}> / </Text>
          <Text style={styles.breadcrumbCurrent}>{courseTitle}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Left Card - Course Introduction */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giới thiệu khóa học</Text>
            <Text style={styles.cardDescription}>
              {courseDescription || 'Khóa học này sẽ giúp bạn nâng cao trình độ tiếng Anh.'}
            </Text>
          </View>

          {/* Right Card - Course Info & Enrollment */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={scale(20)} color={colors.primary} />
              <Text style={styles.infoLabel}>Số lượng bài giảng</Text>
              <Text style={styles.infoValue}>{lessonCount} bài giảng</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={scale(20)} color={colors.primary} />
              <Text style={styles.infoLabel}>Số học viên</Text>
              <Text style={styles.infoValue}>{studentCount} học viên</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={scale(20)} color={colors.primary} />
              <Text style={styles.infoLabel}>Giá khóa học</Text>
              <Text style={[styles.infoValue, coursePrice === 0 && styles.freePrice]}>
                {formatPrice(coursePrice)}
              </Text>
            </View>

            {!isEnrolled ? (
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() => setShowConfirmModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#14B8A6', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.enrollGradient}
                >
                  <Text style={styles.enrollButtonText}>
                    {coursePrice > 0 ? 'Mua ngay' : 'Đăng kí ngay'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.enrolledBadge}>
                  <Ionicons name="checkmark-circle" size={scale(20)} color={colors.success} />
                  <Text style={styles.enrolledText}>Đã đăng ký</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.startLearningButton}
                  onPress={() => {
                    if (lessonCount > 0) {
                      navigation.navigate('LessonList', { 
                        courseId, 
                        courseTitle 
                      });
                    } else {
                      setToast({
                        visible: true,
                        message: 'Khóa học chưa có bài giảng',
                        type: 'info',
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={lessonCount > 0 ? ['#3B82F6', '#60A5FA'] : ['#9CA3AF', '#6B7280']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startLearningGradient}
                  >
                    <Ionicons 
                      name={lessonCount > 0 ? "play-circle" : "alert-circle-outline"} 
                      size={scale(20)} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.startLearningText}>
                      {lessonCount > 0 ? 'Vào học luôn' : 'Chưa có bài học'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Confirm Enrollment Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {coursePrice > 0 ? 'Xác nhận mua khóa học' : 'Xác nhận đăng ký khóa học'}
            </Text>
            <Text style={styles.modalMessage}>
              Bạn có muốn {coursePrice > 0 ? 'mua' : 'đăng ký'} khóa học{' '}
              <Text style={styles.modalCourseName}>"{courseTitle}"</Text>
              {coursePrice > 0 && (
                <> với giá{' '}
                  <Text style={{ fontWeight: '700', color: colors.primary }}>{formatPrice(coursePrice)}</Text>
                </>
              )} không?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {coursePrice > 0 ? 'Thanh toán' : 'Bắt đầu ngay'}
                  </Text>
                )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: scale(8),
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    height: verticalScale(200),
    position: 'relative',
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SAFE_AREA_PADDING.top,
    paddingHorizontal: 24,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  breadcrumbs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breadcrumbLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 14 * 1.6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  freePrice: {
    color: colors.success,
  },
  enrollButton: {
    marginTop: 8,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  enrollGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: colors.success + '15',
    borderRadius: scale(12),
  },
  enrolledText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
  },
  startLearningButton: {
    marginTop: 12,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  startLearningGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startLearningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: verticalScale(20),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: 24,
    width: '100%',
    maxWidth: scale(400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 14 * 1.6,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalCourseName: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: scale(12),
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: scale(12),
    backgroundColor: '#14B8A6',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CourseDetailScreen;
