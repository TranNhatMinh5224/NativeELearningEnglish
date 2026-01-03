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
  Modal,
  FlatList,
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
  const [showSidebar, setShowSidebar] = useState(false);
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
      
      // Try to get lecture tree first (like web app)
      try {
        const treeResponse = await lessonService.getLectureTreeByModuleId(moduleId);
        
        // axiosClient already unwraps one layer, so response.data is the ServiceResponse data
        const treeData = treeResponse?.data || treeResponse;
        
        if (treeData && Array.isArray(treeData) && treeData.length > 0) {
          // Flatten tree structure to get all lectures
          const flattenLectures = (lectures, result = []) => {
            lectures.forEach(lecture => {
              result.push(lecture);
              if (lecture.Children && lecture.Children.length > 0) {
                flattenLectures(lecture.Children, result);
              } else if (lecture.children && lecture.children.length > 0) {
                flattenLectures(lecture.children, result);
              }
            });
            return result;
          };
          
          const allLectures = flattenLectures(treeData);
          
          if (allLectures.length > 0) {
            setLectures(allLectures);
            setLoading(false);
            return;
          }
        }
      } catch (treeError) {
        // Lecture tree not available, try regular lectures API
      }
      
      // Fallback: Load lectures directly
      const response = await lessonService.getLecturesByModuleId(moduleId);
      
      // axiosClient already unwraps one layer
      const lecturesData = response?.data || response || [];
      
      // Sort lectures by OrderIndex
      const sortedLectures = lecturesData.sort((a, b) => {
        const aOrder = a.OrderIndex || a.orderIndex || 0;
        const bOrder = b.OrderIndex || b.orderIndex || 0;
        return aOrder - bOrder;
      });
      
      setLectures(sortedLectures);
    } catch (error) {
      console.error('❌ Error loading module:', error);
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

  if (lectures.length === 0) {
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
            <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
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
            <TouchableOpacity 
              style={styles.headerMenuButton}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={scale(20)} color="#4B5563" />
            </TouchableOpacity>
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

      {/* Sidebar Modal */}
      <Modal
        visible={showSidebar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSidebar(false)}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.sidebarBackdrop} 
            activeOpacity={1}
            onPress={() => setShowSidebar(false)}
          />
          <View style={styles.sidebar}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sidebarHeader}
            >
              <View style={styles.sidebarHeaderContent}>
                <View style={styles.sidebarHeaderLeft}>
                  <Ionicons name="list" size={scale(24)} color="#FFFFFF" />
                  <Text style={styles.sidebarTitle}>Mục lục bài giảng</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowSidebar(false)}
                  style={styles.sidebarCloseButton}
                >
                  <Ionicons name="close-circle" size={scale(32)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <View style={styles.sidebarProgress}>
              <Text style={styles.sidebarProgressText}>
                Tiến độ: {currentLectureIndex + 1}/{lectures.length}
              </Text>
            </View>
            
            <FlatList
              data={lectures}
              keyExtractor={(item, index) => String(item?.LectureId || item?.lectureId || index)}
              renderItem={({ item, index }) => {
                const isActive = index === currentLectureIndex;
                const itemTitle = item?.Title || item?.title || `Bài ${index + 1}`;
                const level = item?.level || 0;
                const numberingLabel = item?.NumberingLabel || item?.numberingLabel || `${index + 1}`;
                const isCompleted = index < currentLectureIndex;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.sidebarItem,
                      isActive && styles.sidebarItemActive,
                      { marginLeft: scale(level * 16) },
                    ]}
                    onPress={() => {
                      setCurrentLectureIndex(index);
                      setShowSidebar(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sidebarItemLeft}>
                      <View style={[
                        styles.sidebarItemIcon,
                        isActive && styles.sidebarItemIconActive,
                        isCompleted && styles.sidebarItemIconCompleted,
                      ]}>
                        {isCompleted ? (
                          <Ionicons name="checkmark-circle" size={scale(20)} color="#FFFFFF" />
                        ) : isActive ? (
                          <Ionicons name="play-circle" size={scale(20)} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.sidebarItemNumber}>{numberingLabel}</Text>
                        )}
                      </View>
                      <View style={styles.sidebarItemContent}>
                        <Text 
                          style={[
                            styles.sidebarItemText,
                            isActive && styles.sidebarItemTextActive,
                            isCompleted && styles.sidebarItemTextCompleted,
                          ]}
                          numberOfLines={2}
                        >
                          {itemTitle}
                        </Text>
                        {isActive && (
                          <View style={styles.sidebarItemBadge}>
                            <Text style={styles.sidebarItemBadgeText}>Đang học</Text>
                          </View>
                        )}
                        {isCompleted && (
                          <View style={[styles.sidebarItemBadge, styles.sidebarItemBadgeCompleted]}>
                            <Text style={styles.sidebarItemBadgeText}>Hoàn thành</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons 
                      name={isCompleted ? "checkmark-circle" : isActive ? "radio-button-on" : "chevron-forward"} 
                      size={scale(20)} 
                      color={isCompleted ? "#10B981" : isActive ? colors.primary : "#9CA3AF"} 
                    />
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.sidebarSeparator} />}
            />
          </View>
        </View>
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: scale(8),
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerMenuButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
  },
  sidebar: {
    width: width * 0.85,
    backgroundColor: '#F9FAFB',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    paddingTop: SAFE_AREA_PADDING.top,
  },
  sidebarHeader: {
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(16),
  },
  sidebarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  sidebarTitle: {
    fontSize: scale(20),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  sidebarCloseButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarProgress: {
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarProgressText: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(8),
    marginVertical: scale(4),
    borderRadius: scale(12),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sidebarItemActive: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: scale(4),
    borderLeftColor: colors.primary,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  sidebarItemIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarItemIconActive: {
    backgroundColor: colors.primary,
  },
  sidebarItemIconCompleted: {
    backgroundColor: '#10B981',
  },
  sidebarItemNumber: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Bold',
    color: colors.textSecondary,
  },
  sidebarItemContent: {
    flex: 1,
  },
  sidebarItemText: {
    fontSize: scale(15),
    fontFamily: 'Quicksand-SemiBold',
    color: colors.text,
    lineHeight: scale(20),
  },
  sidebarItemTextActive: {
    color: colors.primary,
    fontFamily: 'Quicksand-Bold',
  },
  sidebarItemTextCompleted: {
    color: '#6B7280',
  },
  sidebarItemBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginTop: verticalScale(4),
    alignSelf: 'flex-start',
  },
  sidebarItemBadgeCompleted: {
    backgroundColor: '#10B981',
  },
  sidebarItemBadgeText: {
    fontSize: scale(11),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  sidebarSeparator: {
    height: 0,
  },
});

export default ModuleLearningScreen;
