import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import quizService from '../../../Services/quizService';
import lessonService from '../../../Services/lessonService';
import Toast from '../../../Components/Common/Toast';
import { getResponseData } from '../../../Utils/apiHelper';

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

// Helper: Load saved answers from attempt
const loadSavedAnswers = (sections) => {
  const savedAnswers = {};

  if (!sections || !Array.isArray(sections)) return savedAnswers;

  sections.forEach((section) => {
    const items = section?.Items || section?.items;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item) => {
        const type = item?.ItemType || item?.itemType;
        if (type === 'Question') {
          const questionId = item?.QuestionId || item?.questionId;
          const userAnswer = item?.UserAnswer !== undefined ? item.UserAnswer : (item?.userAnswer !== undefined ? item.userAnswer : null);
          if (questionId && userAnswer !== null && userAnswer !== undefined) {
            savedAnswers[questionId] = userAnswer;
          }
        } else if (type === 'Group') {
          const groupQuestions = item?.Questions || item?.questions || [];
          groupQuestions.forEach((q) => {
            const questionId = q?.QuestionId || q?.questionId;
            const userAnswer = q?.UserAnswer !== undefined ? q.UserAnswer : (q?.userAnswer !== undefined ? q.userAnswer : null);
            if (questionId && userAnswer !== null && userAnswer !== undefined) {
              savedAnswers[questionId] = userAnswer;
            }
          });
        }
      });
    } else {
      // Legacy structure
      const questions = section?.Questions || section?.questions || [];
      const groups = section?.QuizGroups || section?.quizGroups || [];

      questions.forEach((q) => {
        const questionId = q?.QuestionId || q?.questionId;
        const userAnswer = q?.UserAnswer !== undefined ? q.UserAnswer : (q?.userAnswer !== undefined ? q.userAnswer : null);
        if (questionId && userAnswer !== null && userAnswer !== undefined) {
          savedAnswers[questionId] = userAnswer;
        }
      });

      groups.forEach((group) => {
        const groupQuestions = group?.Questions || group?.questions || [];
        groupQuestions.forEach((q) => {
          const questionId = q?.QuestionId || q?.questionId;
          const userAnswer = q?.UserAnswer !== undefined ? q.UserAnswer : (q?.userAnswer !== undefined ? q.userAnswer : null);
          if (questionId && userAnswer !== null && userAnswer !== undefined) {
            savedAnswers[questionId] = userAnswer;
          }
        });
      });
    }
  });

  return savedAnswers;
};

const QuizScreen = ({ route, navigation }) => {
  const { quizId: routeQuizId, assessmentId, attemptId: routeAttemptId, quizTitle, assessmentTitle, moduleId, moduleName, assessment, forceNewAttempt } = route.params || {};
  const insets = useSafeAreaInsets();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(routeAttemptId || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  // State for Matching questions - store matches and selections per questionId
  const [matchingMatches, setMatchingMatches] = useState({});
  const [matchingSelectedLeft, setMatchingSelectedLeft] = useState({}); // { questionId: leftId }
  const [matchingSelectedRight, setMatchingSelectedRight] = useState({}); // { questionId: rightId }
  // State for Ordering questions - store ordered options per questionId
  const [orderingOptions, setOrderingOptions] = useState({});
  
  // Timer states
  const [timeLimit, setTimeLimit] = useState(null); // Duration in minutes
  const [remainingTime, setRemainingTime] = useState(null); // Remaining seconds
  const [startedAt, setStartedAt] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const timerIntervalRef = useRef(null);
  const hasCalledTimeUpRef = useRef(false);

  useEffect(() => {
    if (routeQuizId || assessmentId || routeAttemptId) {
      initializeQuiz();
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [routeQuizId, assessmentId, routeAttemptId]);

  // Timer effect
  useEffect(() => {
    if (timeLimit && startedAt && endTime && !hasCalledTimeUpRef.current) {
      // Calculate remaining time
      const updateRemainingTime = () => {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        
        setRemainingTime(remaining);

        if (remaining <= 0 && !hasCalledTimeUpRef.current) {
          hasCalledTimeUpRef.current = true;
          handleTimeUp();
        }
      };

      updateRemainingTime();
      timerIntervalRef.current = setInterval(updateRemainingTime, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [timeLimit, startedAt, endTime]);

  const initializeQuiz = async () => {
    try {
      setLoading(true);
      
      let quizId = routeQuizId;
      let quizIdForDuration = routeQuizId; // Store quizId for fetching duration
      
      // If we have attemptId, try to resume
      if (routeAttemptId) {
        await resumeQuiz(routeAttemptId);
        return;
      }

      // Get quizId from assessment if needed
      let assessmentData = null;
      if (!quizId && assessmentId) {
        const assessmentResponse = await lessonService.getAssessmentById(assessmentId);
        assessmentData = getResponseData(assessmentResponse);
        quizId = assessmentData?.quizzes?.[0]?.quizId || assessmentData?.Quizzes?.[0]?.QuizId || assessmentData?.quizId || assessmentData?.QuizId;
        quizIdForDuration = quizId;
      }
      
      // Also try to get assessment from route params
      if (!assessmentData && assessment) {
        assessmentData = assessment;
      }
      
      if (!quizId) {
        throw new Error('Assessment này chưa có quiz. Vui lòng liên hệ giáo viên.');
      }
      
      quizIdForDuration = quizId; // Ensure we have quizId for duration fetch

      // Check for active attempt first (skip if forceNewAttempt is true)
      if (!forceNewAttempt) {
        try {
          const activeAttemptResponse = await quizService.checkActiveAttempt(quizId);
          const activeAttemptData = getResponseData(activeAttemptResponse);
          
          if (activeAttemptData?.hasActiveAttempt || activeAttemptData?.HasActiveAttempt) {
            const activeAttemptId = activeAttemptData?.attemptId || activeAttemptData?.AttemptId;
            if (activeAttemptId) {
              // Resume active attempt
              await resumeQuiz(activeAttemptId);
              return;
            }
          }
        } catch (error) {
          // If check fails, continue with start
        }
      }

      // Start new quiz attempt
      await startQuiz(quizId, quizIdForDuration);
    } catch (error) {
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
      
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });

      const isMaxAttemptsError =
        errorMessage.includes('hết lượt') ||
        errorMessage.toLowerCase().includes('max');
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, isMaxAttemptsError ? 4000 : 2500);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizId, quizIdForDuration = null) => {
    const response = await quizService.startQuizAttempt(quizId);
    const dto = getResponseData(response); // QuizAttemptWithQuestionsDto

    const attemptIdValue = dto?.attemptId || dto?.AttemptId;
    const sections = dto?.quizSections || dto?.QuizSections || [];
    const questionsData = extractQuestionsFromSections(sections);

    if (!questionsData || questionsData.length === 0) {
      setToast({
        visible: true,
        message: 'Quiz không có câu hỏi. Vui lòng liên hệ giáo viên.',
        type: 'error',
      });
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 3000);
      return;
    }

    // Get quiz info for duration
    // Backend không trả về quiz object trong DTO, nên cần fetch quiz riêng hoặc lấy từ assessment
    const quizInfo = dto?.quiz || dto?.Quiz || {};
    let duration = 
      quizInfo?.Duration || 
      quizInfo?.duration || 
      dto?.Duration || 
      dto?.duration ||
      quizInfo?.TimeLimit ||
      quizInfo?.timeLimit;
    
    // Nếu không có duration trong DTO, thử fetch quiz riêng
    if (!duration && (quizIdForDuration || quizId)) {
      try {
        const quizIdToFetch = quizIdForDuration || quizId;
        const quizResponse = await quizService.getQuizById(quizIdToFetch);
        const quizData = getResponseData(quizResponse);
        duration = quizData?.Duration || quizData?.duration || quizData?.TimeLimit || quizData?.timeLimit;
      } catch (error) {
      }
    }
    
    
    // Setup timer
    if (duration && duration > 0) {
      const startedAtValue = new Date(dto?.startedAt || dto?.StartedAt);
      const endTimeValue = new Date(startedAtValue.getTime() + duration * 60 * 1000);
      
      setTimeLimit(duration);
      setStartedAt(startedAtValue);
      setEndTime(endTimeValue);
    }

    setAttemptId(attemptIdValue);
    setQuestions(questionsData);
    setQuiz(quizInfo || dto);
  };

  const resumeQuiz = async (attemptIdToResume) => {
    const response = await quizService.resumeQuizAttempt(attemptIdToResume);
    const dto = getResponseData(response); // QuizAttemptWithQuestionsDto

    const attemptIdValue = dto?.attemptId || dto?.AttemptId;
    const quizIdValue = dto?.quizId || dto?.QuizId;
    const sections = dto?.quizSections || dto?.QuizSections || [];
    const questionsData = extractQuestionsFromSections(sections);

    if (!questionsData || questionsData.length === 0) {
      setToast({
        visible: true,
        message: 'Quiz không có câu hỏi. Vui lòng liên hệ giáo viên.',
        type: 'error',
      });
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 3000);
      return;
    }

    // Load saved answers
    const savedAnswers = loadSavedAnswers(sections);
    setSelectedAnswers(savedAnswers);

    // Get quiz info for duration
    // Backend không trả về quiz object trong DTO, nên cần fetch quiz riêng
    const quizInfo = dto?.quiz || dto?.Quiz || {};
    let duration = 
      quizInfo?.Duration || 
      quizInfo?.duration || 
      dto?.Duration || 
      dto?.duration ||
      quizInfo?.TimeLimit ||
      quizInfo?.timeLimit;
    
    // Nếu không có duration trong DTO, thử fetch quiz riêng
    if (!duration && quizIdValue) {
      try {
        const quizResponse = await quizService.getQuizById(quizIdValue);
        const quizData = getResponseData(quizResponse);
        duration = quizData?.Duration || quizData?.duration || quizData?.TimeLimit || quizData?.timeLimit;
      } catch (error) {
      }
    }
    
    // Setup timer
    if (duration && duration > 0) {
      const startedAtValue = new Date(dto?.startedAt || dto?.StartedAt);
      const endTimeValue = dto?.endTime || dto?.EndTime 
        ? new Date(dto.endTime || dto.EndTime)
        : new Date(startedAtValue.getTime() + duration * 60 * 1000);
      
      setTimeLimit(duration);
      setStartedAt(startedAtValue);
      setEndTime(endTimeValue);
    }

    setAttemptId(attemptIdValue);
    setQuestions(questionsData);
    setQuiz(quizInfo || dto);
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Hết thời gian',
      'Thời gian làm bài đã hết. Bài làm của bạn sẽ được tự động nộp.',
      [
        {
          text: 'Nộp bài',
          onPress: () => {
            submitQuiz(true); // Auto submit
          },
        },
      ],
      { cancelable: false }
    );
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = async (questionId, answerId, questionType = 1) => {
    // MultipleAnswers (Type = 2): toggle option in array
    if (questionType === 2) {
      const currentAnswers = Array.isArray(selectedAnswers[questionId]) 
        ? selectedAnswers[questionId] 
        : (selectedAnswers[questionId] ? [selectedAnswers[questionId]] : []);
      const newAnswers = currentAnswers.includes(answerId)
        ? currentAnswers.filter(id => id !== answerId)
        : [...currentAnswers, answerId];
      
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: newAnswers,
      });

      // Lưu vào backend
      try {
        await quizService.saveAnswer(attemptId, questionId, newAnswers);
      } catch (error) {
      }
      return;
    }

    // Single choice (MultipleChoice, TrueFalse): set optionId
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerId,
    });

    // Lưu vào backend
    try {
      await quizService.saveAnswer(attemptId, questionId, answerId);
    } catch (error) {
      // Không hiển thị toast lỗi để không làm phiền user
    }
  };

  const handleMatchingAnswer = async (questionId, matches) => {
    // Matching (Type = 5): matches is an object { leftId: rightId }
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: matches,
    });

    try {
      await quizService.saveAnswer(attemptId, questionId, matches);
    } catch (error) {
    }
  };

  const handleOrderingAnswer = async (questionId, orderedIds) => {
    // Ordering (Type = 6): orderedIds is an array of optionIds in order
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: orderedIds,
    });

    try {
      await quizService.saveAnswer(attemptId, questionId, orderedIds);
    } catch (error) {
    }
  };

  const handleTextAnswer = async (questionId, textAnswer) => {
    // Cập nhật local state ngay lập tức
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: textAnswer,
    });

    // Lưu vào backend (textAnswer có thể là string hoặc array)
    try {
      await quizService.saveAnswer(attemptId, questionId, textAnswer);
    } catch (error) {
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
          { text: 'Nộp bài', onPress: () => submitQuiz(false) },
        ]
      );
    } else {
      submitQuiz(false);
    }
  };

  const submitQuiz = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true);
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Backend tự động chấm điểm dựa trên answers đã chọn trong attempt
      const response = await quizService.submitQuizAttempt(attemptId);
      const result = getResponseData(response);

      // QuizAttemptResultDto từ backend
      const totalScore = result?.totalScore ?? result?.TotalScore ?? 0;
      const isPassed = result?.isPassed ?? result?.IsPassed ?? false;
      const percentage = result?.percentage ?? result?.Percentage ?? 0;
      const timeSpentSeconds = result?.timeSpentSeconds ?? result?.TimeSpentSeconds ?? 0;
      const scoresByQuestion = result?.scoresByQuestion || result?.ScoresByQuestion || {};

      const totalQuestions = questions.length || (scoresByQuestion ? Object.keys(scoresByQuestion).length : 0);

      const correctCount = scoresByQuestion
        ? Object.values(scoresByQuestion).filter((s) =>
            typeof s === 'number' ? s > 0 : Number(s) > 0
          ).length
        : 0;

      // Điều hướng tới màn hình kết quả bài học
      navigation.replace('LessonResultScreen', {
        type: 'quiz',
        moduleName,
        quizTitle: quizTitle || quiz?.title || quiz?.Title || 'Quiz',
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
      setSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const question = questions[currentQuestionIndex];
    const questionId = question?.QuestionId || question?.questionId;
    const questionText = question?.QuestionText || question?.questionText;
    const questionType = question?.Type ?? question?.type ?? 1; // Default to MultipleChoice (1)
    const questionPoints = question?.Points ?? question?.points ?? null;
    const answers = question?.Answers || question?.answers || question?.Options || question?.options || [];
    const selectedAnswer = selectedAnswers[questionId];

    // TrueFalse question (Type = 3)
    if (questionType === 3) {
      const trueOption = answers.find(opt => {
        const text = (opt?.AnswerText || opt?.answerText || opt?.OptionText || opt?.optionText || '').toLowerCase();
        return text.includes('true') || text.includes('đúng');
      }) || answers[0];
      
      const falseOption = answers.find(opt => {
        const text = (opt?.AnswerText || opt?.answerText || opt?.OptionText || opt?.optionText || '').toLowerCase();
        return text.includes('false') || text.includes('sai');
      }) || answers[1];

      const trueOptionId = trueOption ? (trueOption?.AnswerId || trueOption?.answerId || trueOption?.OptionId || trueOption?.optionId) : null;
      const falseOptionId = falseOption ? (falseOption?.AnswerId || falseOption?.answerId || falseOption?.OptionId || falseOption?.optionId) : null;
      const trueText = trueOption ? (trueOption?.AnswerText || trueOption?.answerText || trueOption?.OptionText || trueOption?.optionText || 'Đúng') : 'Đúng';
      const falseText = falseOption ? (falseOption?.AnswerText || falseOption?.answerText || falseOption?.OptionText || falseOption?.optionText || 'Sai') : 'Sai';

      return (
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>
                Câu {currentQuestionIndex + 1}/{questions.length}
              </Text>
            </View>
            {questionPoints !== null && (
              <View style={styles.questionPoints}>
                <Text style={styles.questionPointsText}>{questionPoints} điểm</Text>
              </View>
            )}
          </View>

          <Text style={styles.questionText}>{questionText}</Text>

          <View style={styles.trueFalseContainer}>
            {trueOptionId && (
              <TouchableOpacity
                style={[
                  styles.trueFalseOption,
                  selectedAnswer === trueOptionId && styles.trueFalseOptionSelected,
                ]}
                onPress={() => handleSelectAnswer(questionId, trueOptionId, questionType)}
              >
                <Text style={[
                  styles.trueFalseText,
                  selectedAnswer === trueOptionId && styles.trueFalseTextSelected,
                ]}>
                  {trueText}
                </Text>
              </TouchableOpacity>
            )}
            {falseOptionId && (
              <TouchableOpacity
                style={[
                  styles.trueFalseOption,
                  selectedAnswer === falseOptionId && styles.trueFalseOptionSelected,
                ]}
                onPress={() => handleSelectAnswer(questionId, falseOptionId, questionType)}
              >
                <Text style={[
                  styles.trueFalseText,
                  selectedAnswer === falseOptionId && styles.trueFalseTextSelected,
                ]}>
                  {falseText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // FillBlank question (Type = 4)
    if (questionType === 4) {
      // Parse question text to find blanks [answer]
      const parts = questionText.split(/(\[.*?\])/g);
      const blanksCount = parts.filter(p => p.startsWith('[') && p.endsWith(']')).length;
      
      // Initialize text answers array
      const textAnswers = selectedAnswer 
        ? (Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer])
        : new Array(Math.max(blanksCount, 1)).fill('');

      return (
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>
                Câu {currentQuestionIndex + 1}/{questions.length}
              </Text>
            </View>
            {questionPoints !== null && (
              <View style={styles.questionPoints}>
                <Text style={styles.questionPointsText}>{questionPoints} điểm</Text>
              </View>
            )}
          </View>

          {blanksCount > 0 ? (
            // Render question with inline blanks
            <View style={styles.fillBlankContainer}>
              <View style={styles.fillBlankSentence}>
                {parts.map((part, i) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    const blankIndex = parts.slice(0, i).filter(p => p.startsWith('[') && p.endsWith(']')).length;
                    return (
                      <View key={i} style={styles.fillBlankInputWrapper}>
                        <TextInput
                          style={styles.fillBlankInput}
                          value={textAnswers[blankIndex] || ''}
                          onChangeText={(text) => {
                            const newAnswers = [...textAnswers];
                            newAnswers[blankIndex] = text;
                            const answerValue = blanksCount === 1 ? text.trim() : newAnswers.map(a => a.trim()).join(', ');
                            handleTextAnswer(questionId, answerValue);
                          }}
                          placeholder="........"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    );
                  }
                  return <Text key={i} style={styles.fillBlankText}>{part}</Text>;
                })}
              </View>
              <View style={styles.fillBlankTip}>
                <Ionicons name="information-circle-outline" size={scale(16)} color={colors.primary} />
                <Text style={styles.fillBlankTipText}>
                  Nhấp vào vùng màu xanh để điền từ còn thiếu vào chỗ trống.
                </Text>
              </View>
            </View>
          ) : (
            // Fallback: Single text input if no brackets found
            <View style={styles.fillBlankContainer}>
              <Text style={styles.questionText}>{questionText}</Text>
              <View style={styles.fillBlankAnswerSection}>
                <Text style={styles.fillBlankLabel}>Câu trả lời của bạn:</Text>
                <TextInput
                  style={styles.fillBlankTextInput}
                  value={textAnswers[0] || ''}
                  onChangeText={(text) => handleTextAnswer(questionId, text.trim())}
                  placeholder="Nhập đáp án tại đây..."
                  placeholderTextColor="#9CA3AF"
                  multiline={false}
                />
              </View>
              <View style={styles.fillBlankTip}>
                <Ionicons name="information-circle-outline" size={scale(16)} color={colors.primary} />
                <Text style={styles.fillBlankTipText}>
                  Nhấp vào vùng màu xanh để điền từ còn thiếu vào chỗ trống.
                </Text>
              </View>
            </View>
          )}
        </View>
      );
    }

    // Matching (Type = 5) - Simplified version for mobile
    if (questionType === 5) {
      // Parse metadata for left/right columns
      let leftTexts = [];
      let rightTexts = [];
      try {
        const rawMeta = question?.metadataJson || question?.MetadataJson;
        const metadata = typeof rawMeta === 'string' ? JSON.parse(rawMeta || '{}') : (rawMeta || {});
        leftTexts = metadata.left || [];
        rightTexts = metadata.right || [];
      } catch (e) {
      }

      // Determine left and right options
      let leftOptions = [];
      let rightOptions = [];

      if (leftTexts.length > 0) {
        leftOptions = leftTexts.map(text => {
          return answers.find(o => (o?.AnswerText || o?.answerText || o?.OptionText || o?.optionText || '').trim() === text.trim());
        }).filter(Boolean);
        rightOptions = rightTexts.map(text => {
          return answers.find(o => (o?.AnswerText || o?.answerText || o?.OptionText || o?.optionText || '').trim() === text.trim());
        }).filter(Boolean);
      }

      if (leftOptions.length === 0) {
        leftOptions = answers.filter(o => o?.IsCorrect === true || o?.isCorrect === true);
        rightOptions = answers.filter(o => o?.IsCorrect === false || o?.isCorrect === false);
      }

      if (leftOptions.length === 0) {
        const half = Math.ceil(answers.length / 2);
        leftOptions = answers.slice(0, half);
        rightOptions = answers.slice(half);
      }

      const finalLeft = leftOptions.map(opt => ({
        id: opt?.AnswerId || opt?.answerId || opt?.OptionId || opt?.optionId,
        text: opt?.AnswerText || opt?.answerText || opt?.OptionText || opt?.optionText,
      }));

      const finalRight = rightOptions.map(opt => ({
        id: opt?.AnswerId || opt?.answerId || opt?.OptionId || opt?.optionId,
        text: opt?.AnswerText || opt?.answerText || opt?.OptionText || opt?.optionText,
      }));

      // Initialize matches from selectedAnswer or use existing state
      const currentMatches = matchingMatches[questionId] || (selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : {});
      const selectedLeft = matchingSelectedLeft[questionId] || null;
      const selectedRight = matchingSelectedRight[questionId] || null;

      const updateMatches = (newMatches) => {
        setMatchingMatches({ ...matchingMatches, [questionId]: newMatches });
        handleMatchingAnswer(questionId, newMatches);
      };

      const handleLeftClick = (leftId) => {
        const lid = Number(leftId);
        if (selectedLeft === lid) {
          setMatchingSelectedLeft({ ...matchingSelectedLeft, [questionId]: null });
        } else {
          setMatchingSelectedLeft({ ...matchingSelectedLeft, [questionId]: lid });
          if (selectedRight !== null) {
            const newMatches = { ...currentMatches, [lid]: Number(selectedRight) };
            updateMatches(newMatches);
            setMatchingSelectedLeft({ ...matchingSelectedLeft, [questionId]: null });
            setMatchingSelectedRight({ ...matchingSelectedRight, [questionId]: null });
          }
        }
      };

      const handleRightClick = (rightId) => {
        const rid = Number(rightId);
        if (selectedRight === rid) {
          setMatchingSelectedRight({ ...matchingSelectedRight, [questionId]: null });
        } else {
          setMatchingSelectedRight({ ...matchingSelectedRight, [questionId]: rid });
          if (selectedLeft !== null) {
            const newMatches = { ...currentMatches, [selectedLeft]: rid };
            updateMatches(newMatches);
            setMatchingSelectedLeft({ ...matchingSelectedLeft, [questionId]: null });
            setMatchingSelectedRight({ ...matchingSelectedRight, [questionId]: null });
          }
        }
      };

      const getMatchedRight = (leftId) => {
        return currentMatches[leftId] || null;
      };

      const isRightMatched = (rightId) => {
        return Object.values(currentMatches).map(Number).includes(Number(rightId));
      };

      const removeMatch = (leftId) => {
        const newMatches = { ...currentMatches };
        delete newMatches[leftId];
        updateMatches(newMatches);
      };

      return (
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>
                Câu {currentQuestionIndex + 1}/{questions.length}
              </Text>
            </View>
            {questionPoints !== null && (
              <View style={styles.questionPoints}>
                <Text style={styles.questionPointsText}>{questionPoints} điểm</Text>
              </View>
            )}
          </View>

          <View style={styles.matchingInstructions}>
            <Ionicons name="link-outline" size={scale(20)} color={colors.primary} />
            <Text style={styles.matchingInstructionsText}>
              Nối các cặp từ tương ứng. Nhấp vào một mục ở cột trái, sau đó nhấp vào mục tương ứng ở cột phải.
            </Text>
          </View>

          <Text style={styles.questionText}>{questionText}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.matchingContainer}>
              <View style={styles.matchingColumn}>
                <Text style={styles.matchingColumnTitle}>Cột trái</Text>
                {finalLeft.map((option, index) => {
                  const matchedRightId = getMatchedRight(option.id);
                  const isSelected = selectedLeft === option.id;
                  const matchedOption = finalRight.find(r => r.id === matchedRightId);

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.matchingItem,
                        styles.matchingItemLeft,
                        isSelected && styles.matchingItemSelected,
                        matchedRightId && styles.matchingItemMatched,
                      ]}
                      onPress={() => {
                        if (matchedRightId) removeMatch(option.id);
                        else handleLeftClick(option.id);
                      }}
                    >
                      <View style={styles.matchingItemContent}>
                        <View style={styles.matchingItemBadge}>
                          <Text style={styles.matchingItemBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.matchingItemText}>{option.text}</Text>
                        {matchedRightId && <Ionicons name="checkmark-circle" size={scale(20)} color="#10B981" />}
                      </View>
                      {matchedRightId && matchedOption && (
                        <Text style={styles.matchingItemPreview}>➜ {matchedOption.text}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.matchingColumn}>
                <Text style={styles.matchingColumnTitle}>Cột phải</Text>
                {finalRight.map((option, index) => {
                  const isMatched = isRightMatched(option.id);
                  const isSelected = selectedRight === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.matchingItem,
                        styles.matchingItemRight,
                        isSelected && styles.matchingItemSelected,
                        isMatched && styles.matchingItemDisabled,
                      ]}
                      onPress={() => {
                        if (!isMatched) handleRightClick(option.id);
                      }}
                      disabled={isMatched}
                    >
                      <View style={styles.matchingItemContent}>
                        <View style={[styles.matchingItemBadge, styles.matchingItemBadgeRight]}>
                          <Text style={styles.matchingItemBadgeText}>{String.fromCharCode(65 + index)}</Text>
                        </View>
                        <Text style={styles.matchingItemText}>{option.text}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.matchingSummary}>
            <Text style={styles.matchingSummaryText}>
              Đã nối: {Object.keys(currentMatches).length} / {finalLeft.length} cặp
            </Text>
          </View>
        </View>
      );
    }

    // Ordering (Type = 6) - Simplified version for mobile
    if (questionType === 6) {
      // Initialize orderedOptions from state or selectedAnswer
      const currentOrderedOptions = orderingOptions[questionId] || (() => {
        if (Array.isArray(selectedAnswer) && selectedAnswer.length > 0) {
          try {
            const ordered = selectedAnswer.map(id => {
              return answers.find(opt => {
                const optId = opt?.AnswerId || opt?.answerId || opt?.OptionId || opt?.optionId;
                return optId === id;
              });
            }).filter(item => item !== undefined && item !== null);
            const orderedIds = new Set(ordered.map(opt => opt?.AnswerId || opt?.answerId || opt?.OptionId || opt?.optionId));
            answers.forEach(opt => {
              const optId = opt?.AnswerId || opt?.answerId || opt?.OptionId || opt?.optionId;
              if (!orderedIds.has(optId)) {
                ordered.push(opt);
              }
            });
            return ordered.length > 0 ? ordered : [...answers];
          } catch (e) {
            return [...answers];
          }
        }
        return [...answers];
      })();

      const setOrderedOptions = (newOrder) => {
        setOrderingOptions({ ...orderingOptions, [questionId]: newOrder });
        const orderedIds = newOrder
          .filter(opt => opt !== undefined && opt !== null)
          .map(opt => {
            const id = opt?.AnswerId || opt?.answerId || opt?.OptionId || opt?.optionId;
            return Number(id);
          });
        if (orderedIds.length > 0) {
          handleOrderingAnswer(questionId, orderedIds);
        }
      };

      const moveUp = (index) => {
        if (index === 0) return;
        const newOrder = [...currentOrderedOptions];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setOrderedOptions(newOrder);
      };

      const moveDown = (index) => {
        if (index === currentOrderedOptions.length - 1) return;
        const newOrder = [...currentOrderedOptions];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setOrderedOptions(newOrder);
      };

      return (
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>
                Câu {currentQuestionIndex + 1}/{questions.length}
              </Text>
            </View>
            {questionPoints !== null && (
              <View style={styles.questionPoints}>
                <Text style={styles.questionPointsText}>{questionPoints} điểm</Text>
              </View>
            )}
          </View>

          <View style={styles.orderingInstructions}>
            <Ionicons name="information-circle-outline" size={scale(16)} color={colors.primary} />
            <Text style={styles.orderingInstructionsText}>
              Sắp xếp các mục theo thứ tự đúng bằng cách sử dụng nút mũi tên
            </Text>
          </View>

          <Text style={styles.questionText}>{questionText}</Text>

          <View style={styles.orderingList}>
            {currentOrderedOptions.map((option, index) => {
              if (!option) return null;
              const optionId = option?.AnswerId || option?.answerId || option?.OptionId || option?.optionId;
              const optionText = option?.AnswerText || option?.answerText || option?.OptionText || option?.optionText || '---';

              return (
                <View key={optionId || `idx-${index}`} style={styles.orderingItem}>
                  <View style={styles.orderingItemContent}>
                    <View style={styles.orderingItemNumber}>
                      <Text style={styles.orderingItemNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.orderingItemText}>{optionText}</Text>
                    <View style={styles.orderingItemActions}>
                      <TouchableOpacity
                        style={[styles.orderingActionButton, index === 0 && styles.orderingActionButtonDisabled]}
                        onPress={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <Ionicons name="chevron-up" size={scale(20)} color={index === 0 ? '#9CA3AF' : colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.orderingActionButton, index === currentOrderedOptions.length - 1 && styles.orderingActionButtonDisabled]}
                        onPress={() => moveDown(index)}
                        disabled={index === currentOrderedOptions.length - 1}
                      >
                        <Ionicons name="chevron-down" size={scale(20)} color={index === currentOrderedOptions.length - 1 ? '#9CA3AF' : colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      );
    }

    // MultipleChoice (Type = 1) and MultipleAnswers (Type = 2)
    const isMultiple = questionType === 2;
    const currentAnswers = isMultiple 
      ? (Array.isArray(selectedAnswer) ? selectedAnswer : (selectedAnswer ? [selectedAnswer] : []))
      : null;

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>
              Câu {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
          {questionPoints !== null && (
            <View style={styles.questionPoints}>
              <Text style={styles.questionPointsText}>{questionPoints} điểm</Text>
            </View>
          )}
        </View>

        {isMultiple && (
          <View style={styles.multipleAnswersHint}>
            <Ionicons name="information-circle-outline" size={scale(16)} color={colors.primary} />
            <Text style={styles.multipleAnswersHintText}>(Có thể chọn nhiều đáp án)</Text>
          </View>
        )}

        <Text style={styles.questionText}>{questionText}</Text>

        <View style={styles.answersContainer}>
          {answers.map((answer, index) => {
            const answerId = answer?.AnswerId || answer?.answerId || answer?.OptionId || answer?.optionId;
            const answerText = answer?.AnswerText || answer?.answerText || answer?.OptionText || answer?.optionText;
            const isSelected = isMultiple 
              ? (currentAnswers?.includes(answerId) || false)
              : (selectedAnswer === answerId);

            return (
              <TouchableOpacity
                key={answerId || index}
                style={[
                  styles.answerOption,
                  isSelected && styles.answerOptionSelected,
                ]}
                onPress={() => handleSelectAnswer(questionId, answerId, questionType)}
              >
                <View
                  style={[
                    isMultiple ? styles.answerCheckbox : styles.answerRadio,
                    isSelected && (isMultiple ? styles.answerCheckboxSelected : styles.answerRadioSelected),
                  ]}
                >
                  {isSelected && (
                    isMultiple ? (
                      <Ionicons name="checkmark" size={scale(16)} color="#FFFFFF" />
                    ) : (
                      <View style={styles.answerRadioInner} />
                    )
                  )}
                </View>
                <Text
                  style={[
                    styles.answerText,
                    isSelected && styles.answerTextSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}. {answerText}
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
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải quiz...</Text>
      </View>
    );
  }

  const isWarning = remainingTime !== null && remainingTime !== undefined && remainingTime < 300; // Less than 5 minutes
  const isDanger = remainingTime !== null && remainingTime !== undefined && remainingTime < 60; // Less than 1 minute

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {moduleName || quizTitle || 'Quiz'}
        </Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.headerButton} disabled={submitting}>
          <Text style={styles.submitHeaderText}>Nộp bài</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Timer */}
      {timeLimit && (
        <View style={[styles.timerContainer, isDanger && styles.timerContainerDanger, isWarning && !isDanger && styles.timerContainerWarning]}>
          <Ionicons name="time-outline" size={scale(20)} color={isDanger ? '#EF4444' : isWarning ? '#F59E0B' : colors.primary} />
          <Text style={[styles.timerText, isDanger && styles.timerTextDanger, isWarning && !isDanger && styles.timerTextWarning]}>
            {remainingTime !== null && remainingTime !== undefined ? formatTime(remainingTime) : 'Đang tính...'}
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {questions.map((_, index) => {
            const questionId = questions[index]?.QuestionId || questions[index]?.questionId;
            const isAnswered = Object.keys(selectedAnswers).includes(String(questionId));
            return (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentQuestionIndex && styles.progressDotActive,
                  isAnswered && styles.progressDotAnswered,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion()}
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navigationContainer, { paddingBottom: insets.bottom + verticalScale(10) }]}>
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
    backgroundColor: '#FFFFFF',
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
    minWidth: scale(60),
  },
  headerTitle: {
    flex: 1,
    fontSize: scale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: scale(8),
  },
  submitHeaderText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: scale(8),
  },
  timerContainerWarning: {
    backgroundColor: '#FEF3C7',
  },
  timerContainerDanger: {
    backgroundColor: '#FEE2E2',
  },
  timerText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.primary,
  },
  timerTextWarning: {
    color: '#F59E0B',
  },
  timerTextDanger: {
    color: '#EF4444',
  },
  progressContainer: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
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
    marginTop: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  questionPoints: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
  },
  questionPointsText: {
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
  // FillBlank styles
  fillBlankContainer: {
    marginTop: verticalScale(8),
  },
  fillBlankSentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    lineHeight: scale(40),
    marginBottom: verticalScale(24),
  },
  fillBlankText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: colors.text,
    lineHeight: scale(40),
  },
  fillBlankInputWrapper: {
    marginHorizontal: scale(4),
  },
  fillBlankInput: {
    minWidth: scale(150),
    borderWidth: 0,
    borderBottomWidth: 3,
    borderBottomColor: '#41D6E3',
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(10),
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#0D6EFD',
    borderRadius: scale(4),
  },
  fillBlankAnswerSection: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(24),
  },
  fillBlankLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
  },
  fillBlankTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    padding: scale(16),
    fontSize: scale(16),
    backgroundColor: '#F9FAFB',
    color: colors.text,
  },
  fillBlankTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    padding: scale(12),
    backgroundColor: '#EFF6FF',
    borderRadius: scale(8),
    marginTop: verticalScale(16),
  },
  fillBlankTipText: {
    fontSize: scale(13),
    color: colors.textSecondary,
    flex: 1,
  },
  // TrueFalse styles
  trueFalseContainer: {
    flexDirection: 'row',
    gap: scale(16),
    marginTop: verticalScale(16),
  },
  trueFalseOption: {
    flex: 1,
    padding: verticalScale(20),
    borderRadius: scale(12),
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trueFalseOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  trueFalseText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: colors.text,
  },
  trueFalseTextSelected: {
    color: colors.primary,
  },
  // MultipleAnswers styles
  multipleAnswersHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    padding: scale(12),
    backgroundColor: '#EFF6FF',
    borderRadius: scale(8),
    marginBottom: verticalScale(16),
  },
  multipleAnswersHintText: {
    fontSize: scale(14),
    color: colors.primary,
    fontWeight: '500',
  },
  answerCheckbox: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(6),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  answerCheckboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  // Matching styles
  matchingInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    padding: scale(12),
    backgroundColor: '#EFF6FF',
    borderRadius: scale(8),
    marginBottom: verticalScale(16),
  },
  matchingInstructionsText: {
    fontSize: scale(13),
    color: colors.textSecondary,
    flex: 1,
  },
  matchingContainer: {
    flexDirection: 'row',
    gap: scale(16),
    marginTop: verticalScale(16),
  },
  matchingColumn: {
    flex: 1,
    minWidth: scale(150),
  },
  matchingColumnTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  matchingItem: {
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: verticalScale(8),
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F9FAFB',
  },
  matchingItemLeft: {
    borderColor: '#E5E7EB',
  },
  matchingItemRight: {
    borderColor: '#E5E7EB',
  },
  matchingItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  matchingItemMatched: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  matchingItemDisabled: {
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  matchingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  matchingItemBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingItemBadgeRight: {
    backgroundColor: '#6B7280',
  },
  matchingItemBadgeText: {
    fontSize: scale(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matchingItemText: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '500',
    color: colors.text,
  },
  matchingItemPreview: {
    fontSize: scale(12),
    color: '#10B981',
    fontWeight: '600',
    marginTop: verticalScale(4),
    marginLeft: scale(32),
  },
  matchingSummary: {
    marginTop: verticalScale(16),
    padding: scale(12),
    backgroundColor: '#DBEAFE',
    borderRadius: scale(8),
    alignItems: 'center',
  },
  matchingSummaryText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.primary,
  },
  // Ordering styles
  orderingInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    padding: scale(12),
    backgroundColor: '#EFF6FF',
    borderRadius: scale(8),
    marginBottom: verticalScale(16),
  },
  orderingInstructionsText: {
    fontSize: scale(13),
    color: colors.textSecondary,
    flex: 1,
  },
  orderingList: {
    marginTop: verticalScale(16),
  },
  orderingItem: {
    padding: scale(12),
    borderRadius: scale(8),
    backgroundColor: '#F9FAFB',
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  orderingItemNumber: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderingItemNumberText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderingItemText: {
    flex: 1,
    fontSize: scale(16),
    fontWeight: '500',
    color: colors.text,
  },
  orderingItemActions: {
    flexDirection: 'row',
    gap: scale(8),
  },
  orderingActionButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderingActionButtonDisabled: {
    opacity: 0.5,
  },
});

export default QuizScreen;
