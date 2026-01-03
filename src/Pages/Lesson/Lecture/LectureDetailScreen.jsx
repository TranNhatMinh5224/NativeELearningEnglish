import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import lessonService from '../../../Services/lessonService';
import Toast from '../../../Components/Common/Toast';

const { width } = Dimensions.get('window');

const LectureDetailScreen = ({ route, navigation }) => {
  const { lectureId, moduleId, moduleName, lectures: passedLectures } = route.params || {};
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [lecture, setLecture] = useState(null);
  const [lectures, setLectures] = useState(passedLectures || []);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (lectureId) {
      loadLecture();
    }
    if (!lectures || lectures.length === 0) {
      loadLectureTree();
    }
  }, [lectureId]);

  const loadLectureTree = async () => {
    try {
      const treeResponse = await lessonService.getLectureTreeByModuleId(moduleId);
      const treeData = treeResponse?.data || treeResponse || [];
      
      // Flatten tree structure
      const flattenLectures = (lectures, result = [], level = 0) => {
        lectures.forEach(lecture => {
          result.push({ ...lecture, level });
          if (lecture.Children && lecture.Children.length > 0) {
            flattenLectures(lecture.Children, result, level + 1);
          } else if (lecture.children && lecture.children.length > 0) {
            flattenLectures(lecture.children, result, level + 1);
          }
        });
        return result;
      };
      
      const allLectures = flattenLectures(treeData);
      setLectures(allLectures);
    } catch (error) {
      console.error('Error loading lecture tree:', error);
    }
  };

  const loadLecture = async () => {
    try {
      setLoading(true);
      const response = await lessonService.getLectureById(lectureId);
      console.log('✅ Lecture Response:', JSON.stringify(response, null, 2));
      
      // axiosClient already unwraps one layer
      const lectureData = response?.data || response;
      console.log('✅ Lecture Data:', JSON.stringify(lectureData, null, 2));
      
      setLecture(lectureData);
    } catch (error) {
      console.error('❌ Error loading lecture:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải nội dung bài giảng',
        type: 'error',
      });
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark lecture as completed (auto-complete for lecture type)
      await lessonService.startModule(moduleId);
      
      setToast({
        visible: true,
        message: '✅ Đã hoàn thành bài giảng!',
        type: 'success',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error completing lecture:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể hoàn thành bài giảng',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài giảng...</Text>
      </View>
    );
  }

  if (!lecture) {
    return (
      <View style={styles.errorContainer}>
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
    );
  }

  const title = lecture?.Title || lecture?.title || '';
  const content = lecture?.RenderedHtml || lecture?.renderedHtml || lecture?.MarkdownContent || lecture?.markdownContent || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerButton} />
      </LinearGradient>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>
          Khóa học của tôi / {moduleName || 'Module'} / Lesson / {title}
        </Text>
      </View>


      {/* Simple Menu Button */}
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setShowSidebar(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={scale(28)} color="#6B7280" />
      </TouchableOpacity>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <View style={styles.titleRow}>
            <Text style={styles.contentTitle}>{title}</Text>
            <TouchableOpacity 
              style={styles.inlineMenuButton}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={scale(28)} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
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
            
            <View style={styles.sidebarProgress}>
              <Text style={styles.sidebarProgressText}>
                Tiến độ: {lectures.findIndex(l => String(l?.LectureId || l?.lectureId) === String(lectureId)) + 1}/{lectures.length}
              </Text>
            </View>
            
            <FlatList
              data={lectures}
              keyExtractor={(item, index) => String(item?.LectureId || item?.lectureId || index)}
              renderItem={({ item, index }) => {
                const lectureIdStr = String(item?.LectureId || item?.lectureId);
                const currentLectureIdStr = String(lectureId);
                const isActive = lectureIdStr === currentLectureIdStr;
                const itemTitle = item?.Title || item?.title || `Bài ${index + 1}`;
                const level = item?.level || 0;
                const numberingLabel = item?.NumberingLabel || item?.numberingLabel || `${index + 1}`;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.sidebarItem,
                      isActive && styles.sidebarItemActive,
                      { marginLeft: scale(level * 16) },
                    ]}
                    onPress={() => {
                      navigation.replace('LectureDetailScreen', {
                        lectureId: item?.LectureId || item?.lectureId,
                        moduleId,
                        moduleName,
                        lectures,
                      });
                      setShowSidebar(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sidebarItemLeft}>
                      <View style={[
                        styles.sidebarItemIcon,
                        isActive && styles.sidebarItemIconActive
                      ]}>
                        {isActive ? (
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
                      </View>
                    </View>
                    <Ionicons 
                      name={isActive ? "checkmark-circle" : "chevron-forward"} 
                      size={scale(20)} 
                      color={isActive ? "#10B981" : "#9CA3AF"} 
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
    marginTop: verticalScale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Medium',
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
    fontFamily: 'Quicksand-Bold',
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
    fontFamily: 'Quicksand-Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
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
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: scale(8),
  },
  breadcrumb: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breadcrumbText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Regular',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(16),
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  contentTitle: {
    flex: 1,
    fontSize: scale(18),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    lineHeight: scale(22),
    paddingRight: scale(8),
  },
  inlineMenuButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: scale(8),
  },
  noContent: {
    fontSize: scale(16),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: verticalScale(32),
  },
  htmlParagraph: {
    fontSize: scale(16),
    color: colors.text,
    fontFamily: 'Quicksand-Regular',
    lineHeight: scale(24),
    marginBottom: verticalScale(12),
  },
  htmlH1: {
    fontSize: scale(28),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(12),
  },
  htmlH2: {
    fontSize: scale(24),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginTop: verticalScale(14),
    marginBottom: verticalScale(10),
  },
  htmlH3: {
    fontSize: scale(20),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginTop: verticalScale(12),
    marginBottom: verticalScale(8),
  },
  htmlStrong: {
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
  },
  htmlEm: {
    fontFamily: 'Quicksand-RegularItalic',
    color: colors.text,
  },
  htmlList: {
    marginLeft: scale(16),
    marginBottom: verticalScale(12),
  },
  htmlListItem: {
    fontSize: scale(16),
    color: colors.text,
    fontFamily: 'Quicksand-Regular',
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
    fontFamily: 'Quicksand-Bold',
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
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  sidebarSeparator: {
    height: 0,
  },
});

export default LectureDetailScreen;
