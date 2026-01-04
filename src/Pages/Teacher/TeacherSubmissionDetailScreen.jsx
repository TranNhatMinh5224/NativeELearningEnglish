import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Alert,
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

const TeacherSubmissionDetailScreen = ({ route, navigation }) => {
  const { submissionId, essayId, essayTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useFocusEffect(
    useCallback(() => {
      if (submissionId) {
        loadSubmission();
      }
    }, [submissionId])
  );

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getSubmissionDetail(submissionId);
      const submissionData = getResponseData(response);
      
      if (submissionData) {
        setSubmission(submissionData);
      }
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải chi tiết bài nộp',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubmission();
  };

  const handleDownloadFile = async () => {
    if (!submission?.AttachmentUrl && !submission?.attachmentUrl) return;
    
    try {
      const attachmentUrl = submission.AttachmentUrl || submission.attachmentUrl;
      const canOpen = await Linking.canOpenURL(attachmentUrl);
      if (canOpen) {
        await Linking.openURL(attachmentUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể mở file này');
      }
    } catch (error) {
      setToast({
        visible: true,
        message: 'Không thể tải file',
        type: 'error',
      });
    }
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

  if (loading && !submission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết bài nộp...</Text>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={scale(64)} color={colors.error} />
        <Text style={styles.errorText}>Không tìm thấy bài nộp</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userName = submission.UserName || submission.userName || 'Học viên';
  const userAvatar = submission.UserAvatarUrl || submission.userAvatarUrl;
  const textContent = submission.TextContent || submission.textContent || submission.Content || submission.content || '';
  const attachmentUrl = submission.AttachmentUrl || submission.attachmentUrl;
  const submittedAt = submission.SubmittedAt || submission.submittedAt;
  const status = submission.Status || submission.status;
  const score = submission.Score || submission.score;
  const totalPoints = submission.TotalPoints || submission.totalPoints || 10;
  const feedback = submission.Feedback || submission.feedback;
  const teacherScore = submission.TeacherScore || submission.teacherScore;
  const teacherFeedback = submission.TeacherFeedback || submission.teacherFeedback;
  const gradedAt = submission.GradedAt || submission.gradedAt;
  const teacherGradedAt = submission.TeacherGradedAt || submission.teacherGradedAt;

  const hasScore = score !== null && score !== undefined;
  const hasTeacherScore = teacherScore !== null && teacherScore !== undefined;
  const finalScore = hasTeacherScore ? teacherScore : (hasScore ? score : null);
  const finalFeedback = teacherFeedback || feedback;

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
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {essayTitle || 'Chi tiết bài nộp'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Student Info */}
        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={scale(24)} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{userName}</Text>
              <Text style={styles.submittedDate}>
                Nộp bài: {formatDate(submittedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Score Card */}
        {finalScore !== null && finalScore !== undefined && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="star" size={scale(24)} color="#F59E0B" />
              <Text style={styles.scoreTitle}>Điểm số</Text>
            </View>
            <View style={styles.scoreContent}>
              <Text style={styles.scoreValue}>
                {finalScore}/{totalPoints}
              </Text>
              <Text style={styles.scorePercentage}>
                {((finalScore / totalPoints) * 100).toFixed(1)}%
              </Text>
            </View>
            {teacherGradedAt && (
              <Text style={styles.gradedDate}>
                Chấm bởi giáo viên: {formatDate(teacherGradedAt)}
              </Text>
            )}
            {gradedAt && !teacherGradedAt && (
              <Text style={styles.gradedDate}>
                Chấm bởi AI: {formatDate(gradedAt)}
              </Text>
            )}
          </View>
        )}

        {/* Feedback Card */}
        {finalFeedback && (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="chatbubble-ellipses" size={scale(20)} color={colors.primary} />
              <Text style={styles.feedbackTitle}>Nhận xét</Text>
            </View>
            <Text style={styles.feedbackText}>{finalFeedback}</Text>
          </View>
        )}

        {/* Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Ionicons name="document-text" size={scale(20)} color={colors.primary} />
            <Text style={styles.contentTitle}>Nội dung bài làm</Text>
          </View>
          {textContent ? (
            <Text style={styles.contentText}>{textContent}</Text>
          ) : (
            <Text style={styles.emptyContentText}>Không có nội dung</Text>
          )}
          {textContent && (
            <Text style={styles.charCount}>
              {textContent.trim().length} ký tự
            </Text>
          )}
        </View>

        {/* Attachment Card */}
        {attachmentUrl && (
          <View style={styles.attachmentCard}>
            <View style={styles.attachmentHeader}>
              <Ionicons name="attach" size={scale(20)} color={colors.primary} />
              <Text style={styles.attachmentTitle}>File đính kèm</Text>
            </View>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadFile}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadGradient}
              >
                <Ionicons name="download" size={scale(20)} color="#FFFFFF" />
                <Text style={styles.downloadText}>Tải file</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="information-circle" size={scale(20)} color={colors.textSecondary} />
            <Text style={styles.statusTitle}>Trạng thái</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status?.toLowerCase().includes('graded')
                    ? '#10B98120'
                    : status?.toLowerCase().includes('submitted')
                    ? '#3B82F620'
                    : '#F59E0B20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    status?.toLowerCase().includes('graded')
                      ? '#10B981'
                      : status?.toLowerCase().includes('submitted')
                      ? '#3B82F6'
                      : '#F59E0B',
                },
              ]}
            >
              {status?.toLowerCase().includes('graded')
                ? 'Đã chấm'
                : status?.toLowerCase().includes('submitted')
                ? 'Đã nộp'
                : status || 'N/A'}
            </Text>
          </View>
        </View>
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
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  submittedDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scoreCard: {
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
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scoreContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  scorePercentage: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  gradedDate: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackCard: {
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
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  contentCard: {
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
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  contentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  emptyContentText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  attachmentCard: {
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
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  downloadButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: scale(12),
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TeacherSubmissionDetailScreen;

