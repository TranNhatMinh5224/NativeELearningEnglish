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
import essayService from '../../../Services/essayService';
import Toast from '../../../Components/Common/Toast';

const EssayScreen = ({ route, navigation }) => {
  const { essayId, essayTitle, moduleId, moduleName, assessmentId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [essay, setEssay] = useState(null);
  const [content, setContent] = useState('');
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    loadEssay();
  }, [essayId]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const loadEssay = async () => {
    try {
      setLoading(true);
      const response = await essayService.getEssayById(essayId);

      // Backend trả về ServiceResponse<T> => Data nằm trong Data/Data
      const essayWrapper = response || {};
      const essayData =
        essayWrapper?.data ||
        essayWrapper?.Data ||
        essayWrapper;

      setEssay(essayData);
      
      // Check if already submitted
      const statusResponse = await essayService.getSubmissionStatus(essayId);

      const statusWrapper = statusResponse || {};
      const submissionEntity =
        statusWrapper?.data ||
        statusWrapper?.Data ||
        null;

      if (submissionEntity) {
        setSubmission(submissionEntity);
        // Backend uses TextContent for essay body
        setContent(
          submissionEntity?.TextContent ||
          submissionEntity?.textContent ||
          submissionEntity?.Content ||
          submissionEntity?.content ||
          ''
        );
      }
    } catch (error) {
      console.error('❌ Error loading essay:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải bài essay',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung bài làm');
      return;
    }

    const minWords = 50; // Default minimum words
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
        { text: 'Nộp bài', onPress: submitEssay },
      ]
    );
  };

  const submitEssay = async () => {
    try {
      setSubmitting(true);
      
      // Submit essay with correct DTO fields: essayId, textContent
      await essayService.submitEssay(essayId, content);
      
      setToast({
        visible: true,
        message: '✅ Đã nộp bài thành công!',
        type: 'success',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error submitting essay:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể nộp bài',
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
        <Text style={styles.loadingText}>Đang tải bài essay...</Text>
      </View>
    );
  }

  const title = essay?.Title || essay?.title || essayTitle || 'Bài tập Essay';
  const description = essay?.Description || essay?.description || '';
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

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {isSubmitted && (
            <View style={styles.submittedBanner}>
              <Ionicons name="checkmark-circle" size={scale(20)} color="#10B981" />
              <Text style={styles.submittedText}>Đã nộp bài</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={scale(20)} color={colors.textSecondary} />
              <Text style={styles.infoText}>Thời gian: 50 phút</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="star-outline" size={scale(20)} color={colors.textSecondary} />
              <Text style={styles.infoText}>Điểm: 10</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>Nội dung bài làm</Text>
              <Text style={styles.wordCount}>{wordCount} từ</Text>
            </View>
            
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Nhập nội dung bài làm của bạn..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              editable={!isSubmitted}
              textAlignVertical="top"
            />
          </View>

          {!isSubmitted && (
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <LinearGradient
                colors={submitting ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Đang nộp...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={scale(20)} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Nộp bài</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isSubmitted && submission && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Kết quả</Text>
              
              {submission?.Score !== null && submission?.Score !== undefined && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Điểm số:</Text>
                  <Text style={styles.scoreValue}>
                    {submission?.Score || submission?.score || 0}/10
                  </Text>
                </View>
              )}

              {submission?.Feedback && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackLabel}>Nhận xét:</Text>
                  <Text style={styles.feedbackText}>{submission.Feedback}</Text>
                </View>
              )}

              {!submission?.Score && !submission?.Feedback && (
                <Text style={styles.waitingText}>
                  Đang chờ giáo viên chấm điểm...
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: verticalScale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: scale(18),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: scale(8),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(16),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: scale(24),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(12),
  },
  description: {
    fontSize: scale(16),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Regular',
    lineHeight: scale(24),
    marginBottom: verticalScale(16),
  },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  submittedText: {
    fontSize: scale(15),
    fontFamily: 'Quicksand-Bold',
    color: '#10B981',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(16),
    marginBottom: verticalScale(20),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  infoText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    fontFamily: 'Quicksand-Medium',
  },
  inputContainer: {
    marginBottom: verticalScale(20),
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  inputLabel: {
    fontSize: scale(16),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
  },
  wordCount: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Medium',
    color: colors.textSecondary,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: scale(16),
    fontSize: scale(16),
    fontFamily: 'Quicksand-Regular',
    color: colors.text,
    minHeight: verticalScale(300),
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  submitButtonText: {
    fontSize: scale(18),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  resultContainer: {
    marginTop: verticalScale(20),
    padding: scale(16),
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
  },
  resultTitle: {
    fontSize: scale(18),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(12),
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  scoreLabel: {
    fontSize: scale(16),
    fontFamily: 'Quicksand-Medium',
    color: colors.text,
  },
  scoreValue: {
    fontSize: scale(24),
    fontFamily: 'Quicksand-Bold',
    color: colors.primary,
  },
  feedbackContainer: {
    marginTop: verticalScale(12),
  },
  feedbackLabel: {
    fontSize: scale(16),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(6),
  },
  feedbackText: {
    fontSize: scale(15),
    fontFamily: 'Quicksand-Regular',
    color: colors.textSecondary,
    lineHeight: scale(22),
  },
  waitingText: {
    fontSize: scale(15),
    fontFamily: 'Quicksand-Regular',
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default EssayScreen;
