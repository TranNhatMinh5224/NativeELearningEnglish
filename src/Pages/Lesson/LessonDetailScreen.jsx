import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import lessonService from '../../Services/lessonService';
import Toast from '../../Components/Common/Toast';
import { ModuleCard } from '../../Components/Lesson';

const LessonDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { lessonId, lessonTitle, courseId, courseTitle } = route.params || {};
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useFocusEffect(
    useCallback(() => {
      if (lessonId) {
        loadLessonDetail();
      }
    }, [lessonId])
  );

  const loadLessonDetail = async () => {
    try {
      setLoading(true);
      
      const [lessonResponse, modulesResponse] = await Promise.all([
        lessonService.getLessonById(lessonId),
        lessonService.getModulesByLessonId(lessonId)
      ]);
      
      // Handle lesson response - backend returns ServiceResponse format
      if (lessonResponse?.data?.success && lessonResponse?.data?.data) {
        setLesson(lessonResponse.data.data);
      } else if (lessonResponse?.data) {
        // Fallback for direct data
        setLesson(lessonResponse.data);
      }
      
      // Handle modules response - backend returns ServiceResponse format
      let modulesData = [];
      if (modulesResponse?.data?.success && modulesResponse?.data?.data) {
        modulesData = modulesResponse.data.data;
      } else if (modulesResponse?.data) {
        modulesData = Array.isArray(modulesResponse.data) ? modulesResponse.data : [];
      }
      
      // Sort modules by orderIndex (like Web app)
      const sortedModules = modulesData.sort((a, b) => {
        const orderA = a.orderIndex || a.OrderIndex || 0;
        const orderB = b.orderIndex || b.OrderIndex || 0;
        return orderA - orderB;
      });
      
      setModules(sortedModules);
    } catch (error) {
      console.error('Error loading lesson detail:', error);
      setToast({
        visible: true,
        message: error?.response?.data?.message || 'Không thể tải dữ liệu bài học',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModulePress = async (module) => {
    const rawModuleId = module.ModuleId || module.moduleId;
    if (!rawModuleId) {
      console.error('Module ID is missing');
      return;
    }

    // Parse moduleId to number
    const moduleId = typeof rawModuleId === 'string' ? parseInt(rawModuleId) : rawModuleId;
    if (!moduleId || isNaN(moduleId)) {
      console.error('Invalid module ID:', rawModuleId);
      return;
    }

    const moduleName = module.Name || module.name;
    
    // Handle both camelCase and PascalCase for contentType
    let contentType = module.ContentType || module.contentType;
    const contentTypeName = (module.ContentTypeName || module.contentTypeName || module.name || module.Name || '').toLowerCase();

    // Convert contentType to number if it's a string or enum (like Web app)
    if (typeof contentType === 'string') {
      const parsed = parseInt(contentType);
      if (!isNaN(parsed)) {
        contentType = parsed;
      } else {
        // If it's an enum string like "Assessment", "FlashCard", etc.
        const typeLower = contentType.toLowerCase();
        if (typeLower.includes('assessment') || typeLower.includes('assignment')) {
          contentType = 3; // Assessment
        } else if (typeLower.includes('flashcard') || typeLower.includes('flash')) {
          contentType = 2; // FlashCard
        } else {
          contentType = 1; // Default to Lecture
        }
      }
    }

    // If contentType is still undefined or null, check contentTypeName or module name
    if (contentType === undefined || contentType === null) {
      if (contentTypeName.includes('assessment') || contentTypeName.includes('assignment')) {
        contentType = 3; // Assessment
      } else if (contentTypeName.includes('flashcard') || contentTypeName.includes('flash')) {
        contentType = 2; // FlashCard
      } else {
        contentType = 1; // Default to Lecture
      }
    }

    // Call startModule API before navigation (like Web app)
    try {
      console.log(`Starting module ${moduleId}...`);
      await lessonService.startModule(moduleId);
      console.log(`Module ${moduleId} started successfully`);

      // Refresh modules list to update completion status
      try {
        const modulesResponse = await lessonService.getModulesByLessonId(lessonId);
        let modulesData = [];
        if (modulesResponse?.data?.success && modulesResponse?.data?.data) {
          modulesData = modulesResponse.data.data;
        } else if (modulesResponse?.data) {
          modulesData = Array.isArray(modulesResponse.data) ? modulesResponse.data : [];
        }
        
        // Sort by orderIndex
        const sortedModules = modulesData.sort((a, b) => {
          const orderA = a.orderIndex || a.OrderIndex || 0;
          const orderB = b.orderIndex || b.OrderIndex || 0;
          return orderA - orderB;
        });
        
        setModules(sortedModules);
      } catch (refreshErr) {
        console.error('Error refreshing modules list:', refreshErr);
        // Continue navigation even if refresh fails
      }
    } catch (err) {
      console.error(`Error starting module ${moduleId}:`, err);
      // Still continue navigation even if API fails
    }

    // Navigate based on ContentType: 1=Lecture, 2=FlashCard, 3=Assessment
    if (contentType === 2 || contentTypeName.includes('flashcard') || contentTypeName.includes('flash')) {
      // Navigate to FlashCard screen
      navigation.navigate('FlashCardLearning', {
        moduleId,
        moduleName,
      });
    } else if (contentType === 3 || 
               contentTypeName.includes('assessment') || 
               contentTypeName.includes('assignment') ||
               contentTypeName.includes('essay') ||
               contentTypeName.includes('quiz') ||
               contentTypeName.includes('test')) {
      // Navigate to Assignment screen (if available)
      console.log('Assignment module:', moduleId);
      // TODO: Add Assignment screen navigation when available
    } else if (contentType === 1 || contentTypeName.includes('lecture')) {
      // Navigate to Lecture screen
      navigation.navigate('ModuleLearning', {
        moduleId,
        moduleName,
        lessonId,
        lessonTitle,
      });
    } else {
      // Default: navigate to Lecture screen
      navigation.navigate('ModuleLearning', {
        moduleId,
        moduleName,
        lessonId,
        lessonTitle,
      });
    }
  };

  const handlePronunciationPress = (module) => {
    const moduleId = module?.ModuleId || module?.moduleId;
    const moduleName = module?.Name || module?.name || 'Module';
    
    if (!moduleId) {
      console.error('Module ID is missing');
      return;
    }

    // Navigate to PronunciationDetail screen
    navigation.navigate('PronunciationDetail', {
      moduleId,
      moduleName,
      lessonId,
      lessonTitle,
      courseId,
      courseTitle,
    });
  };

  const renderModule = (module, index) => {
    const contentType = module?.ContentType || module?.contentType || 1;
    const isFlashCard = contentType === 4 || contentType === 2; // 2 hoặc 4 là FlashCard
    
    return (
      <ModuleCard
        key={module.ModuleId || module.moduleId || index}
        module={module}
        index={index}
        onPress={() => handleModulePress(module)}
        onPronunciationClick={isFlashCard ? () => handlePronunciationPress(module) : undefined}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài học...</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={scale(48)} color={colors.error} />
        <Text style={styles.errorText}>Không tìm thấy bài học</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = lesson?.IsCompleted || lesson?.isCompleted || false;

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
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {lessonTitle || 'Bài học'}
            </Text>
            {isCompleted && (
              <View style={styles.headerCompletedBadge}>
                <Ionicons name="checkmark-circle" size={scale(16)} color="#10B981" />
                <Text style={styles.headerCompletedText}>Đã hoàn thành</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lesson Description */}
        {lesson.Description || lesson.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>📚 Mô tả bài học</Text>
            <Text style={styles.descriptionText}>
              {lesson.Description || lesson.description}
            </Text>
          </View>
        ) : null}

        {/* Modules */}
        {modules.length > 0 ? (
          <View style={styles.modulesSection}>
            <Text style={styles.sectionTitle}>📖 Nội dung bài học</Text>
            {modules.map((module, index) => renderModule(module, index))}
          </View>
        ) : (
          <View style={styles.emptyModules}>
            <Ionicons name="document-outline" size={scale(48)} color={colors.textLight} />
            <Text style={styles.emptyModulesText}>
              Nội dung bài học đang được cập nhật
            </Text>
          </View>
        )}

        {/* Completion Status */}
        {isCompleted && (
          <View style={styles.completedContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completedGradient}
            >
              <Ionicons name="checkmark-circle" size={scale(24)} color="#FFFFFF" />
              <Text style={styles.completedText}>Bạn đã hoàn thành bài học này</Text>
            </LinearGradient>
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
    paddingBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerBackButton: {
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
    marginBottom: 8,
  },
  headerCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: scale(12),
    alignSelf: 'flex-start',
  },
  headerCompletedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modulesSection: {
    marginBottom: 16,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(18),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleMetaText: {
    fontSize: 12,
    color: colors.textLight,
  },
  completedBadge: {
    marginLeft: 8,
  },
  moduleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  emptyModules: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyModulesText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  completedContainer: {
    marginTop: 16,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  completedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: verticalScale(20),
  },
});

export default LessonDetailScreen;