import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import teacherService from '../../Services/teacherService';
import { getResponseData } from '../../Utils/apiHelper';
import Toast from '../../Components/Common/Toast';

const TeacherQuizAttemptDetailScreen = ({ route, navigation }) => {
  const { attemptId, quizId, quizTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (attemptId) {
      loadAttemptDetail();
    }
  }, [attemptId]);

  const loadAttemptDetail = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getQuizAttemptDetail(attemptId);
      const data = getResponseData(response);
      setAttemptDetail(data);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải chi tiết bài làm',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết bài làm...</Text>
      </View>
    );
  }

  if (!attemptDetail) {
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
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Chi tiết bài làm</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={scale(64)} color={colors.textLight} />
          <Text style={styles.emptyText}>Không tìm thấy thông tin bài làm</Text>
        </View>
      </View>
    );
  }

  const userName = attemptDetail.UserName || attemptDetail.userName || attemptDetail.FirstName || attemptDetail.firstName || 'Học viên';
  const lastName = attemptDetail.LastName || attemptDetail.lastName || '';
  const fullName = lastName ? `${userName} ${lastName}` : userName;
  const email = attemptDetail.Email || attemptDetail.email || 'N/A';
  const userAvatar = attemptDetail.UserAvatarUrl || attemptDetail.userAvatarUrl;
  const totalScore = attemptDetail.TotalScore !== undefined ? attemptDetail.TotalScore : (attemptDetail.totalScore !== undefined ? attemptDetail.totalScore : null);
  const maxScore = attemptDetail.MaxScore !== undefined ? attemptDetail.MaxScore : (attemptDetail.maxScore !== undefined ? attemptDetail.maxScore : null);
  const percentage = attemptDetail.Percentage !== undefined ? attemptDetail.Percentage : (attemptDetail.percentage !== undefined ? attemptDetail.percentage : null);
  const timeSpentSeconds = attemptDetail.TimeSpentSeconds !== undefined ? attemptDetail.TimeSpentSeconds : (attemptDetail.timeSpentSeconds !== undefined ? attemptDetail.timeSpentSeconds : 0);
  const startedAt = attemptDetail.StartedAt || attemptDetail.startedAt;
  const submittedAt = attemptDetail.SubmittedAt || attemptDetail.submittedAt;
  const status = attemptDetail.Status || attemptDetail.status;
  const attemptNumber = attemptDetail.AttemptNumber || attemptDetail.attemptNumber || 1;

  const getStatusColor = (status) => {
    if (status === 2 || status === 'Completed' || status === 'Hoàn thành') return '#10B981';
    if (status === 1 || status === 'InProgress' || status === 'Đang làm') return '#F59E0B';
    return colors.textSecondary;
  };

  const getStatusText = (status) => {
    if (status === 2 || status === 'Completed' || status === 'Hoàn thành') return 'Hoàn thành';
    if (status === 1 || status === 'InProgress' || status === 'Đang làm') return 'Đang làm';
    if (status === 0 || status === 'NotStarted' || status === 'Chưa bắt đầu') return 'Chưa bắt đầu';
    return 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuestionTypeText = (type) => {
    const typeMap = {
      'MultipleChoice': 'MultipleChoice',
      'MultipleAnswers': 'MultipleAnswers',
      'TrueFalse': 'TrueFalse',
      'FillBlank': 'FillBlank',
      'Matching': 'Matching',
      'Ordering': 'Ordering',
    };
    return typeMap[type] || type || 'N/A';
  };

  const renderQuestionDetail = (question, index) => {
    const questionId = question.questionId || question.QuestionId;
    const questionText = question.questionText || question.QuestionText || '';
    const questionType = question.type || question.Type || '';
    const points = question.points || question.Points || 0;
    const score = question.score || question.Score || 0;
    const isCorrect = question.isCorrect || question.IsCorrect || false;
    const userAnswerText = question.userAnswerText || question.UserAnswerText || 'Chưa trả lời';
    const correctAnswerText = question.correctAnswerText || question.CorrectAnswerText || '';
    const options = question.options || question.Options || [];

    return (
      <View key={questionId || index} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionHeaderLeft}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>Câu {index + 1}</Text>
            </View>
            <View style={styles.questionTypeBadge}>
              <Text style={styles.questionTypeText}>{getQuestionTypeText(questionType)}</Text>
            </View>
            <View style={[styles.questionStatusBadge, isCorrect ? styles.questionStatusCorrect : styles.questionStatusIncorrect]}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={scale(14)}
                color={isCorrect ? colors.success : colors.error}
              />
              <Text style={[styles.questionStatusText, isCorrect ? styles.questionStatusTextCorrect : styles.questionStatusTextIncorrect]}>
                {isCorrect ? 'Đúng' : 'Sai'}
              </Text>
            </View>
          </View>
          <View style={styles.questionScoreBadge}>
            <Text style={styles.questionScoreText}>
              {score.toFixed(1)}/{points.toFixed(1)} điểm
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{questionText}</Text>

        {options.length > 0 && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsLabel}>Các lựa chọn:</Text>
            {options.map((option, optIndex) => {
              const optionId = option.optionId || option.OptionId;
              const optionText = option.optionText || option.OptionText || '';
              const isOptionCorrect = option.isCorrect || option.IsCorrect || false;
              const isSelected = option.isSelected || option.IsSelected || false;

              return (
                <View
                  key={optionId || optIndex}
                  style={[
                    styles.optionItem,
                    isOptionCorrect && styles.optionItemCorrect,
                  ]}
                >
                  <Text style={styles.optionText}>{optionText}</Text>
                  {isOptionCorrect && (
                    <View style={styles.correctIndicator} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.answerSection}>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Đáp án của học sinh:</Text>
            <Text style={[styles.answerValue, !isCorrect && styles.answerValueIncorrect]}>
              {userAnswerText}
            </Text>
          </View>
          {correctAnswerText && (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Đáp án đúng:</Text>
              <Text style={[styles.answerValue, styles.answerValueCorrect]}>
                {correctAnswerText}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#4F46E5']}
        style={[styles.header, { paddingTop: insets.top + verticalScale(16) }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              Chi tiết bài làm
            </Text>
            {quizTitle && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {quizTitle}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Student Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={scale(20)} color={colors.primary} />
            <Text style={styles.cardTitle}>Thông tin học viên</Text>
          </View>
          <View style={styles.studentInfoRow}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={scale(32)} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.studentInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Score Card */}
        {(totalScore !== null || percentage !== null) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={scale(20)} color="#F59E0B" />
              <Text style={styles.cardTitle}>Điểm số</Text>
            </View>
            <View style={styles.scoreContainer}>
              {totalScore !== null && maxScore !== null && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Điểm:</Text>
                  <Text style={styles.scoreValue}>
                    {totalScore} / {maxScore}
                  </Text>
                </View>
              )}
              {percentage !== null && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Phần trăm:</Text>
                  <Text style={styles.scoreValue}>{percentage}%</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Attempt Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={scale(20)} color={colors.primary} />
            <Text style={styles.cardTitle}>Thông tin bài làm</Text>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="repeat" size={scale(16)} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Lần làm:</Text>
              <Text style={styles.infoValue}>{attemptNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={scale(16)} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Thời gian làm bài:</Text>
              <Text style={styles.infoValue}>{formatTime(timeSpentSeconds)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={scale(16)} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
              <Text style={styles.infoValue}>{formatDate(startedAt)}</Text>
            </View>
            {submittedAt && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={scale(16)} color="#10B981" />
                <Text style={styles.infoLabel}>Ngày nộp:</Text>
                <Text style={styles.infoValue}>{formatDate(submittedAt)}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="flag" size={scale(16)} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(status) + '20' },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                  {getStatusText(status)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Questions Detail Section */}
        {(() => {
          const questions = attemptDetail?.Questions || attemptDetail?.questions || [];
          if (Array.isArray(questions) && questions.length > 0) {
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="list" size={scale(20)} color={colors.primary} />
                  <Text style={styles.cardTitle}>Chi tiết câu hỏi</Text>
                </View>
                {questions.map((question, index) => {
                  return renderQuestionDetail(question, index);
                })}
              </View>
            );
          }
          return null;
        })()}
      </ScrollView>

      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
      )}
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
  header: {
    paddingBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  userName: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  scoreContainer: {
    gap: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreLabel: {
    fontSize: scale(15),
    color: colors.textSecondary,
  },
  scoreValue: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.primary,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: scale(12),
  },
  statusText: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginTop: 16,
  },
  questionCard: {
    marginTop: scale(16),
    padding: scale(16),
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    flex: 1,
    flexWrap: 'wrap',
  },
  questionNumberBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },
  questionNumberText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: colors.primary,
  },
  questionTypeBadge: {
    backgroundColor: colors.textSecondary + '15',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },
  questionTypeText: {
    fontSize: scale(11),
    fontWeight: '500',
    color: colors.textSecondary,
  },
  questionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
    gap: scale(4),
  },
  questionStatusCorrect: {
    backgroundColor: colors.success + '15',
  },
  questionStatusIncorrect: {
    backgroundColor: colors.error + '15',
  },
  questionStatusText: {
    fontSize: scale(11),
    fontWeight: '600',
  },
  questionStatusTextCorrect: {
    color: colors.success,
  },
  questionStatusTextIncorrect: {
    color: colors.error,
  },
  questionScoreBadge: {
    backgroundColor: colors.textSecondary + '10',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },
  questionScoreText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: colors.text,
  },
  questionText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.text,
    marginBottom: scale(12),
    lineHeight: scale(22),
  },
  optionsContainer: {
    marginBottom: scale(12),
  },
  optionsLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: scale(8),
  },
  optionItem: {
    padding: scale(12),
    borderRadius: scale(8),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: scale(8),
    position: 'relative',
  },
  optionItemCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.success + '08',
  },
  optionText: {
    fontSize: scale(14),
    color: colors.text,
  },
  correctIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.success,
  },
  answerSection: {
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: scale(8),
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  answerLabel: {
    fontSize: scale(13),
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  answerValue: {
    fontSize: scale(13),
    color: colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  answerValueIncorrect: {
    color: colors.error,
  },
  answerValueCorrect: {
    color: colors.success,
    fontWeight: '600',
  },
});

export default TeacherQuizAttemptDetailScreen;


