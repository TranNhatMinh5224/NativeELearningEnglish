import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../Theme/responsive';
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
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (lessonId) {
      loadLessonDetail();
    }
  }, [lessonId]);

  const loadLessonDetail = async () => {
    try {
      setLoading(true);
      
      // Load lesson info and modules in parallel
      const [lessonResponse, modulesResponse] = await Promise.all([
        lessonService.getLessonById(lessonId),
        lessonService.getModulesByLessonId(lessonId)
      ]);
      
      const lessonData = lessonResponse?.data || lessonResponse;
      setLesson(lessonData);
      
      // Get modules from response
      const modulesData = modulesResponse?.data || modulesResponse || [];
      setModules(Array.isArray(modulesData) ? modulesData : []);
    } catch (error) {
      console.error('Error loading lesson detail:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải nội dung bài giảng',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    try {
      setCompleting(true);
      await lessonService.markLessonCompleted(lessonId);
      
      setToast({
        visible: true,
        message: 'Đã hoàn thành bài học!',
        type: 'success',
      });
      
      // Reload lesson to update completion status
      await loadLessonDetail();
    } catch (error) {
      console.error('Error completing lesson:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể đánh dấu hoàn thành',
        type: 'error',
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleModulePress = (module) => {
    const moduleId = module.ModuleId || module.moduleId;
    const moduleName = module.Name || module.name;
    const contentType = module.ContentType || module.contentType || 1;
    
    // Navigate to appropriate screen based on module type
    // Backend enum: 1=Lecture, 2=Quiz, 3=Assignment, 4=FlashCard, 5=Video, 6=Reading
    switch (contentType) {
      case 1: // Lecture
        navigation.navigate('ModuleLearning', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
        
      case 2: // Quiz
        navigation.navigate('QuizScreen', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
        
      case 3: // Assignment
        navigation.navigate('AssignmentScreen', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
        
      case 4: // FlashCard
        navigation.navigate('FlashcardLearning', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
        
      case 5: // Video
        navigation.navigate('ModuleLearning', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
        
      case 6: // Reading
        navigation.navigate('ModuleLearning', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
        
      default: // Default to module learning
        navigation.navigate('ModuleLearning', {
          moduleId,
          moduleName,
          lessonId,
          lessonTitle,
        });
        break;
    }
  };

  const renderModule = (module, index) => {
    return (
      <ModuleCard
        key={module.ModuleId || module.moduleId || index}
        module={module}
        index={index}
        onPress={() => handleModulePress(module)}
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

  const isCompleted = lesson.IsCompleted || lesson.isCompleted || false;

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

        {/* Complete Button */}
        {!isCompleted && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteLesson}
            disabled={completing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeGradient}
            >
              {completing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={scale(20)} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Hoàn thành bài học</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  completeButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginTop: 8,
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: verticalScale(20),
  },
});

export default LessonDetailScreen;
