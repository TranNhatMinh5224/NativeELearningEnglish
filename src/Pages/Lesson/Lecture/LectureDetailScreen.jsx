import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import lessonService from '../../../Services/lessonService';
import courseService from '../../../Services/courseService';
import Toast from '../../../Components/Common/Toast';

const { width } = Dimensions.get('window');

const LectureDetailScreen = ({ route, navigation }) => {
  const { 
    lectureId, 
    moduleId, 
    moduleName, 
    lessonId, 
    lessonTitle,
    courseId,
    courseTitle,
    lectures: passedLectures 
  } = route.params || {};
  
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [lecture, setLecture] = useState(null);
  const [lectureTree, setLectureTree] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingLecture, setLoadingLecture] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Load course, lesson, module info for breadcrumb
  useEffect(() => {
    const loadInfo = async () => {
      try {
        if (courseId && !course) {
          const courseResponse = await courseService.getCourseById(courseId);
          const courseData = courseResponse?.data || courseResponse;
          setCourse(courseData);
        }
        if (lessonId && !lesson) {
          const lessonResponse = await lessonService.getLessonById(lessonId);
          const lessonData = lessonResponse?.data || lessonResponse;
          setLesson(lessonData);
        }
        if (moduleId && !module) {
          const moduleResponse = await lessonService.getModuleById(moduleId);
          const moduleData = moduleResponse?.data || moduleResponse;
          setModule(moduleData);
        }
      } catch (error) {
      }
    };
    loadInfo();
  }, [courseId, lessonId, moduleId]);

  // Load lecture tree
  useEffect(() => {
    if (moduleId && lectureTree.length === 0) {
      loadLectureTree();
    }
  }, [moduleId]);

  // Auto-expand parent items containing current lecture
  useEffect(() => {
    if (lectureId && lectureTree.length > 0) {
      const findParentIds = (items, targetId, parentIds = []) => {
        for (const item of items) {
          const itemId = item.lectureId || item.LectureId;
          const children = item.children || item.Children || [];
          
          if (itemId === targetId) {
            return parentIds;
          }
          
          if (children.length > 0) {
            const result = findParentIds(children, targetId, [...parentIds, itemId]);
            if (result !== null) {
              return result;
            }
          }
        }
        return null;
      };

      const parentIds = findParentIds(lectureTree, parseInt(lectureId));
      if (parentIds && parentIds.length > 0) {
        setExpandedItems(new Set(parentIds));
      }
    }
  }, [lectureId, lectureTree]);

  // Load lecture detail
  useEffect(() => {
    if (lectureId) {
      loadLecture();
    }
  }, [lectureId]);

  const loadLectureTree = async () => {
    try {
      const treeResponse = await lessonService.getLectureTreeByModuleId(moduleId);
      const treeData = treeResponse?.data || treeResponse || [];
      setLectureTree(Array.isArray(treeData) ? treeData : []);
    } catch (error) {
    }
  };

  const loadLecture = async () => {
    try {
      setLoadingLecture(true);
      const response = await lessonService.getLectureById(lectureId);
      const lectureData = response?.data || response;
      setLecture(lectureData);
      setLoading(false);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải nội dung bài giảng',
        type: 'error',
      });
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 2000);
    } finally {
      setLoadingLecture(false);
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await lessonService.startModule(moduleId);
      setToast({
        visible: true,
        message: '✅ Đã hoàn thành bài giảng!',
        type: 'success',
      });
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể hoàn thành bài giảng',
        type: 'error',
      });
    }
  };

  const handleLectureClick = (selectedLectureId) => {
    navigation.replace('LectureDetailScreen', {
      lectureId: selectedLectureId,
      moduleId,
      moduleName: module?.name || module?.Name || moduleName,
      lessonId,
      lessonTitle: lesson?.title || lesson?.Title || lessonTitle,
      courseId,
      courseTitle: course?.title || course?.Title || courseTitle,
    });
    setShowSidebar(false);
  };

  const toggleExpand = (lectureId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(lectureId)) {
      newExpanded.delete(lectureId);
    } else {
      newExpanded.add(lectureId);
    }
    setExpandedItems(newExpanded);
  };

  const renderLectureItem = (lecture, level = 0) => {
    const itemId = lecture.lectureId || lecture.LectureId;
    const title = lecture.title || lecture.Title || '';
    const numberingLabel = lecture.numberingLabel || lecture.NumberingLabel || '';
    const children = lecture.children || lecture.Children || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedItems.has(itemId);
    const isActive = String(itemId) === String(lectureId);

    const displayLabel = numberingLabel || `${lecture.orderIndex || lecture.OrderIndex || ''}`;

    const handleItemPress = () => {
      if (hasChildren) {
        toggleExpand(itemId);
      } else {
        handleLectureClick(itemId);
      }
    };

    return (
      <View key={itemId}>
        <TouchableOpacity
          style={[
            styles.sidebarItem,
            isActive && styles.sidebarItemActive,
            { paddingLeft: scale(16 + level * 20) },
          ]}
          onPress={handleItemPress}
          activeOpacity={0.7}
        >
          <View style={styles.sidebarItemLeft}>
            {hasChildren ? (
              <TouchableOpacity
                onPress={() => toggleExpand(itemId)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={scale(18)}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.expandPlaceholder} />
            )}
            
            <View style={[
              styles.sidebarItemIcon,
              isActive && styles.sidebarItemIconActive
            ]}>
              {isActive ? (
                <Ionicons name="play-circle" size={scale(18)} color="#FFFFFF" />
              ) : (
                <Text style={styles.sidebarItemNumber}>{displayLabel}</Text>
              )}
            </View>
            
            <View style={styles.sidebarItemContent}>
              <Text
                style={[
                  styles.sidebarItemText,
                  isActive && styles.sidebarItemTextActive,
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
              {isActive && (
                <View style={styles.sidebarItemBadge}>
                  <Text style={styles.sidebarItemBadgeText}>Đang học</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {hasChildren && isExpanded && (
          <View style={styles.sidebarChildren}>
            {children.map((child) => renderLectureItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  // Calculate progress
  const calculateProgress = () => {
    const flattenLectures = (lectures, result = []) => {
      lectures.forEach(lecture => {
        const children = lecture.children || lecture.Children || [];
        if (children.length === 0) {
          result.push(lecture);
        } else {
          flattenLectures(children, result);
        }
      });
      return result;
    };
    
    const allLectures = flattenLectures(lectureTree);
    const currentIndex = allLectures.findIndex(l => 
      String(l?.lectureId || l?.LectureId) === String(lectureId)
    );
    return {
      current: currentIndex + 1,
      total: allLectures.length,
    };
  };

  const progress = calculateProgress();

  if (loading && !lecture) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải bài giảng...</Text>
        </View>
      </View>
    );
  }

  if (!lecture && !loadingLecture) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Ionicons name="alert-circle-outline" size={scale(64)} color={colors.error} />
          <Text style={styles.errorTitle}>Không tìm thấy</Text>
          <Text style={styles.errorText}>Bài giảng không tồn tại</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const title = lecture?.Title || lecture?.title || '';
  const content = lecture?.RenderedHtml || lecture?.renderedHtml || lecture?.MarkdownContent || lecture?.markdownContent || '';
  const finalCourseTitle = course?.title || course?.Title || courseTitle || 'Khóa học';
  const finalLessonTitle = lesson?.title || lesson?.Title || lessonTitle || 'Bài học';
  const finalModuleName = module?.name || module?.Name || moduleName || 'Module';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity 
          onPress={() => setShowSidebar(true)} 
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.breadcrumbContent}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('MyCourses')}
              style={styles.breadcrumbLink}
            >
              <Text style={styles.breadcrumbLinkText}>Khóa học của tôi</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            {courseId && (
              <>
                <TouchableOpacity 
                  onPress={() => courseId && navigation.navigate('CourseDetail', { courseId })}
                  style={styles.breadcrumbLink}
                >
                  <Text style={styles.breadcrumbLinkText}>{finalCourseTitle}</Text>
                </TouchableOpacity>
                <Text style={styles.breadcrumbSeparator}> / </Text>
              </>
            )}
            <Text style={styles.breadcrumbLinkText}>Lesson</Text>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            {lessonId && (
              <>
                <TouchableOpacity 
                  onPress={() => lessonId && navigation.navigate('LessonDetail', { 
                    lessonId, 
                    lessonTitle: finalLessonTitle,
                    courseId,
                    courseTitle: finalCourseTitle,
                  })}
                  style={styles.breadcrumbLink}
                >
                  <Text style={styles.breadcrumbLinkText}>{finalLessonTitle}</Text>
                </TouchableOpacity>
                <Text style={styles.breadcrumbSeparator}> / </Text>
              </>
            )}
            <Text style={styles.breadcrumbCurrent}>{finalModuleName}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loadingLecture ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingContentText}>Đang tải nội dung...</Text>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>{title}</Text>
            {content ? (
              <RenderHTML
                contentWidth={windowWidth - scale(64)}
                source={{ html: content }}
                tagsStyles={{
                  p: styles.htmlParagraph,
                  h1: styles.htmlH1,
                  h2: styles.htmlH2,
                  h3: styles.htmlH3,
                  strong: styles.htmlStrong,
                  em: styles.htmlEm,
                  ul: styles.htmlList,
                  ol: styles.htmlList,
                  li: styles.htmlListItem,
                }}
              />
            ) : (
              <Text style={styles.noContent}>Nội dung bài giảng đang được cập nhật...</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Complete Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + verticalScale(10) }]}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={scale(24)} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Hoàn thành</Text>
          </LinearGradient>
        </TouchableOpacity>
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
          <View style={[styles.sidebar, { paddingTop: insets.top }]}>
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

            {progress.total > 0 && (
              <View style={styles.sidebarProgress}>
                <Text style={styles.sidebarProgressText}>
                  Tiến độ: {progress.current}/{progress.total}
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              {lectureTree.length > 0 ? (
                lectureTree.map((lecture) => renderLectureItem(lecture, 0))
              ) : (
                <View style={styles.noLectures}>
                  <Ionicons name="document-outline" size={scale(48)} color={colors.textLight} />
                  <Text style={styles.noLecturesText}>Chưa có bài giảng nào</Text>
                </View>
              )}
            </ScrollView>
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
    marginTop: verticalScale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: scale(32),
  },
  errorTitle: {
    fontSize: scale(24),
    fontWeight: '700',
    color: colors.text,
    marginTop: verticalScale(16),
  },
  errorText: {
    fontSize: scale(16),
    color: colors.textSecondary,
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  backButton: {
    marginTop: verticalScale(24),
    backgroundColor: colors.primary,
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
  },
  backButtonText: {
    fontSize: scale(16),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: scale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: scale(8),
  },
  breadcrumb: {
    backgroundColor: '#F9FAFB',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  breadcrumbLink: {
    paddingVertical: scale(4),
  },
  breadcrumbLinkText: {
    fontSize: scale(12),
    color: colors.primary,
  },
  breadcrumbSeparator: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginHorizontal: scale(4),
  },
  breadcrumbCurrent: {
    fontSize: scale(12),
    color: colors.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(16),
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  loadingContentText: {
    marginTop: verticalScale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contentTitle: {
    fontSize: scale(24),
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(16),
    lineHeight: scale(30),
  },
  noContent: {
    fontSize: scale(16),
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: verticalScale(32),
  },
  htmlParagraph: {
    fontSize: scale(16),
    color: colors.text,
    lineHeight: scale(24),
    marginBottom: verticalScale(12),
  },
  htmlH1: {
    fontSize: scale(28),
    fontWeight: '700',
    color: colors.text,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(12),
  },
  htmlH2: {
    fontSize: scale(24),
    fontWeight: '700',
    color: colors.text,
    marginTop: verticalScale(14),
    marginBottom: verticalScale(10),
  },
  htmlH3: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.text,
    marginTop: verticalScale(12),
    marginBottom: verticalScale(8),
  },
  htmlStrong: {
    fontWeight: '700',
    color: colors.text,
  },
  htmlEm: {
    fontStyle: 'italic',
    color: colors.text,
  },
  htmlList: {
    marginLeft: scale(16),
    marginBottom: verticalScale(12),
  },
  htmlListItem: {
    fontSize: scale(16),
    color: colors.text,
    lineHeight: scale(24),
    marginBottom: verticalScale(6),
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completeButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  completeButtonText: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(12),
    paddingRight: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sidebarItemActive: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: scale(4),
    borderLeftColor: colors.primary,
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(8),
  },
  expandButton: {
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandPlaceholder: {
    width: scale(24),
  },
  sidebarItemIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarItemIconActive: {
    backgroundColor: colors.primary,
  },
  sidebarItemNumber: {
    fontSize: scale(12),
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sidebarItemContent: {
    flex: 1,
  },
  sidebarItemText: {
    fontSize: scale(15),
    fontWeight: '500',
    color: colors.text,
    lineHeight: scale(20),
  },
  sidebarItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sidebarItemBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginTop: verticalScale(4),
    alignSelf: 'flex-start',
  },
  sidebarItemBadgeText: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sidebarChildren: {
    backgroundColor: '#F9FAFB',
  },
  noLectures: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  noLecturesText: {
    marginTop: verticalScale(16),
    fontSize: scale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LectureDetailScreen;
