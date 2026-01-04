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

const TeacherEssaySubmissionsScreen = ({ route, navigation }) => {
  const { essayId, essayTitle, assessmentId } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'score', 'status'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'graded', 'pending'

  useFocusEffect(
    useCallback(() => {
      if (essayId) {
        loadData();
      }
    }, [essayId])
  );

  const loadData = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }

      // Load submissions
      const submissionsResponse = await teacherService.getEssaySubmissions(essayId, {
        pageNumber: page,
        pageSize: pageSize,
      });
      const submissionsData = getResponseData(submissionsResponse);
      
      if (submissionsData?.items) {
        const newSubmissions = submissionsData.items || [];
        if (reset) {
          setSubmissions(newSubmissions);
        } else {
          setSubmissions(prev => [...prev, ...newSubmissions]);
        }
        
        setHasMore(newSubmissions.length === pageSize);
        setPageNumber(page);
      }

      // Load statistics
      try {
        const statsResponse = await teacherService.getEssayStatistics(essayId);
        const statsData = getResponseData(statsResponse);
        if (statsData) {
          setStatistics(statsData);
        }
      } catch (statsError) {
        // Statistics is optional, don't fail if it errors
      }
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải danh sách bài nộp',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadData(pageNumber + 1, false);
    }
  };

  const handleBatchGradeAI = () => {
    Alert.alert(
      'Chấm điểm hàng loạt bằng AI',
      'Bạn có chắc muốn chấm tất cả bài nộp chưa chấm bằng AI?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setLoading(true);
              await teacherService.batchGradeByAI(essayId);
              setToast({
                visible: true,
                message: 'Đã bắt đầu chấm điểm bằng AI. Vui lòng đợi...',
                type: 'success',
              });
              setTimeout(() => {
                loadData(1, true);
              }, 2000);
            } catch (error) {
              setToast({
                visible: true,
                message: error?.message || 'Không thể chấm điểm bằng AI',
                type: 'error',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmissionPress = (submission) => {
    navigation.navigate('TeacherSubmissionDetail', {
      submissionId: submission.SubmissionId || submission.submissionId,
      essayId: essayId,
      essayTitle: essayTitle,
    });
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

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('submitted')) return '#3B82F6';
    if (statusLower.includes('graded')) return '#10B981';
    if (statusLower.includes('pending')) return '#F59E0B';
    return colors.textSecondary;
  };

  const getStatusText = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('submitted')) return 'Đã nộp';
    if (statusLower.includes('graded')) return 'Đã chấm';
    if (statusLower.includes('pending')) return 'Chờ chấm';
    return status || 'N/A';
  };

  const getFilteredSubmissions = () => {
    let filtered = [...submissions];
    
    // Filter by status
    if (filterStatus === 'graded') {
      filtered = filtered.filter(s => {
        const status = (s.Status || s.status || '').toLowerCase();
        return status.includes('graded');
      });
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(s => {
        const status = (s.Status || s.status || '').toLowerCase();
        return !status.includes('graded') && (status.includes('submitted') || status.includes('pending'));
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.SubmittedAt || a.submittedAt || 0);
      const dateB = new Date(b.SubmittedAt || b.submittedAt || 0);
      return dateB - dateA; // Newest first
    });
    
    return filtered;
  };

  if (loading && submissions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách bài nộp...</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle} numberOfLines={2}>
              {essayTitle || 'Quản lý bài nộp'}
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
        onScrollEndDrag={handleLoadMore}
      >
        {/* Statistics Card */}
        {statistics && (
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsTitle}>Thống kê</Text>
            <View style={styles.statisticsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statistics.TotalSubmissions || statistics.totalSubmissions || 0}
                </Text>
                <Text style={styles.statLabel}>Tổng bài nộp</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statistics.GradedSubmissions || statistics.gradedSubmissions || 0}
                </Text>
                <Text style={styles.statLabel}>Đã chấm</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statistics.PendingSubmissions || statistics.pendingSubmissions || 0}
                </Text>
                <Text style={styles.statLabel}>Chờ chấm</Text>
              </View>
            </View>
          </View>
        )}

        {/* Batch Grade Button */}
        {submissions.length > 0 && (
          <TouchableOpacity
            style={styles.batchGradeButton}
            onPress={handleBatchGradeAI}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.batchGradeGradient}
            >
              <Ionicons name="sparkles" size={scale(20)} color="#FFFFFF" />
              <Text style={styles.batchGradeText}>Chấm hàng loạt bằng AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Filter and Sort */}
        {submissions.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'graded' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('graded')}
            >
              <Text style={[styles.filterText, filterStatus === 'graded' && styles.filterTextActive]}>
                Đã chấm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
                Chờ chấm
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submissions List */}
        <View style={styles.submissionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Danh sách bài nộp
            </Text>
            <Text style={styles.sectionCount}>({getFilteredSubmissions().length})</Text>
          </View>
          
          {getFilteredSubmissions().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={scale(64)} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {submissions.length === 0 ? 'Chưa có bài nộp nào' : 'Không có bài nộp phù hợp'}
              </Text>
            </View>
          ) : (
            getFilteredSubmissions().map((submission, index) => {
              const submissionId = submission.SubmissionId || submission.submissionId;
              const userName = submission.UserName || submission.userName || 'Học viên';
              const userEmail = submission.UserEmail || submission.userEmail || '';
              const userAvatar = submission.UserAvatarUrl || submission.userAvatarUrl;
              const submittedAt = submission.SubmittedAt || submission.submittedAt;
              const status = submission.Status || submission.status;
              const score = submission.Score || submission.score;
              const totalPoints = submission.TotalPoints || submission.totalPoints || 10;
              const hasAttachment = !!(submission.AttachmentUrl || submission.attachmentUrl);

              return (
                <TouchableOpacity
                  key={submissionId || index}
                  style={styles.submissionCard}
                  onPress={() => handleSubmissionPress(submission)}
                  activeOpacity={0.7}
                >
                  {/* Student Info Row */}
                  <View style={styles.cardRow}>
                    <View style={styles.studentInfoRow}>
                      {userAvatar ? (
                        <Image source={{ uri: userAvatar }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={scale(20)} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.studentInfo}>
                        <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                        {userEmail && (
                          <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
                        )}
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(status) },
                        ]}
                      >
                        {getStatusText(status)}
                      </Text>
                    </View>
                  </View>

                  {/* Details Row */}
                  <View style={styles.cardDetailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={scale(14)} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{formatDate(submittedAt)}</Text>
                    </View>
                    {score !== null && score !== undefined && (
                      <View style={styles.detailItem}>
                        <Ionicons name="star" size={scale(14)} color="#F59E0B" />
                        <Text style={styles.scoreDetailText}>
                          {score}/{totalPoints}
                        </Text>
                      </View>
                    )}
                    {hasAttachment && (
                      <View style={styles.detailItem}>
                        <Ionicons name="attach" size={scale(14)} color={colors.primary} />
                        <Text style={styles.attachmentDetailText}>File đính kèm</Text>
                      </View>
                    )}
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={scale(20)}
                    color={colors.textSecondary}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {hasMore && submissions.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
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
  statisticsCard: {
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
  statisticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  batchGradeButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginBottom: 16,
  },
  batchGradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  batchGradeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: scale(8),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
  },
  submissionsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: scale(12),
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scoreDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  attachmentDetailText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  chevron: {
    position: 'absolute',
    right: scale(16),
    top: '50%',
    marginTop: -scale(10),
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default TeacherEssaySubmissionsScreen;

