import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import lessonService from '../../Services/lessonService';
import Toast from '../../Components/Common/Toast';
import { LectureContent } from '../../Components/Lesson';

const { width, height } = Dimensions.get('window');

const ModuleLearningScreen = ({ route, navigation }) => {
  const { moduleId, moduleName, lessonId, lessonTitle } = route.params || {};
  
  const [module, setModule] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (moduleId) {
      loadModuleContent();
    }
  }, [moduleId]);

  useEffect(() => {
    animateProgress();
  }, [currentLectureIndex, lectures.length]);

  const loadModuleContent = async () => {
    try {
      setLoading(true);
      const response = await lessonService.getModuleById(moduleId);
      const moduleData = response?.data || response;
      
      setModule(moduleData);
      
      const lecturesData = moduleData?.Lectures || moduleData?.lectures || [];
      // Sort lectures by OrderIndex
      const sortedLectures = lecturesData.sort((a, b) => {
        const aOrder = a.OrderIndex || a.orderIndex || 0;
        const bOrder = b.OrderIndex || b.orderIndex || 0;
        return aOrder - bOrder;
      });
      
      setLectures(sortedLectures);
    } catch (error) {
      console.error('Error loading module:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải nội dung học',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const animateProgress = () => {
    const progress = lectures.length > 0 
      ? (currentLectureIndex + 1) / lectures.length 
      : 0;
    
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const animateSlide = (direction) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -width : width,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentLectureIndex < lectures.length - 1) {
      animateSlide('next');
      setCurrentLectureIndex(currentLectureIndex + 1);
    } else {
      handleCompleteModule();
    }
  };

  const handlePrevious = () => {
    if (currentLectureIndex > 0) {
      animateSlide('prev');
      setCurrentLectureIndex(currentLectureIndex - 1);
    }
  };

  const handleCompleteModule = async () => {
    try {
      setCompleting(true);
      await lessonService.startModule(moduleId);
      
      setToast({
        visible: true,
        message: '🎉 Hoàn thành module!',
        type: 'success',
      });
      
      // Navigate back after 1.5 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error completing module:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể hoàn thành module',
        type: 'error',
      });
      setCompleting(false);
    }
  };

  const handleLectureComplete = () => {
    // Auto move to next lecture
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải nội dung...</Text>
      </View>
    );
  }

  if (!module || lectures.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={scale(64)} color={colors.error} />
        <Text style={styles.errorTitle}>Không có nội dung</Text>
        <Text style={styles.errorText}>Module này chưa có bài giảng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentLecture = lectures[currentLectureIndex];
  const progressPercentage = ((currentLectureIndex + 1) / lectures.length) * 100;
  const isLastLecture = currentLectureIndex === lectures.length - 1;

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />

      {/* Header with Progress */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {moduleName || 'Module'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Bài {currentLectureIndex + 1}/{lectures.length}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.progressText}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </LinearGradient>

      {/* Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LectureContent
            lecture={currentLecture}
            onComplete={handleLectureComplete}
          />
        </ScrollView>
      </Animated.View>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentLectureIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={currentLectureIndex === 0}
          >
            <Ionicons
              name="arrow-back"
              size={scale(20)}
              color={currentLectureIndex === 0 ? colors.textLight : colors.primary}
            />
            <Text
              style={[
                styles.navButtonText,
                currentLectureIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              Trước
            </Text>
          </TouchableOpacity>

          <View style={styles.lectureIndicator}>
            {lectures.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  index === currentLectureIndex && styles.indicatorDotActive,
                  index < currentLectureIndex && styles.indicatorDotCompleted,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonNext]}
            onPress={handleNext}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.navButtonNextText}>
                  {isLastLecture ? 'Hoàn thành' : 'Tiếp'}
                </Text>
                <Ionicons name="arrow-forward" size={scale(20)} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  header: {
    paddingTop: SAFE_AREA_PADDING.top + verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: scale(16),
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: SAFE_AREA_PADDING.bottom,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: scale(8),
    backgroundColor: colors.backgroundLight,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textLight,
  },
  navButtonNext: {
    backgroundColor: colors.primary,
  },
  navButtonNextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lectureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  indicatorDotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  indicatorDotCompleted: {
    backgroundColor: '#10B981',
  },
});

export default ModuleLearningScreen;
