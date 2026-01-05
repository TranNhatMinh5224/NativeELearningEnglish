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
              onPress={() => navigation.goBack()}
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
});

export default TeacherQuizAttemptDetailScreen;


