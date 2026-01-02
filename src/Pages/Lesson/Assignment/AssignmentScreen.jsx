import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import lessonService from '../../../Services/lessonService';
import Toast from '../../../Components/Common/Toast';

const AssignmentScreen = ({ route, navigation }) => {
  const { moduleId, moduleName, lessonId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [essay, setEssay] = useState(null);
  const [content, setContent] = useState('');
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    loadAssignment();
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      // Load module để lấy assignment data
      const moduleResponse = await lessonService.getModuleById(moduleId);
      const moduleData = moduleResponse?.data || moduleResponse;
      
      // Assignment data nằm trong Module
      const assignmentData = {
        title: moduleData?.Name || moduleData?.name,
        description: moduleData?.Description || moduleData?.description,
        minWords: 50, // Default, có thể lấy từ module config
        maxWords: 500,
      };
      
      setEssay(assignmentData);
      
      // TODO: Check if already submitted when backend has assignment submission API
      // For now, just allow new submission
      
    } catch (error) {
      console.error('Error loading assignment:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải bài tập',
        type: 'error',
      });
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung bài làm');
      return;
    }

    const minWords = essay?.MinWords || essay?.minWords || 50;
    if (wordCount < minWords) {
      Alert.alert(
        'Chưa đủ số từ',
        `Bài viết cần tối thiểu ${minWords} từ. Hiện tại: ${wordCount} từ.`
      );
      return;
    }

    Alert.alert(
      'Xác nhận nộp bài',
      'Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể chỉnh sửa.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Nộp bài', onPress: submitAssignment },
      ]
    );
  };

  const submitAssignment = async () => {
    try {
      setSubmitting(true);
      
      // Mark module as completed (assignment submitted)
      await lessonService.startModule(moduleId);
      
      setToast({
        visible: true,
        message: '✅ Đã nộp bài thành công!',
        type: 'success',
      });
      
      // Save content locally or send to backend when API available
      console.log('Assignment content:', content);
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể nộp bài',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssignmentOld = async () => {
    try {
      setSubmitting(true);
      await essayService.submitEssay(moduleId, content);
      
      setToast({
        visible: true,
        message: 'Đã nộp bài thành công!',
        type: 'success',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài tập...</Text>
      </View>
    );
  }

  const title = essay?.Title || essay?.title || moduleName || 'Bài tập';
  const description = essay?.Description || essay?.description || '';
  const minWords = essay?.MinWords || essay?.minWords || 50;
  const maxScore = essay?.MaxScore || essay?.maxScore || 10;
  const deadline = essay?.Deadline || essay?.deadline;
  const isSubmitted = !!submission;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <LinearGradient
        colors={['#EC4899', '#DB2777']}
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Assignment Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="document-text" size={scale(20)} color={colors.primary} />
              <Text style={styles.infoLabel}>Tối thiểu</Text>
              <Text style={styles.infoValue}>{minWords} từ</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="star" size={scale(20)} color="#F59E0B" />
              <Text style={styles.infoLabel}>Điểm tối đa</Text>
              <Text style={styles.infoValue}>{maxScore} điểm</Text>
            </View>
            {deadline && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={scale(20)} color="#EF4444" />
                  <Text style={styles.infoLabel}>Hạn nộp</Text>
                  <Text style={styles.infoValue}>
                    {new Date(deadline).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Description */}
        {description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>📋 Mô tả bài tập</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        )}

        {/* Submission Status */}
        {isSubmitted && (
          <View style={styles.submittedBanner}>
            <Ionicons name="checkmark-circle" size={scale(24)} color="#10B981" />
            <View style={styles.submittedInfo}>
              <Text style={styles.submittedTitle}>Đã nộp bài</Text>
              <Text style={styles.submittedText}>
                Bài làm của bạn đang được giáo viên chấm điểm
              </Text>
            </View>
          </View>
        )}

        {/* Essay Input */}
        <View style={styles.editorCard}>
          <View style={styles.editorHeader}>
            <Text style={styles.sectionTitle}>✍️ Nội dung bài làm</Text>
            <Text style={[
              styles.wordCounter,
              wordCount < minWords && styles.wordCounterWarning
            ]}>
              {wordCount} / {minWords} từ
            </Text>
          </View>
          
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Nhập nội dung bài làm của bạn ở đây..."
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            editable={!isSubmitted}
            textAlignVertical="top"
          />
        </View>

        {/* Submission Info */}
        {isSubmitted && submission && (
          <View style={styles.submissionCard}>
            <Text style={styles.sectionTitle}>📊 Thông tin nộp bài</Text>
            <View style={styles.submissionInfo}>
              <View style={styles.submissionRow}>
                <Text style={styles.submissionLabel}>Thời gian nộp:</Text>
                <Text style={styles.submissionValue}>
                  {new Date(submission.SubmittedAt || submission.submittedAt).toLocaleString('vi-VN')}
                </Text>
              </View>
              {(submission.Score !== null || submission.score !== null) && (
                <View style={styles.submissionRow}>
                  <Text style={styles.submissionLabel}>Điểm số:</Text>
                  <Text style={[styles.submissionValue, styles.scoreValue]}>
                    {submission.Score || submission.score}/{maxScore}
                  </Text>
                </View>
              )}
              {(submission.Feedback || submission.feedback) && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.submissionLabel}>Nhận xét của giáo viên:</Text>
                  <Text style={styles.feedbackText}>
                    {submission.Feedback || submission.feedback}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {!isSubmitted && (
        <View style={styles.footer}>
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
        </View>
      )}
    </KeyboardAvoidingView>
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
    backgroundColor: '#F9FAFB',
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
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: scale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: scale(8),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: verticalScale(4),
  },
  infoValue: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
    marginTop: verticalScale(4),
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(12),
  },
  descriptionText: {
    fontSize: scale(15),
    color: colors.text,
    lineHeight: scale(24),
  },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: verticalScale(16),
  },
  submittedInfo: {
    flex: 1,
    marginLeft: scale(12),
  },
  submittedTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#059669',
    marginBottom: verticalScale(4),
  },
  submittedText: {
    fontSize: scale(14),
    color: '#047857',
  },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  wordCounter: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#10B981',
  },
  wordCounterWarning: {
    color: '#EF4444',
  },
  textInput: {
    minHeight: verticalScale(200),
    fontSize: scale(15),
    color: colors.text,
    lineHeight: scale(24),
    textAlignVertical: 'top',
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  submissionInfo: {
    gap: verticalScale(12),
  },
  submissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  submissionValue: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.text,
  },
  scoreValue: {
    fontSize: scale(18),
    color: '#10B981',
  },
  feedbackContainer: {
    marginTop: verticalScale(8),
    padding: scale(12),
    backgroundColor: '#F9FAFB',
    borderRadius: scale(8),
  },
  feedbackText: {
    fontSize: scale(14),
    color: colors.text,
    lineHeight: scale(22),
    marginTop: verticalScale(8),
  },
  footer: {
    padding: scale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    gap: scale(8),
  },
  submitButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AssignmentScreen;
