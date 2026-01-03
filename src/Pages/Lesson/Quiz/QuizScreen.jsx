import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import quizService from '../../../Services/quizService';
import lessonService from '../../../Services/lessonService';
import Toast from '../../../Components/Common/Toast';

// Helper: flatten QuizSections -> flat list of questions
// Hỗ trợ cả cấu trúc cũ (Questions + QuizGroups) và cấu trúc mới (Items)
const extractQuestionsFromSections = (sections) => {
  if (!sections || !Array.isArray(sections)) return [];

  const result = [];

  sections.forEach((section) => {
    // Cấu trúc mới: AttemptQuizSectionDto với Items (QuizItemDto)
    const items = section?.Items || section?.items;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item) => {
        const itemType = (item?.ItemType || item?.itemType || '').toLowerCase();

        // Item là 1 câu hỏi độc lập
        if (itemType === 'question' || item?.QuestionId || item?.questionId) {
          result.push(item);
          return;
        }

        // Item là 1 group chứa nhiều câu hỏi
        if (itemType === 'group' || item?.Questions || item?.questions) {
          const gQuestions = item?.Questions || item?.questions || [];
          gQuestions.forEach((q) => result.push(q));
        }
      });

      // Đã xử lý cấu trúc mới thì bỏ qua logic cũ
      return;
    }

    // Fallback: cấu trúc cũ (section.Questions + section.QuizGroups)
    const standalone = section?.Questions || section?.questions || [];
    standalone.forEach((q) => result.push(q));

    const groups = section?.QuizGroups || section?.quizGroups || [];
    groups.forEach((group) => {
      const gQuestions = group?.Questions || group?.questions || [];
      gQuestions.forEach((q) => result.push(q));
    });
  });

  return result;
};

const QuizScreen = ({ route, navigation }) => {
  const { quizId: routeQuizId, assessmentId, quizTitle, assessmentTitle, moduleId, moduleName, assessment } = route.params || {};
  const insets = useSafeAreaInsets();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maxAttemptsError, setMaxAttemptsError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (routeQuizId || assessmentId) {
      startQuiz();
    }
  }, [routeQuizId, assessmentId]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      
      // Use quizId if provided directly, otherwise get from assessment
      let quizId = routeQuizId;
      
      if (!quizId && assessmentId) {
        // Fallback: get assessment details to find quizId
        const assessmentResponse = await lessonService.getAssessmentById(assessmentId);
        const assessmentData = assessmentResponse?.data || assessmentResponse;
        
        // Get quizId from assessment - try multiple field name variations
        quizId = assessmentData?.quizzes?.[0]?.quizId || assessmentData?.Quizzes?.[0]?.QuizId || assessmentData?.quizId || assessmentData?.QuizId;
      }
      
      if (!quizId) {
        throw new Error('Assessment này chưa có quiz. Vui lòng liên hệ giáo viên.');
      }
      
      // Start quiz attempt with quizId
      const response = await quizService.startQuizAttempt(quizId);

      // axiosClient đã unwrap 1 lớp nên response chính là ServiceResponse
      // với Data = QuizAttemptWithQuestionsDto
      const dto = response?.data || response; // QuizAttemptWithQuestionsDto

      const attemptIdValue = dto?.attemptId || dto?.AttemptId;
      const sections = dto?.quizSections || dto?.QuizSections || [];
      const questionsData = extractQuestionsFromSections(sections);

      if (!questionsData || questionsData.length === 0) {
        setToast({
          visible: true,
          message: 'Quiz không có câu hỏi. Vui lòng liên hệ giáo viên.',
          type: 'error',
        });
        setTimeout(() => navigation.goBack(), 3000);
        return;
      }

      setAttemptId(attemptIdValue);
      setQuestions(questionsData);
    } catch (error) {
      // Extract error message from various possible locations
      let errorMessage = 'Không thể bắt đầu quiz';
      const errData = error?.response?.data || error;

      if (errData) {
        errorMessage =
          errData?.message ||
          errData?.Message ||
          errData?.error ||
          errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });

      const isMaxAttemptsError =
        errorMessage.includes('hết lượt') ||
        errorMessage.toLowerCase().includes('max');
      setTimeout(() => navigation.goBack(), isMaxAttemptsError ? 4000 : 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = async (questionId, answerId) => {
    // Cập nhật local state ngay lập tức
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerId,
    });

    // Lưu vào backend
    try {
      await quizService.saveAnswer(attemptId, questionId, answerId);
    } catch (error) {
      console.error('Error saving answer:', error);
      // Không hiển thị toast lỗi để không làm phiền user
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalQuestions = questions.length;

    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Chưa hoàn thành',
        `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu. Bạn có chắc muốn nộp bài?`,
        [
          { text: 'Tiếp tục làm', style: 'cancel' },
          { text: 'Nộp bài', onPress: submitQuiz },
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      
      // Backend tự động chấm điểm dựa trên answers đã chọn trong attempt
      const response = await quizService.submitQuizAttempt(attemptId);
      const result = response?.data || response;

      // QuizAttemptResultDto từ backend
      const totalScore =
        result?.totalScore ?? result?.TotalScore ?? 0;
      const isPassed =
        result?.isPassed ?? result?.IsPassed ?? false;
      const percentage =
        result?.percentage ?? result?.Percentage ?? 0;
      const timeSpentSeconds =
        result?.timeSpentSeconds ?? result?.TimeSpentSeconds ?? 0;
      const scoresByQuestion =
        result?.scoresByQuestion || result?.ScoresByQuestion || {};

      const totalQuestions =
        questions.length ||
        (scoresByQuestion ? Object.keys(scoresByQuestion).length : 0);

      const correctCount = scoresByQuestion
        ? Object.values(scoresByQuestion).filter((s) =>
            typeof s === 'number' ? s > 0 : Number(s) > 0
          ).length
        : 0;

      // Điều hướng tới màn hình kết quả bài học
      navigation.replace('LessonResultScreen', {
        type: 'quiz',
        moduleName,
        quizTitle,
        totalScore,
        totalQuestions,
        correctCount,
        percentage,
        isPassed,
        timeSpentSeconds,
      });
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Lỗi khi nộp bài',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const question = questions[currentQuestionIndex];
    const questionId = question?.QuestionId || question?.questionId;
    const questionText = question?.QuestionText || question?.questionText;
    const answers =
      question?.Answers ||
      question?.answers ||
      question?.Options ||
      question?.options ||
      [];
    const selectedAnswer = selectedAnswers[questionId];

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>
              Câu {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{questionText}</Text>

        <View style={styles.answersContainer}>
          {answers.map((answer, index) => {
            const answerId =
              answer?.AnswerId ||
              answer?.answerId ||
              answer?.OptionId ||
              answer?.optionId;
            const answerText =
              answer?.AnswerText ||
              answer?.answerText ||
              answer?.OptionText ||
              answer?.optionText;
            const isSelected = selectedAnswer === answerId;

            return (
              <TouchableOpacity
                key={answerId}
                style={[
                  styles.answerOption,
                  isSelected && styles.answerOptionSelected,
                ]}
                onPress={() => handleSelectAnswer(questionId, answerId)}
              >
                <View
                  style={[
                    styles.answerRadio,
                    isSelected && styles.answerRadioSelected,
                  ]}
                >
                  {isSelected && (
                    <View style={styles.answerRadioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.answerText,
                    isSelected && styles.answerTextSelected,
                  ]}
                >
                  {answerText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải quiz...</Text>
      </View>
    );
  }

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
        colors={['#EF4444', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{moduleName || 'Quiz'}</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.headerButton}>
          <Text style={styles.submitHeaderText}>Nộp bài</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {questions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentQuestionIndex && styles.progressDotActive,
                Object.keys(selectedAnswers).includes(
                  String(questions[index]?.QuestionId || questions[index]?.questionId)
                ) && styles.progressDotAnswered,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={scale(24)} color={colors.primary} />
          <Text style={styles.navButtonText}>Trước</Text>
        </TouchableOpacity>

        {currentQuestionIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Nộp bài</Text>
                  <Ionicons name="checkmark-circle" size={scale(24)} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Tiếp theo</Text>
              <Ionicons name="chevron-forward" size={scale(24)} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  headerButton: {
    padding: scale(8),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitHeaderText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(16),
  },
  progressBar: {
    flexDirection: 'row',
    gap: scale(8),
  },
  progressDot: {
    flex: 1,
    height: verticalScale(4),
    backgroundColor: '#E5E7EB',
    borderRadius: scale(2),
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotAnswered: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(24),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  questionHeader: {
    marginBottom: verticalScale(16),
  },
  questionNumber: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    alignSelf: 'flex-start',
  },
  questionNumberText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.primary,
  },
  questionText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: colors.text,
    lineHeight: scale(28),
    marginBottom: verticalScale(24),
  },
  answersContainer: {
    gap: verticalScale(12),
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  answerRadio: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerRadioSelected: {
    borderColor: colors.primary,
  },
  answerRadioInner: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: colors.primary,
  },
  answerText: {
    flex: 1,
    fontSize: scale(16),
    color: colors.text,
    lineHeight: scale(24),
  },
  answerTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: scale(20),
    gap: scale(12),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: colors.primary,
    gap: scale(4),
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.primary,
  },
  nextButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  nextButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  submitButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default QuizScreen;
