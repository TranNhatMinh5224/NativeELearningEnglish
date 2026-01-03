import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';

const LessonResultScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    type = 'lesson',
    moduleName,
    lessonTitle,
    quizTitle,
    totalScore = 0,
    totalQuestions = 0,
    correctCount = 0,
    percentage = 0,
    isPassed = false,
    timeSpentSeconds = 0,
    totalItems = 0,
  } = route.params || {};

  const isQuiz = type === 'quiz';
  const isFlashcard = type === 'flashcard';

  const displayTitle =
    quizTitle ||
    moduleName ||
    lessonTitle ||
    (isQuiz ? 'Kết quả quiz' : isFlashcard ? 'Kết quả flashcard' : 'Kết quả bài học');

  const mainMessage = isQuiz
    ? isPassed
      ? 'Bạn đã hoàn thành bài kiểm tra!'
      : 'Bạn đã hoàn thành bài kiểm tra, hãy luyện thêm nhé!'
    : isFlashcard
    ? 'Bạn đã hoàn thành buổi học flashcard!'
    : 'Bạn đã hoàn thành bài học này!';

  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;

  const percentageValue = typeof percentage === 'number' ? Math.round(percentage) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={scale(26)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả</Text>
        <View style={styles.headerButton} />
      </LinearGradient>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.card}>
          <Text style={styles.titleText}>{displayTitle}</Text>
          <Text style={styles.messageText}>{mainMessage}</Text>

          {/* Main metric */}
          <View style={styles.mainMetricWrapper}>
            <View
              style={[
                styles.scoreCircle,
                isQuiz && isPassed && { borderColor: '#10B981' },
              ]}
            >
              {isQuiz ? (
                <>
                  <Text style={styles.scoreNumber}>
                    {correctCount}/{totalQuestions || correctCount || 0}
                  </Text>
                  <Text style={styles.scoreLabel}>Câu đúng</Text>
                </>
              ) : (
                <>
                  <Text style={styles.scoreNumber}>{totalItems}</Text>
                  <Text style={styles.scoreLabel}>Thẻ đã học</Text>
                </>
              )}
            </View>
          </View>

          {/* Details */}
          <View style={styles.statsRow}>
            {isQuiz && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Điểm</Text>
                <Text style={styles.statValue}>{totalScore}</Text>
              </View>
            )}
            {isQuiz && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tỉ lệ đúng</Text>
                <Text style={styles.statValue}>{percentageValue}%</Text>
              </View>
            )}
            {timeSpentSeconds > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Thời gian</Text>
                <Text style={styles.statValue}>
                  {minutes}p {seconds}s
                </Text>
              </View>
            )}
          </View>

          {isQuiz && (
            <View style={styles.badgeWrapper}>
              <View
                style={[
                  styles.resultBadge,
                  isPassed ? styles.badgePassed : styles.badgeFailed,
                ]}
              >
                <Ionicons
                  name={isPassed ? 'checkmark-circle' : 'alert-circle'}
                  size={scale(18)}
                  color={isPassed ? '#047857' : '#B45309'}
                />
                <Text
                  style={[
                    styles.badgeText,
                    isPassed ? styles.badgeTextPassed : styles.badgeTextFailed,
                  ]}
                >
                  {isPassed ? 'Đạt yêu cầu' : 'Chưa đạt yêu cầu'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsWrapper}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Quay lại bài học</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] })
            }
          >
            <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  contentWrapper: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(24),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.08,
    shadowRadius: scale(10),
    elevation: 3,
  },
  titleText: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(4),
  },
  messageText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginBottom: verticalScale(20),
  },
  mainMetricWrapper: {
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  scoreCircle: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    borderWidth: 6,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFF',
  },
  scoreNumber: {
    fontSize: scale(32),
    fontWeight: '800',
    color: colors.primary,
  },
  scoreLabel: {
    marginTop: verticalScale(4),
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(12),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
  },
  badgeWrapper: {
    marginTop: verticalScale(16),
    alignItems: 'center',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
  },
  badgePassed: {
    backgroundColor: '#D1FAE5',
  },
  badgeFailed: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    marginLeft: scale(6),
    fontSize: scale(13),
    fontWeight: '600',
  },
  badgeTextPassed: {
    color: '#047857',
  },
  badgeTextFailed: {
    color: '#B45309',
  },
  actionsWrapper: {
    marginTop: verticalScale(24),
    gap: verticalScale(12),
  },
  primaryButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.text,
  },
});

export default LessonResultScreen;
