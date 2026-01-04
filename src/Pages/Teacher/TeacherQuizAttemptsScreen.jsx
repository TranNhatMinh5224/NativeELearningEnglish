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

const TeacherQuizAttemptsScreen = ({ route, navigation }) => {
  const { quizId, quizTitle, assessmentId, courseId, courseTitle, lessonId, lessonTitle, moduleId, moduleName, assessmentTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [attempts, setAttempts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Giống web: 10 items per page
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'inprogress'

  useFocusEffect(
    useCallback(() => {
      if (quizId) {
        setCurrentPage(1); // Reset to page 1 when screen is focused
        loadData(1); // Load page 1 when screen is focused
      }
    }, [quizId])
  );

  useEffect(() => {
    if (quizId && currentPage > 1) {
      loadData(currentPage); // Only load when currentPage changes (pagination)
    }
  }, [currentPage]);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      // Load attempts với pagination (giống web)
      const attemptsResponse = await teacherService.getQuizAttempts(quizId, {
        pageNumber: page,
        pageSize: pageSize,
      });
      const attemptsData = getResponseData(attemptsResponse);
      
      if (attemptsData) {
        const items = attemptsData.items || attemptsData.data || [];
        setAttempts(items); // Always replace, not append
        
        // Tính totalPages từ totalCount hoặc totalPages
        const totalCountValue = attemptsData.totalCount || attemptsData.totalCount || items.length;
        const totalPagesValue = attemptsData.totalPages || Math.ceil(totalCountValue / pageSize);
        setTotalPages(totalPagesValue);
        setTotalCount(totalCountValue);
      }

      // Load statistics (chỉ load 1 lần khi vào màn hình)
      if (page === 1) {
        try {
          const statsResponse = await teacherService.getQuizAttemptStats(quizId);
          const statsData = getResponseData(statsResponse);
          if (statsData) {
            setStatistics(statsData);
          }
        } catch (statsError) {
          // Statistics is optional, don't fail if it errors
        }
      }
    } catch (error) {
      setError(error?.message || 'Không thể tải danh sách bài làm');
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải danh sách bài làm',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(currentPage);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleAttemptPress = (attempt) => {
    navigation.navigate('TeacherQuizAttemptDetail', {
      attemptId: attempt.AttemptId || attempt.attemptId,
      quizId: quizId,
      quizTitle: quizTitle,
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
    // Status: 0 = NotStarted, 1 = InProgress, 2 = Completed
    if (status === 2 || status === 'Completed' || status === 'Hoàn thành') return '#10B981';
    if (status === 1 || status === 'InProgress' || status === 'Đang làm') return '#F59E0B';
    return colors.textSecondary;
  };

  const getStatusText = (status) => {
    // Status: 0 = NotStarted, 1 = InProgress, 2 = Completed
    if (status === 2 || status === 'Completed' || status === 'Hoàn thành') return 'Hoàn thành';
    if (status === 1 || status === 'InProgress' || status === 'Đang làm') return 'Đang làm';
    if (status === 0 || status === 'NotStarted' || status === 'Chưa bắt đầu') return 'Chưa bắt đầu';
    return 'N/A';
  };

  // Note: Filter được thực hiện ở client-side vì web không có filter
  // Nhưng pagination vẫn dựa trên server-side data
  const getFilteredAttempts = () => {
    let filtered = [...attempts];
    
    // Filter by status (client-side filtering)
    if (filterStatus === 'completed') {
      filtered = filtered.filter(a => {
        const status = a.Status || a.status;
        return status === 2 || status === 'Completed' || status === 'Hoàn thành';
      });
    } else if (filterStatus === 'inprogress') {
      filtered = filtered.filter(a => {
        const status = a.Status || a.status;
        return status === 1 || status === 'InProgress' || status === 'Đang làm';
      });
    }
    
    return filtered;
  };

  if (loading && attempts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách bài làm...</Text>
      </View>
    );
  }

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
              {quizTitle || 'Quản lý bài làm Quiz'}
            </Text>
          </View>
        </View>

        {/* Breadcrumb Navigation - Giống web */}
        {(courseTitle || lessonTitle || moduleName || assessmentTitle || quizTitle) && (
          <View style={styles.breadcrumbContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle });
                }}
                style={styles.breadcrumbItem}
              >
                <Text style={styles.breadcrumbText}>Tất cả khóa học</Text>
              </TouchableOpacity>
              {courseTitle && (
                <View style={styles.breadcrumbRow}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="rgba(255,255,255,0.7)" />
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle });
                    }}
                    style={styles.breadcrumbItem}
                  >
                    <Text style={styles.breadcrumbText}>{courseTitle}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {lessonTitle && (
                <View style={styles.breadcrumbRow}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="rgba(255,255,255,0.7)" />
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle, lessonId, lessonTitle });
                    }}
                    style={styles.breadcrumbItem}
                  >
                    <Text style={styles.breadcrumbText}>{lessonTitle}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {moduleName && (
                <View style={styles.breadcrumbRow}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="rgba(255,255,255,0.7)" />
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle, lessonId, lessonTitle, moduleId, moduleName });
                    }}
                    style={styles.breadcrumbItem}
                  >
                    <Text style={styles.breadcrumbText}>{moduleName}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {assessmentTitle && (
                <View style={styles.breadcrumbRow}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="rgba(255,255,255,0.7)" />
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('TeacherCourseSubmissions', { courseId, courseTitle, lessonId, lessonTitle, moduleId, moduleName, assessmentId, assessmentTitle });
                    }}
                    style={styles.breadcrumbItem}
                  >
                    <Text style={styles.breadcrumbText}>{assessmentTitle}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {quizTitle && (
                <View style={styles.breadcrumbRow}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="rgba(255,255,255,0.7)" />
                  <Text style={[styles.breadcrumbText, styles.breadcrumbTextActive]} numberOfLines={1}>
                    {quizTitle}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Statistics Card */}
        {statistics && (
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsTitle}>Thống kê</Text>
            <View style={styles.statisticsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statistics.TotalAttempts || statistics.totalAttempts || attempts.length}
                </Text>
                <Text style={styles.statLabel}>Tổng bài làm</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statistics.CompletedAttempts || statistics.completedAttempts || 0}
                </Text>
                <Text style={styles.statLabel}>Hoàn thành</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statistics.InProgressAttempts || statistics.inProgressAttempts || 0}
                </Text>
                <Text style={styles.statLabel}>Đang làm</Text>
              </View>
            </View>
          </View>
        )}

       
        {attempts.length > 0 && (
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
              style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('completed')}
            >
              <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
                Hoàn thành
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'inprogress' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('inprogress')}
            >
              <Text style={[styles.filterText, filterStatus === 'inprogress' && styles.filterTextActive]}>
                Đang làm
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Attempts List */}
        <View style={styles.attemptsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Danh sách bài làm
            </Text>
            <Text style={styles.sectionCount}>({getFilteredAttempts().length})</Text>
          </View>
          
          {getFilteredAttempts().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={scale(64)} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {attempts.length === 0 ? 'Chưa có bài làm nào' : 'Không có bài làm phù hợp'}
              </Text>
            </View>
          ) : (
            getFilteredAttempts().map((attempt, index) => {
              const attemptId = attempt.AttemptId || attempt.attemptId;
              const userName = attempt.UserName || attempt.userName || 'Học viên';
              const userEmail = attempt.UserEmail || attempt.userEmail || '';
              const userAvatar = attempt.UserAvatarUrl || attempt.userAvatarUrl;
              const startedAt = attempt.StartedAt || attempt.startedAt;
              const submittedAt = attempt.SubmittedAt || attempt.submittedAt;
              const status = attempt.Status || attempt.status;
              const attemptNumber = attempt.AttemptNumber || attempt.attemptNumber || 1;
              const totalScore = attempt.TotalScore || attempt.totalScore;

              return (
                <TouchableOpacity
                  key={`attempt-${attemptId || index}`}
                  style={styles.attemptCard}
                  onPress={() => handleAttemptPress(attempt)}
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
                      <Ionicons name="repeat" size={scale(14)} color={colors.textSecondary} />
                      <Text style={styles.detailText}>Lần làm: {attemptNumber}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={scale(14)} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{formatDate(startedAt)}</Text>
                    </View>
                    {submittedAt && (
                      <View style={styles.detailItem}>
                        <Ionicons name="checkmark-circle" size={scale(14)} color="#10B981" />
                        <Text style={styles.detailText}>Nộp: {formatDate(submittedAt)}</Text>
                      </View>
                    )}
                    {totalScore !== null && totalScore !== undefined && (
                      <View style={styles.detailItem}>
                        <Ionicons name="star" size={scale(14)} color="#F59E0B" />
                        <Text style={styles.scoreDetailText}>
                          Điểm: {totalScore}
                        </Text>
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

        {/* Pagination Controls - Giống web */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={scale(16)} color={currentPage === 1 ? colors.textLight : colors.text} />
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Đầu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={scale(16)} color={currentPage === 1 ? colors.textLight : colors.text} />
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Trước
              </Text>
            </TouchableOpacity>

            {/* Page Numbers */}
            <View style={styles.pageNumbersContainer}>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Hiển thị: page 1, last page, và các page xung quanh currentPage
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <TouchableOpacity
                      key={`page-${page}`}
                      style={[
                        styles.pageNumberButton,
                        page === currentPage && styles.pageNumberButtonActive,
                      ]}
                      onPress={() => handlePageChange(page)}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          page === currentPage && styles.pageNumberTextActive,
                        ]}
                      >
                        {page}
                      </Text>
                    </TouchableOpacity>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <Text key={`ellipsis-${page}`} style={styles.pageEllipsis}>
                      ...
                    </Text>
                  );
                }
                return null;
              })}
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                Sau
              </Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={currentPage === totalPages ? colors.textLight : colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                Cuối
              </Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={currentPage === totalPages ? colors.textLight : colors.text} />
            </TouchableOpacity>
          </View>
        )}
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
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  breadcrumbItem: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  breadcrumbText: {
    fontSize: scale(12),
    color: 'rgba(255,255,255,0.8)',
  },
  breadcrumbTextActive: {
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
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statisticsTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
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
  attemptsSection: {
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
  attemptCard: {
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
  chevron: {
    position: 'absolute',
    right: scale(16),
    top: '50%',
    marginTop: -scale(10),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: 16,
  },
  errorText: {
    fontSize: scale(14),
    color: '#DC2626',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: scale(8),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  paginationButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.text,
  },
  paginationButtonTextDisabled: {
    color: colors.textLight,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageNumberButton: {
    minWidth: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageNumberText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.text,
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
  },
  pageEllipsis: {
    fontSize: scale(14),
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
});

export default TeacherQuizAttemptsScreen;

