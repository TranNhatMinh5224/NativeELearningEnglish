import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../Theme/colors';

const StudentDetailModal = ({ visible, onClose, student, courseId }) => {
  if (!student) return null;

  const displayName = student.displayName || student.DisplayName || 
    `${student.firstName || student.FirstName || ''} ${student.lastName || student.LastName || ''}`.trim();
  const email = student.email || student.Email || '';
  const dateOfBirth = student.dateOfBirth || student.DateOfBirth;
  const isMale = student.isMale !== undefined ? student.isMale : (student.IsMale !== undefined ? student.IsMale : true);
  const avatarUrl = student.avatarUrl || student.AvatarUrl;
  const courseName = student.courseName || student.CourseName || '';
  const joinedAt = student.joinedAt || student.JoinedAt;
  const progress = student.progress || student.Progress;

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Chưa cập nhật';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Chưa cập nhật';
    }
  };

  const calculateAge = (dateString) => {
    if (!dateString) return null;
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(dateOfBirth);
  const progressPercentage = progress?.progressPercentage || progress?.ProgressPercentage || 0;
  const completedLessons = progress?.completedLessons || progress?.CompletedLessons || 0;
  const totalLessons = progress?.totalLessons || progress?.TotalLessons || 0;
  const isCompleted = progress?.isCompleted || progress?.IsCompleted || false;
  const completedAt = progress?.completedAt || progress?.CompletedAt;
  const lastUpdated = progress?.lastUpdated || progress?.LastUpdated;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin học viên</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Avatar and Basic Info */}
              <View style={styles.studentHeader}>
                <View style={styles.studentAvatarLarge}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color={colors.primary} />
                    </View>
                  )}
                </View>
                <View style={styles.studentHeaderInfo}>
                  <Text style={styles.studentNameLarge}>{displayName || 'Chưa có tên'}</Text>
                  {isCompleted && (
                    <View style={styles.completionBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.completionBadgeText}>Đã hoàn thành khóa học</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Personal Information */}
              <View style={styles.infoSection}>
                <View style={styles.sectionTitle}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitleText}>Thông tin cá nhân</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabel}>
                      <Ionicons name="mail-outline" size={16} color={colors.textLight} />
                      <Text style={styles.infoLabelText}>Email</Text>
                    </View>
                    <Text style={styles.infoValue}>{email || 'Chưa cập nhật'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabel}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
                      <Text style={styles.infoLabelText}>Ngày sinh</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {formatDate(dateOfBirth)}
                      {age !== null && ` (${age} tuổi)`}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabel}>
                      <Ionicons name="male-female-outline" size={16} color={colors.textLight} />
                      <Text style={styles.infoLabelText}>Giới tính</Text>
                    </View>
                    <Text style={styles.infoValue}>{isMale ? 'Nam' : 'Nữ'}</Text>
                  </View>
                </View>
              </View>

              {/* Course Information */}
              <View style={styles.infoSection}>
                <View style={styles.sectionTitle}>
                  <Ionicons name="school-outline" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitleText}>Thông tin khóa học</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabelText}>Khóa học</Text>
                    <Text style={styles.infoValue}>{courseName || 'Chưa cập nhật'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabelText}>Ngày tham gia</Text>
                    <Text style={styles.infoValue}>{formatDateTime(joinedAt)}</Text>
                  </View>
                </View>
              </View>

              {/* Progress Information */}
              {progress && (
                <View style={styles.infoSection}>
                  <View style={styles.sectionTitle}>
                    <Ionicons name="school-outline" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitleText}>Tiến độ học tập</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressStats}>
                      <View style={styles.progressStatItem}>
                        <Text style={styles.progressLabel}>Bài học đã hoàn thành</Text>
                        <Text style={styles.progressValue}>
                          {String(completedLessons)} / {String(totalLessons)}
                        </Text>
                      </View>
                      <View style={styles.progressStatItem}>
                        <Text style={styles.progressLabel}>Tỷ lệ hoàn thành</Text>
                        <Text style={styles.progressValue}>
                          {Number(progressPercentage).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBarWrapper}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                        />
                      </View>
                    </View>
                    {isCompleted && completedAt && (
                      <View style={styles.completionInfo}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.completionInfoText}>
                          Hoàn thành vào: {formatDateTime(completedAt)}
                        </Text>
                      </View>
                    )}
                    {lastUpdated && (
                      <Text style={styles.lastUpdated}>
                        Cập nhật lần cuối: {formatDateTime(lastUpdated)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButtonFooter} onPress={onClose}>
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  studentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  studentAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentHeaderInfo: {
    alignItems: 'center',
  },
  studentNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  completionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressStatItem: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarWrapper: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  completionInfoText: {
    fontSize: 12,
    color: '#059669',
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButtonFooter: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default StudentDetailModal;

