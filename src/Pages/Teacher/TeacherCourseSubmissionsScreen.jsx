import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import teacherService from '../../Services/teacherService';
import { getResponseData } from '../../Utils/apiHelper';
import Toast from '../../Components/Common/Toast';

const TeacherCourseSubmissionsScreen = ({ route, navigation }) => {
  const { courseId, courseTitle, lessonId, lessonTitle, moduleId, moduleName, assessmentId, assessmentTitle, essayId, essayTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [currentLevel, setCurrentLevel] = useState('course'); // course, lesson, module, assessment, essay
  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [essays, setEssays] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (essayId) {
        // Navigate directly to submissions if essayId is provided
        navigation.navigate('TeacherEssaySubmissions', {
          essayId,
          essayTitle: essayTitle || 'Bài nộp',
        });
      } else if (assessmentId) {
        loadQuizzesAndEssays();
      } else if (moduleId && lessonId) {
        // If we have moduleId, load assessments from module first
        loadAssessmentsFromModule();
      } else if (lessonId) {
        loadModules();
      } else if (courseId) {
        loadLessons();
      }
    }, [courseId, lessonId, moduleId, assessmentId, essayId, modules])
  );

  const loadEssaysForAssessment = async (assessmentIdToLoad) => {
    try {
      setLoading(true);
      
      // Load both quizzes and essays in parallel
      const [quizzesResponse, essaysResponse] = await Promise.all([
        teacherService.getQuizzesByAssessment(assessmentIdToLoad).catch(() => null),
        teacherService.getEssaysByAssessment(assessmentIdToLoad).catch(() => null),
      ]);
      
      // Process quizzes
      let quizzesList = [];
      if (quizzesResponse) {
        const quizzesData = getResponseData(quizzesResponse);
        quizzesList = Array.isArray(quizzesData) ? quizzesData : (quizzesData?.items || []);
        setQuizzes(quizzesList);
      }
      
      // Process essays
      let essaysList = [];
      if (essaysResponse) {
        const essaysData = getResponseData(essaysResponse);
        essaysList = Array.isArray(essaysData) ? essaysData : (essaysData?.items || []);
        setEssays(essaysList);
      }
      
      setCurrentLevel('assessment');
      
      // Auto-navigate logic
      // If only one quiz and no essays, auto-navigate to attempts
      if (quizzesList.length === 1 && essaysList.length === 0) {
        const firstQuiz = quizzesList[0];
        const quizIdValue = firstQuiz.quizId || firstQuiz.QuizId;
        const quizTitleValue = firstQuiz.title || firstQuiz.Title || 'Quiz';
        if (quizIdValue) {
          navigation.navigate('TeacherQuizAttempts', {
            quizId: quizIdValue,
            quizTitle: quizTitleValue,
            assessmentId: assessmentIdToLoad,
            assessmentTitle: assessmentTitle,
            courseId: courseId,
            courseTitle: courseTitle,
            lessonId: lessonId,
            lessonTitle: lessonTitle,
            moduleId: moduleId,
            moduleName: moduleName,
          });
        }
      }
      // If only one essay and no quizzes, auto-navigate to submissions
      else if (essaysList.length === 1 && quizzesList.length === 0) {
        const firstEssay = essaysList[0];
        const essayIdValue = firstEssay.essayId || firstEssay.EssayId;
        const essayTitleValue = firstEssay.title || firstEssay.Title || 'Bài nộp';
        if (essayIdValue) {
          navigation.navigate('TeacherEssaySubmissions', {
            essayId: essayIdValue,
            essayTitle: essayTitleValue,
            assessmentId: assessmentIdToLoad,
          });
        }
      }
    } catch (error) {
      Toast.show(error?.message || 'Không thể tải danh sách quizzes và essays', 'error');
      setEssays([]);
      setQuizzes([]);
      setCurrentLevel('assessment');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getLessonsByCourse(courseId);
      const data = getResponseData(response);
      const lessonsList = Array.isArray(data) ? data : (data?.items || []);
      setLessons(lessonsList);
      setCurrentLevel('course');
    } catch (error) {
      Toast.show(error?.message || 'Không thể tải danh sách bài học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getModulesByLesson(lessonId);
      const data = getResponseData(response);
      const modulesList = Array.isArray(data) ? data : (data?.items || []);
      setModules(modulesList);
      setCurrentLevel('lesson');
    } catch (error) {
      Toast.show(error?.message || 'Không thể tải danh sách modules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async () => {
    try {
      setLoading(true);
      // Get modules by lesson, then filter for Assessment type (contentType = 3)
      const response = await teacherService.getModulesByLesson(lessonId);
      const data = getResponseData(response);
      
      // Filter modules with contentType = 3 (Assessment)
      const modulesList = Array.isArray(data) ? data : (data?.items || []);
      const assessmentModules = modulesList.filter(m => 
        (m.contentType === 3 || m.ContentType === 3)
      );
      
      setAssessments(assessmentModules);
      setCurrentLevel('module');
    } catch (error) {
      Toast.show(error?.message || 'Không thể tải danh sách assessments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentsFromModule = async () => {
    try {
      setLoading(true);
      // Get assessments by module ID
      const response = await teacherService.getAssessmentsByModule(moduleId);
      const data = getResponseData(response);
      const assessmentsList = Array.isArray(data) ? data : (data?.items || []);
      
      if (assessmentsList.length > 0) {
        // Show list of assessments
        setAssessments(assessmentsList);
        setCurrentLevel('module'); // Stay at module level to show assessments
      } else {
        // No assessments found
        Toast.show('Module này chưa có assessment nào', 'error');
        setAssessments([]);
        setCurrentLevel('module');
      }
    } catch (error) {
      Toast.show(error?.message || 'Không thể tải danh sách assessments', 'error');
      setAssessments([]);
      setCurrentLevel('module');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzesAndEssays = async () => {
    try {
      setLoading(true);
      
      // Load both quizzes and essays in parallel
      const [quizzesResponse, essaysResponse] = await Promise.all([
        teacherService.getQuizzesByAssessment(assessmentId).catch(() => null),
        teacherService.getEssaysByAssessment(assessmentId).catch(() => null),
      ]);
      
      // Process quizzes
      let quizzesList = [];
      if (quizzesResponse) {
        const quizzesData = getResponseData(quizzesResponse);
        quizzesList = Array.isArray(quizzesData) ? quizzesData : (quizzesData?.items || []);
        setQuizzes(quizzesList);
      }
      
      // Process essays
      let essaysList = [];
      if (essaysResponse) {
        const essaysData = getResponseData(essaysResponse);
        essaysList = Array.isArray(essaysData) ? essaysData : (essaysData?.items || []);
        setEssays(essaysList);
      }
      
      setCurrentLevel('assessment');
    } catch (error) {
      Toast.show(error?.message || 'Không thể tải danh sách quizzes và essays', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (assessmentId) {
      await loadQuizzesAndEssays();
    } else if (moduleId) {
      await loadAssessments();
    } else if (lessonId) {
      await loadModules();
    } else if (courseId) {
      await loadLessons();
    }
    setRefreshing(false);
  };

  const handleLessonPress = (lesson) => {
    navigation.navigate('TeacherCourseSubmissions', {
      courseId,
      courseTitle,
      lessonId: lesson.lessonId || lesson.LessonId,
      lessonTitle: lesson.title || lesson.Title,
    });
  };

  const handleModulePress = async (module) => {
    const moduleIdValue = module.moduleId || module.ModuleId;
    const moduleNameValue = module.name || module.Name;
    
    // Navigate to module level - will load assessments from module
    navigation.navigate('TeacherCourseSubmissions', {
      courseId,
      courseTitle,
      lessonId,
      lessonTitle,
      moduleId: moduleIdValue,
      moduleName: moduleNameValue,
    });
  };

  const handleAssessmentPress = (assessment) => {
    const assessmentIdValue = assessment.assessmentId || assessment.AssessmentId;
    const assessmentTitleValue = assessment.title || assessment.Title || assessment.name || assessment.Name || 'Assessment';
    
    if (assessmentIdValue) {
      // Navigate with assessmentId to load essays
      navigation.navigate('TeacherCourseSubmissions', {
        courseId,
        courseTitle,
        lessonId,
        lessonTitle,
        moduleId,
        moduleName,
        assessmentId: assessmentIdValue,
        assessmentTitle: assessmentTitleValue,
      });
    } else {
      Toast.show('Assessment không hợp lệ', 'error');
    }
  };

  const handleQuizPress = (quiz) => {
    navigation.navigate('TeacherQuizAttempts', {
      quizId: quiz.quizId || quiz.QuizId,
      quizTitle: quiz.title || quiz.Title,
      assessmentId: assessmentId,
    });
  };

  const handleEssayPress = (essay) => {
    navigation.navigate('TeacherEssaySubmissions', {
      essayId: essay.essayId || essay.EssayId,
      essayTitle: essay.title || essay.Title,
      assessmentId: assessmentId,
    });
  };

  const getBreadcrumb = () => {
    const items = [];
    if (courseTitle) {
      items.push({ label: courseTitle, level: 'course' });
    }
    if (lessonTitle) {
      items.push({ label: lessonTitle, level: 'lesson' });
    }
    if (moduleName) {
      items.push({ label: moduleName, level: 'module' });
    }
    if (assessmentTitle) {
      items.push({ label: assessmentTitle, level: 'assessment' });
    }
    
    return items;
  };

  const handleBreadcrumbPress = (level) => {
    if (level === 'course') {
      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle });
    } else if (level === 'lesson') {
      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle, lessonId, lessonTitle });
    } else if (level === 'module') {
      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle, lessonId, lessonTitle, moduleId, moduleName });
    }
  };

  const renderList = () => {
    if (currentLevel === 'course' || (!lessonId && courseId)) {
      return (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Chọn bài học</Text>
          {lessons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={scale(48)} color={colors.textLight} />
              <Text style={styles.emptyText}>Chưa có bài học nào</Text>
            </View>
          ) : (
            lessons.map((lesson, index) => {
              const lessonIdValue = lesson.lessonId || lesson.LessonId;
              const lessonTitleValue = lesson.title || lesson.Title || 'Bài học';
              return (
                <TouchableOpacity
                  key={`lesson-${lessonIdValue || index}`}
                  style={styles.itemCard}
                  onPress={() => handleLessonPress(lesson)}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons name="book" size={scale(24)} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{lessonTitleValue}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      );
    }

    if (currentLevel === 'lesson' || (lessonId && !moduleId)) {
      // Filter Assessment modules first to avoid key conflicts
      const assessmentModules = modules.filter(m => 
        (m.contentType === 3 || m.ContentType === 3)
      );
      
      return (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Chọn module</Text>
          {assessmentModules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="layers-outline" size={scale(48)} color={colors.textLight} />
              <Text style={styles.emptyText}>Chưa có module Assessment nào</Text>
            </View>
          ) : (
            assessmentModules.map((module, index) => {
              const moduleIdValue = module.moduleId || module.ModuleId;
              const moduleNameValue = module.name || module.Name || 'Module';
              
              return (
                <TouchableOpacity
                  key={`module-${moduleIdValue || index}`}
                  style={styles.itemCard}
                  onPress={() => handleModulePress(module)}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons name="document-text" size={scale(24)} color="#F59E0B" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{moduleNameValue}</Text>
                    <Text style={styles.itemSubtitle}>Assessment</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      );
    }

    // Show assessments from module when moduleId is present and assessments are loaded
    if ((currentLevel === 'module' || (moduleId && !assessmentId)) && assessments.length > 0) {
      // Show list of assessments from module
      return (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Chọn assessment</Text>
          {assessments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={scale(48)} color={colors.textLight} />
              <Text style={styles.emptyText}>Chưa có assessment nào</Text>
            </View>
          ) : (
            assessments.map((assessment, index) => {
              const assessmentIdValue = assessment.assessmentId || assessment.AssessmentId;
              const assessmentTitleValue = assessment.title || assessment.Title || assessment.name || assessment.Name || 'Assessment';
              return (
                <TouchableOpacity
                  key={`assessment-${assessmentIdValue || index}`}
                  style={styles.itemCard}
                  onPress={() => handleAssessmentPress(assessment)}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons name="clipboard" size={scale(24)} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{assessmentTitleValue}</Text>
                    <Text style={styles.itemSubtitle}>Assessment</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      );
    }

    // Show assessment modules (contentType = 3) when we're at module level but haven't loaded assessments yet
    if (currentLevel === 'module' || (moduleId && !assessmentId && assessments.length === 0)) {
      const assessmentModules = modules.filter(m => 
        (m.contentType === 3 || m.ContentType === 3)
      );
      
      return (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Chọn module</Text>
          {assessmentModules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={scale(48)} color={colors.textLight} />
              <Text style={styles.emptyText}>Chưa có module Assessment nào</Text>
            </View>
          ) : (
            assessmentModules.map((module, index) => {
              const moduleIdValue = module.moduleId || module.ModuleId;
              const moduleNameValue = module.name || module.Name || 'Assessment';
              return (
                <TouchableOpacity
                  key={`module-assess-${moduleIdValue || index}`}
                  style={styles.itemCard}
                  onPress={() => handleModulePress(module)}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons name="clipboard" size={scale(24)} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{moduleNameValue}</Text>
                    <Text style={styles.itemSubtitle}>Assessment</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={scale(20)} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      );
    }

    if (currentLevel === 'assessment' || assessmentId) {
      // Show both quizzes and essays
      const hasQuizzes = quizzes.length > 0;
      const hasEssays = essays.length > 0;
      
      if (!hasQuizzes && !hasEssays) {
        return (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Chọn quiz hoặc essay</Text>
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={scale(48)} color={colors.textLight} />
              <Text style={styles.emptyText}>Chưa có quiz hoặc essay nào</Text>
            </View>
          </View>
        );
      }
      
      return (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Chọn quiz hoặc essay</Text>
          
          {/* Quizzes Section */}
          {hasQuizzes && (
            <>
              {quizzes.length > 0 && (
                <Text style={styles.sectionSubtitle}>Quizzes</Text>
              )}
              {quizzes.map((quiz, index) => {
                const quizIdValue = quiz.quizId || quiz.QuizId;
                const quizTitleValue = quiz.title || quiz.Title || 'Quiz';
                return (
                  <TouchableOpacity
                    key={`quiz-${quizIdValue || index}`}
                    style={styles.itemCard}
                    onPress={() => handleQuizPress(quiz)}
                  >
                    <View style={styles.itemIcon}>
                      <Ionicons name="clipboard" size={scale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{quizTitleValue}</Text>
                      <Text style={styles.itemSubtitle}>Quiz</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          
          {/* Essays Section */}
          {hasEssays && (
            <>
              {essays.length > 0 && (
                <Text style={[styles.sectionSubtitle, { marginTop: hasQuizzes ? 16 : 0 }]}>Essays</Text>
              )}
              {essays.map((essay, index) => {
                const essayIdValue = essay.essayId || essay.EssayId;
                const essayTitleValue = essay.title || essay.Title || 'Essay';
                return (
                  <TouchableOpacity
                    key={`essay-${essayIdValue || index}`}
                    style={styles.itemCard}
                    onPress={() => handleEssayPress(essay)}
                  >
                    <View style={styles.itemIcon}>
                      <Ionicons name="document-text" size={scale(24)} color="#10B981" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{essayTitleValue}</Text>
                      <Text style={styles.itemSubtitle}>Essay</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>
      );
    }

    return null;
  };

  if (loading && !lessons.length && !modules.length && !assessments.length && !essays.length) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const breadcrumb = getBreadcrumb();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#4F46E5']}
        style={[styles.header, { paddingTop: insets.top + verticalScale(16) }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (breadcrumb.length > 1) {
                const prevLevel = breadcrumb[breadcrumb.length - 2].level;
                handleBreadcrumbPress(prevLevel);
              } else {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }
            }}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].label : 'Quản lý bài nộp'}
            </Text>
          </View>
        </View>

        {breadcrumb.length > 0 && (
          <View style={styles.breadcrumbContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => handleBreadcrumbPress('course')}
                style={styles.breadcrumbItem}
              >
                <Text style={styles.breadcrumbText}>Tất cả khóa học</Text>
              </TouchableOpacity>
              {breadcrumb.map((item, index) => (
                <View key={`breadcrumb-${item.level}-${index}`} style={styles.breadcrumbRow}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="rgba(255,255,255,0.7)" />
                  <TouchableOpacity
                    onPress={() => index < breadcrumb.length - 1 ? handleBreadcrumbPress(item.level) : null}
                    style={styles.breadcrumbItem}
                  >
                    <Text
                      style={[
                        styles.breadcrumbText,
                        index === breadcrumb.length - 1 && styles.breadcrumbTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderList()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: verticalScale(20),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: scale(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  breadcrumbItem: {
    marginLeft: 8,
  },
  breadcrumbText: {
    fontSize: scale(13),
    color: 'rgba(255,255,255,0.8)',
  },
  breadcrumbTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  listContainer: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: scale(12),
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginTop: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: scale(14),
    color: colors.textLight,
  },
});

export default TeacherCourseSubmissionsScreen;

