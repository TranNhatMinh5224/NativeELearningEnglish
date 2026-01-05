import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import lessonService from '../../../Services/lessonService';
import quizService from '../../../Services/quizService';
import essayService from '../../../Services/essayService';
import Toast from '../../../Components/Common/Toast';

const { width } = Dimensions.get('window');

const formatDateTimeVi = (value) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const time = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const day = date.toLocaleDateString('vi-VN');
    return `${time} ${day}`;
  } catch {
    return null;
  }
};

const AssignmentDetailScreen = ({ route, navigation }) => {
  const { moduleId, moduleName, assessmentId, lessonId, lessonTitle } = route.params || {};
  const insets = useSafeAreaInsets();

  const [assessment, setAssessment] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    } else if (moduleId) {
      loadModuleAssessments();
    }
  }, [assessmentId, moduleId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      // Load assessment basic info
      const response = await lessonService.getAssessmentById(assessmentId);

      // axiosClient already unwraps one layer (ServiceResponse)
      const assessmentData = response?.data || response;
      setAssessment(assessmentData);

      // Load quizzes & essays for this assessment using dedicated endpoints
      try {
        const [quizzesRes, essaysRes] = await Promise.all([
          quizService.getQuizzesByAssessmentId(assessmentId),
          essayService.getEssaysByAssessmentId(assessmentId),
        ]);

        const quizzesList = quizzesRes?.data || quizzesRes || [];
        const essaysList = essaysRes?.data || essaysRes || [];

        setQuizzes(quizzesList.map((q) => ({ ...q, assessment: assessmentData })));
        setEssays(essaysList.map((e) => ({ ...e, assessment: assessmentData })));
      } catch (childErr) {
      }
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải bài tập',
        type: 'error',
      });
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadModuleAssessments = async () => {
    try {
      setLoading(true);
      // Load assessments directly from the correct API endpoint
      const response = await lessonService.getAssessmentsByModuleId(moduleId);
      
      // axiosClient already unwraps one layer
      const assessmentsList = response?.data || response || [];
      
      // Load quizzes & essays for each assessment in this module
      const allQuizzes = [];
      const allEssays = [];
      
      for (const assessment of assessmentsList) {
        try {
          const currentAssessmentId = assessment.assessmentId || assessment.AssessmentId;
          if (!currentAssessmentId) continue;

          const detailResponse = await lessonService.getAssessmentById(currentAssessmentId);
          const detailData = detailResponse?.data || detailResponse;

          const [quizzesRes, essaysRes] = await Promise.all([
            quizService.getQuizzesByAssessmentId(currentAssessmentId),
            essayService.getEssaysByAssessmentId(currentAssessmentId),
          ]);

          const quizzesList = quizzesRes?.data || quizzesRes || [];
          const essaysList = essaysRes?.data || essaysRes || [];

          allQuizzes.push(...quizzesList.map((q) => ({ ...q, assessment: detailData })));
          allEssays.push(...essaysList.map((e) => ({ ...e, assessment: detailData })));
        } catch (err) {
        }
      }
      
      setAssessment({ assessments: assessmentsList });
      setQuizzes(allQuizzes);
      setEssays(allEssays);
      
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải bài tập',
        type: 'error',
      });
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    try {
      const quizId = quiz?.quizId || quiz?.QuizId;
      const quizTitle = quiz?.title || quiz?.Title || '';
      const assessmentData = quiz?.assessment || {};
      
      // Check for active attempt first
      try {
        const activeAttemptResponse = await quizService.checkActiveAttempt(quizId);
        // axiosClient unwraps one layer, so response is ServiceResponse
        // ServiceResponse has .data property containing ActiveAttemptDto
        const responseData = activeAttemptResponse?.data || activeAttemptResponse;
        
        if (responseData?.hasActiveAttempt || responseData?.HasActiveAttempt) {
          const activeAttemptId = responseData?.attemptId || responseData?.AttemptId;
          
          if (activeAttemptId) {
            // Show alert with options
            Alert.alert(
              'Bài làm đang dở',
              'Bạn có một bài làm đang dở. Bạn muốn tiếp tục hay bắt đầu làm bài mới?',
              [
                {
                  text: 'Bắt đầu làm bài mới',
                  style: 'destructive',
                  onPress: () => {
                    // Navigate to quiz screen to start new attempt (forceNewAttempt flag to skip active attempt check)
                    navigation.navigate('QuizScreen', {
                      quizId,
                      quizTitle,
                      assessment: assessmentData,
                      moduleId,
                      moduleName,
                      forceNewAttempt: true, // Flag to skip active attempt check
                    });
                  },
                },
                {
                  text: 'Tiếp tục bài làm',
                  onPress: () => {
                    // Navigate to quiz screen with attemptId to resume
                    navigation.navigate('QuizScreen', {
                      quizId,
                      attemptId: activeAttemptId,
                      quizTitle,
                      assessment: assessmentData,
                      moduleId,
                      moduleName,
                    });
                  },
                },
              ],
              { cancelable: true }
            );
            return;
          }
        }
      } catch (checkError) {
        // If check fails, continue with normal flow
      }
      
      // No active attempt, navigate directly to start new quiz
      navigation.navigate('QuizScreen', {
        quizId,
        quizTitle,
        assessment: assessmentData,
        moduleId,
        moduleName,
      });
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể bắt đầu quiz',
        type: 'error',
      });
    }
  };

  const handleStartEssay = async (essay) => {
    try {
      const essayId = essay?.essayId || essay?.EssayId;
      const essayTitle = essay?.title || essay?.Title || '';
      const assessmentData = essay?.assessment || {};
      
      // Navigate to essay screen with essayId
      navigation.navigate('EssayScreen', {
        essayId,
        essayTitle,
        assessment: assessmentData,
        moduleId,
        moduleName,
      });
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể bắt đầu bài essay',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài tập...</Text>
      </View>
    );
  }

  if (!assessment && quizzes.length === 0 && essays.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={scale(64)} color={colors.textSecondary} />
        <Text style={styles.errorTitle}>Chưa có bài tập</Text>
        <Text style={styles.errorText}>Module này chưa có bài tập nào</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = assessment?.Title || assessment?.title || '';
  const description = assessment?.Description || assessment?.description || '';

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
        colors={['#7C3AED', '#6D28D9']}
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
          Khóa học của tôi / {lessonTitle || 'Lesson'} / {moduleName || 'Module'} / {title}
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>{title}</Text>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}

        {/* Quiz Section */}
        {quizzes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Danh sách bài tập</Text>
            {quizzes.map((quiz, index) => {
              const quizTitle = quiz?.Title || quiz?.title || quiz?.name || '';
              const assessmentData = quiz?.assessment || assessment || {};

              const durationMinutes = quiz?.Duration || quiz?.duration;
              const timeLimitFromAssessment = assessmentData?.TimeLimit || assessmentData?.timeLimit;
              const duration = durationMinutes
                ? `${durationMinutes} phút`
                : timeLimitFromAssessment
                ? timeLimitFromAssessment
                : null;

              const totalScore =
                quiz?.TotalPossibleScore ??
                quiz?.totalPossibleScore ??
                assessmentData?.TotalPoints ??
                assessmentData?.totalPoints ??
                null;

              const passingScore =
                quiz?.PassingScore ??
                quiz?.passingScore ??
                assessmentData?.PassingScore ??
                assessmentData?.passingScore ??
                null;

              const totalQuestions = quiz?.TotalQuestions ?? quiz?.totalQuestions ?? null;
              const allowUnlimitedAttempts = quiz?.AllowUnlimitedAttempts ?? quiz?.allowUnlimitedAttempts ?? false;
              const maxAttempts = quiz?.MaxAttempts ?? quiz?.maxAttempts ?? null;

              const openAt = formatDateTimeVi(assessmentData?.OpenAt || assessmentData?.openAt);
              const dueAt = formatDateTimeVi(assessmentData?.DueAt || assessmentData?.dueAt);
              const description = quiz?.Description || quiz?.description || '';
              
              return (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="document-text" size={scale(28)} color="#3B82F6" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{quizTitle}</Text>
                    </View>
                  </View>

                  {description ? (
                    <Text style={styles.cardDescription}>{description}</Text>
                  ) : null}

                  <View style={styles.cardDetails}>
                    {duration && (
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Thời gian làm bài: {duration}</Text>
                      </View>
                    )}
                    {totalScore !== null && (
                      <View style={styles.detailItem}>
                        <Ionicons name="star-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Tổng điểm: {totalScore}</Text>
                      </View>
                    )}
                    {passingScore !== null && (
                      <View style={styles.detailItem}>
                        <Ionicons name="checkmark-done-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Điểm đạt: {passingScore}</Text>
                      </View>
                    )}
                    {totalQuestions !== null && (
                      <View style={styles.detailItem}>
                        <Ionicons name="list-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Tổng số câu hỏi: {totalQuestions}</Text>
                      </View>
                    )}
                    {(allowUnlimitedAttempts || maxAttempts !== null) && (
                      <View style={styles.detailItem}>
                        <Ionicons name="repeat-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>
                          Số lần làm bài: {allowUnlimitedAttempts ? 'Không giới hạn' : `${maxAttempts} lần`}
                        </Text>
                      </View>
                    )}
                    {openAt && (
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Mở từ: {openAt}</Text>
                      </View>
                    )}
                    {dueAt && (
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-clear-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Hạn nộp: {dueAt}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartQuiz(quiz)}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startButtonGradient}
                    >
                      <Text style={styles.startButtonText}>Bắt đầu làm bài</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Essay Section */}
        {essays.length > 0 && (
          <View style={styles.section}>
            {essays.map((essay, index) => {
              const essayTitle = essay?.Title || essay?.title || '';
              const description = essay?.Description || essay?.description || '';
              const assessmentData = essay?.assessment || assessment || {};

              const timeLimit = assessmentData?.TimeLimit || assessmentData?.timeLimit || null;
              const totalScore = assessmentData?.TotalPoints ?? assessmentData?.totalPoints ?? null;
              const passingScore = assessmentData?.PassingScore ?? assessmentData?.passingScore ?? null;

              const openAt = formatDateTimeVi(assessmentData?.OpenAt || assessmentData?.openAt);
              const dueAt = formatDateTimeVi(assessmentData?.DueAt || assessmentData?.dueAt);
              
              return (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FCE7F3' }]}>
                      <Ionicons name="create" size={scale(28)} color="#EC4899" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{essayTitle}</Text>
                    </View>
                  </View>

                  {description ? (
                    <Text style={styles.cardDescription}>{description}</Text>
                  ) : null}

                  <View style={styles.cardDetails}>
                    {timeLimit && (
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Thời gian làm bài: {timeLimit}</Text>
                      </View>
                    )}
                    {totalScore !== null && (
                      <View style={styles.detailItem}>
                        <Ionicons name="star-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Tổng điểm: {totalScore}</Text>
                      </View>
                    )}
                    {passingScore !== null && (
                      <View style={styles.detailItem}>
                        <Ionicons name="checkmark-done-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Điểm đạt: {passingScore}</Text>
                      </View>
                    )}
                    {openAt && (
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Mở từ: {openAt}</Text>
                      </View>
                    )}
                    {dueAt && (
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-clear-outline" size={scale(18)} color={colors.textSecondary} />
                        <Text style={styles.detailText}>Hạn nộp: {dueAt}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartEssay(essay)}
                  >
                    <LinearGradient
                      colors={['#EC4899', '#DB2777']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startButtonGradient}
                    >
                      <Text style={styles.startButtonText}>Bắt đầu Viết Essay</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty state if no quizzes or essays */}
        {quizzes.length === 0 && essays.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={scale(64)} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Chưa có bài tập</Text>
          </View>
        )}
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
  pageTitle: {
    fontSize: scale(28),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(12),
  },
  description: {
    fontSize: scale(16),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Regular',
    lineHeight: scale(24),
    marginBottom: verticalScale(24),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: scale(20),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(12),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  iconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: scale(18),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(4),
  },
  cardSubtitle: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Medium',
    color: '#F59E0B',
  },
  cardDescription: {
    fontSize: scale(15),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Regular',
    lineHeight: scale(22),
    marginBottom: verticalScale(16),
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(16),
    gap: scale(16),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  detailText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Medium',
  },
  startButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: scale(16),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: scale(16),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Medium',
    marginTop: verticalScale(12),
  },
});

export default AssignmentDetailScreen;
