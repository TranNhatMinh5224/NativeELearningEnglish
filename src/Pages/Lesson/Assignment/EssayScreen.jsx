import React, { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import essayService from '../../../Services/essayService';
import fileService from '../../../Services/fileService';
import Toast from '../../../Components/Common/Toast';
import { getResponseData } from '../../../Utils/apiHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EssayScreen = ({ route, navigation }) => {
  const { essayId, essayTitle, moduleId, moduleName, assessmentId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [essay, setEssay] = useState(null);
  const [content, setContent] = useState('');
  const [submission, setSubmission] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [charCount, setCharCount] = useState(0);

  // File attachment states
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachmentTempKey, setAttachmentTempKey] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState(null);
  const [existingAttachmentFileName, setExistingAttachmentFileName] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null); // Lưu tên file khi upload để hiển thị sau

  // Audio states
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  useEffect(() => {
    loadEssay();
    return () => {
      // Cleanup audio on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [essayId]);

  useEffect(() => {
    // Đếm số ký tự (không tính khoảng trắng đầu/cuối)
    const charCount = content.trim().length;
    setCharCount(charCount);
  }, [content]);

  const loadEssay = async () => {
    try {
      setLoading(true);
      const response = await essayService.getEssayById(essayId);
      const essayData = getResponseData(response);
      setEssay(essayData);
      
      // Check if already submitted
      try {
        const statusResponse = await essayService.getSubmissionStatus(essayId);
        const statusData = getResponseData(statusResponse);
        
        if (statusData) {
          const subId = statusData.SubmissionId || statusData.submissionId;
          if (subId) {
            // Load full submission details
            const submissionResponse = await essayService.getSubmission(subId);
            const submissionData = getResponseData(submissionResponse);
            
            if (submissionData) {
              setSubmission(submissionData);
              setSubmissionId(subId);
              setContent(
                submissionData?.TextContent ||
                submissionData?.textContent ||
                submissionData?.Content ||
                submissionData?.content ||
                ''
              );
              
              // Load existing attachment if any
              const attachmentUrl = submissionData?.AttachmentUrl || submissionData?.attachmentUrl;
              if (attachmentUrl) {
                setExistingAttachmentUrl(attachmentUrl);
                
                // Thử lấy tên file đã lưu từ AsyncStorage trước
                let savedFileName = null;
                try {
                  const storageKey = `essay_file_name_${subId}`;
                  savedFileName = await AsyncStorage.getItem(storageKey);
                } catch (error) {
                  console.error('Error reading file name from storage:', error);
                }
                
                // Extract file name from URL
                let extractedFileName = null;
                try {
                  const urlParts = attachmentUrl.split('/');
                  const fileName = urlParts[urlParts.length - 1];
                  // Remove query parameters if any
                  const cleanFileName = fileName.split('?')[0];
                  // Decode URL encoding if any
                  const decodedFileName = decodeURIComponent(cleanFileName);
                  
                  // Chỉ dùng tên file từ URL nếu nó không phải là UUID/hash (có extension hoặc không phải dãy số)
                  // UUID thường có format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedFileName);
                  const hasExtension = /\.(pdf|doc|docx|txt|rtf)$/i.test(decodedFileName);
                  
                  if (!isUUID && (hasExtension || decodedFileName.length > 20)) {
                    extractedFileName = decodedFileName;
                  }
                } catch (error) {
                  console.error('Error extracting file name from URL:', error);
                }
                
                // Ưu tiên: savedFileName > extractedFileName > uploadedFileName > fallback
                const finalFileName = savedFileName || extractedFileName || uploadedFileName || 'File đính kèm';
                setExistingAttachmentFileName(finalFileName);
              }
            }
          }
        }
      } catch (statusError) {
        // No submission exists yet, that's fine
        console.log('ℹ️ No existing submission found');
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

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          Alert.alert('Lỗi', 'File quá lớn. Kích thước tối đa là 10MB.');
          return;
        }

        setSelectedFile(file);
        await handleUploadFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setToast({
        visible: true,
        message: 'Không thể chọn file. Vui lòng thử lại.',
        type: 'error',
      });
    }
  };

  const handleUploadFile = async (file) => {
    if (!file) return;

    try {
      setUploadingFile(true);
      
      // Prepare file for upload
      const fileUri = file.uri;
      const fileName = file.name || 'document.pdf';
      const fileType = file.mimeType || 'application/pdf';

      const fileForUpload = {
        uri: fileUri,
        name: fileName,
        type: fileType,
      };

      // Upload to temp storage
      const uploadResponse = await fileService.uploadTempFile(
        fileForUpload,
        'essay-attachments',
        'temp'
      );

      const uploadData = getResponseData(uploadResponse);
      
      if (uploadData) {
        const tempKey = uploadData.TempKey || uploadData.tempKey;
        const imageType = uploadData.ImageType || uploadData.imageType || fileType;

        if (!tempKey) {
          throw new Error('Không nhận được TempKey từ server');
        }

        setAttachmentTempKey(tempKey);
        setAttachmentType(imageType);
        // Lưu tên file để hiển thị sau
        setUploadedFileName(fileName);
        
        setToast({
          visible: true,
          message: 'Upload file thành công!',
          type: 'success',
        });
      } else {
        throw new Error('Không thể upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể upload file. Vui lòng thử lại.',
        type: 'error',
      });
      setSelectedFile(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAttachmentTempKey(null);
    setAttachmentType(null);
    setExistingAttachmentUrl(null);
    setExistingAttachmentFileName(null);
  };

  const handlePlayAudio = async () => {
    const audioUrl = essay?.AudioUrl || essay?.audioUrl;
    if (!audioUrl) {
      setToast({
        visible: true,
        message: 'Không có audio cho bài essay này',
        type: 'error',
      });
      return;
    }

    try {
      if (isPlaying && sound) {
        // Pause
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        // Resume
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Load and play
        setAudioLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });

        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setToast({
        visible: true,
        message: 'Không thể phát âm thanh. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setAudioLoading(false);
    }
  };

  const handleSubmit = () => {
    // Kiểm tra xem có file đính kèm không
    const hasAttachment = attachmentTempKey || existingAttachmentUrl || selectedFile;
    
    // Nếu không có file đính kèm, thì phải có nội dung text
    if (!hasAttachment) {
      if (!content.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập nội dung bài làm hoặc chọn file đính kèm');
        return;
      }

      // Kiểm tra minWords (số ký tự) từ backend nếu có
      const minChars = essay?.MinWords || essay?.minWords; // Backend trả về MinWords nhưng thực chất là số ký tự
      if (minChars && charCount < minChars) {
        Alert.alert(
          'Chưa đủ số ký tự',
          `Bài viết cần tối thiểu ${minChars} ký tự. Hiện tại: ${charCount} ký tự.`
        );
        return;
      }
    }
    // Nếu có file đính kèm, không cần validate content và minWords, có thể nộp luôn

    if (submission) {
      // Update existing submission
      Alert.alert(
        'Xác nhận cập nhật',
        'Bạn có chắc muốn cập nhật bài làm?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Cập nhật', onPress: updateEssay },
        ]
      );
    } else {
      // Submit new submission
      Alert.alert(
        'Xác nhận nộp bài',
        'Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể chỉnh sửa.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nộp bài', onPress: submitEssay },
        ]
      );
    }
  };

  const submitEssay = async () => {
    try {
      setSubmitting(true);
      
      // If file is selected but not uploaded, upload it first
      if (selectedFile && !attachmentTempKey) {
        await handleUploadFile(selectedFile);
        // Wait a bit for upload to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Cho phép content rỗng nếu có file đính kèm
      const textContent = content.trim() || '';
      const submitResponse = await essayService.submitEssay(essayId, textContent, attachmentTempKey, attachmentType);
      
      // Lưu tên file để hiển thị sau khi reload (nếu có file)
      if (uploadedFileName && attachmentTempKey) {
        try {
          // Lấy submissionId từ response để lưu tên file
          const responseData = getResponseData(submitResponse);
          const newSubmissionId = responseData?.SubmissionId || responseData?.submissionId;
          if (newSubmissionId) {
            const storageKey = `essay_file_name_${newSubmissionId}`;
            await AsyncStorage.setItem(storageKey, uploadedFileName);
          }
        } catch (error) {
          console.error('Error saving file name to storage:', error);
        }
      }
      
      setToast({
        visible: true,
        message: '✅ Đã nộp bài thành công!',
        type: 'success',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      // Parse validation errors from backend
      let errorMessage = 'Không thể nộp bài';
      
      if (error?.errors) {
        // Backend validation errors format: { errors: { FieldName: ["Error message"] } }
        const errorFields = Object.keys(error.errors);
        if (errorFields.length > 0) {
          const firstField = errorFields[0];
          const fieldErrors = error.errors[firstField];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            errorMessage = fieldErrors[0];
          } else if (typeof fieldErrors === 'string') {
            errorMessage = fieldErrors;
          }
        }
      } else if (error?.response?.data?.errors) {
        // Handle axios error response format
        const errorFields = Object.keys(error.response.data.errors);
        if (errorFields.length > 0) {
          const firstField = errorFields[0];
          const fieldErrors = error.response.data.errors[firstField];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            errorMessage = fieldErrors[0];
          } else if (typeof fieldErrors === 'string') {
            errorMessage = fieldErrors;
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateEssay = async () => {
    if (!submissionId) return;

    try {
      setUpdating(true);
      
      // If new file is selected but not uploaded, upload it first
      if (selectedFile && !attachmentTempKey) {
        await handleUploadFile(selectedFile);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Xác định xem có cần xóa attachment cũ không
      // Nếu có existingAttachmentUrl nhưng không có file mới được chọn/upload, thì xóa attachment cũ
      const removeAttachment = !!(existingAttachmentUrl && !attachmentTempKey && !selectedFile);
      
      // Cho phép content rỗng nếu có file đính kèm
      const textContent = content.trim() || '';
      await essayService.updateSubmission(
        submissionId,
        textContent,
        attachmentTempKey,
        attachmentType,
        removeAttachment
      );
      
      // Nếu có file mới được upload, lưu tên file vào AsyncStorage để hiển thị sau khi reload
      if (uploadedFileName && attachmentTempKey) {
        try {
          const storageKey = `essay_file_name_${submissionId}`;
          await AsyncStorage.setItem(storageKey, uploadedFileName);
          // Cập nhật state ngay để hiển thị
          setExistingAttachmentFileName(uploadedFileName);
        } catch (error) {
          console.error('Error saving file name to storage:', error);
        }
      }
      
      setToast({
        visible: true,
        message: '✅ Đã cập nhật bài thành công!',
        type: 'success',
      });
      
      // Reload submission
      setTimeout(() => {
        loadEssay();
      }, 1000);
    } catch (error) {
      // Parse validation errors from backend
      let errorMessage = 'Không thể cập nhật bài';
      
      if (error?.errors) {
        // Backend validation errors format: { errors: { FieldName: ["Error message"] } }
        const errorFields = Object.keys(error.errors);
        if (errorFields.length > 0) {
          const firstField = errorFields[0];
          const fieldErrors = error.errors[firstField];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            errorMessage = fieldErrors[0];
          } else if (typeof fieldErrors === 'string') {
            errorMessage = fieldErrors;
          }
        }
      } else if (error?.response?.data?.errors) {
        // Handle axios error response format
        const errorFields = Object.keys(error.response.data.errors);
        if (errorFields.length > 0) {
          const firstField = errorFields[0];
          const fieldErrors = error.response.data.errors[firstField];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            errorMessage = fieldErrors[0];
          } else if (typeof fieldErrors === 'string') {
            errorMessage = fieldErrors;
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!submissionId) return;

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa bài làm? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: deleteEssay },
      ]
    );
  };

  const deleteEssay = async () => {
    if (!submissionId) return;

    try {
      setDeleting(true);
      await essayService.deleteSubmission(submissionId);
      
      setToast({
        visible: true,
        message: '✅ Đã xóa bài thành công!',
        type: 'success',
      });
      
      // Reset form
      setSubmission(null);
      setSubmissionId(null);
      setContent('');
      setSelectedFile(null);
      setAttachmentTempKey(null);
      setAttachmentType(null);
      setExistingAttachmentUrl(null);
      setExistingAttachmentFileName(null);
      
      setTimeout(() => {
        loadEssay();
      }, 1000);
    } catch (error) {
      console.error('Error deleting essay:', error);
      setToast({
        visible: true,
        message: error?.message || 'Không thể xóa bài',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải bài essay...</Text>
      </View>
    );
  }

  const title = essay?.Title || essay?.title || essayTitle || '';
  const description = essay?.Description || essay?.description || '';
  const isSubmitted = !!submission;
  const canEdit = !isSubmitted || (isSubmitted && !submission?.Score && !submission?.score); // Can edit if not graded yet

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
          {title ? (
            <Text style={styles.cardTitle}>{title}</Text>
          ) : null}
          
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {/* Audio Player */}
          {(essay?.AudioUrl || essay?.audioUrl) && (
            <TouchableOpacity
              style={styles.audioContainer}
              onPress={handlePlayAudio}
              disabled={audioLoading}
            >
              <LinearGradient
                colors={isPlaying ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.audioButton}
              >
                {audioLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={scale(24)}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.audioButtonText}>
                  {isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isSubmitted && (
            <View style={styles.submittedBanner}>
              <Ionicons name="checkmark-circle" size={scale(20)} color="#10B981" />
              <Text style={styles.submittedText}>Đã nộp bài</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            {(essay?.TimeLimit || essay?.timeLimit) && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={scale(20)} color={colors.textSecondary} />
                <Text style={styles.infoText}>Thời gian: {essay.TimeLimit || essay.timeLimit}</Text>
              </View>
            )}
            {(essay?.TotalPoints || essay?.totalPoints) && (
              <View style={styles.infoItem}>
                <Ionicons name="star-outline" size={scale(20)} color={colors.textSecondary} />
                <Text style={styles.infoText}>Điểm: {essay.TotalPoints || essay.totalPoints}</Text>
              </View>
            )}
            {(essay?.MinWords || essay?.minWords) && (
              <View style={styles.infoItem}>
                <Ionicons name="document-text-outline" size={scale(20)} color={colors.textSecondary} />
                <Text style={styles.infoText}>Tối thiểu: {essay.MinWords || essay.minWords} ký tự</Text>
              </View>
            )}
          </View>

          {/* File Attachment Section */}
          {canEdit && (
            <View style={styles.attachmentContainer}>
              <Text style={styles.attachmentLabel}>File đính kèm (tùy chọn)</Text>
              
              {existingAttachmentUrl && !selectedFile && (
                <View style={styles.existingFileContainer}>
                  <Ionicons name="document" size={scale(20)} color={colors.primary} />
                  <View style={styles.existingFileInfo}>
                    <Text style={styles.existingFileName} numberOfLines={1}>
                      {existingAttachmentFileName || 'File đính kèm'}
                    </Text>
                    
                  </View>
                  <TouchableOpacity onPress={handleRemoveFile} style={styles.removeFileButton}>
                    <Ionicons name="close-circle" size={scale(20)} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}

              {selectedFile && (
                <View style={styles.selectedFileContainer}>
                  <Ionicons name="document" size={scale(20)} color={colors.primary} />
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    {selectedFile.size && (
                      <Text style={styles.selectedFileSize}>
                        {formatFileSize(selectedFile.size)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleRemoveFile} style={styles.removeFileButton}>
                    <Ionicons name="close-circle" size={scale(20)} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}

              {!existingAttachmentUrl && !selectedFile && (
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={handleFileSelect}
                  disabled={uploadingFile}
                >
                  <Ionicons
                    name="attach"
                    size={scale(20)}
                    color={uploadingFile ? colors.textSecondary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.attachButtonText,
                      uploadingFile && styles.attachButtonTextDisabled,
                    ]}
                  >
                    {uploadingFile ? 'Đang upload...' : 'Chọn file đính kèm'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>Nội dung bài làm</Text>
              <Text style={styles.charCount}>{charCount} ký tự</Text>
            </View>
            
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Nhập nội dung bài làm của bạn..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              editable={canEdit}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          {canEdit && (
            <View style={styles.actionButtonsContainer}>
              {submission ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.updateButton, (updating || submitting) && styles.actionButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={updating || submitting}
                  >
                    <LinearGradient
                      colors={(updating || submitting) ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      {updating ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Đang cập nhật...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={scale(20)} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Cập nhật bài</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton, deleting && styles.actionButtonDisabled]}
                    onPress={handleDelete}
                    disabled={deleting}
                  >
                    <LinearGradient
                      colors={deleting ? ['#9CA3AF', '#6B7280'] : ['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      {deleting ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Đang xóa...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="trash" size={scale(20)} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Xóa bài</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton, submitting && styles.actionButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <LinearGradient
                    colors={submitting ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Đang nộp...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="send" size={scale(20)} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Nộp bài</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isSubmitted && submission && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Kết quả</Text>
              
              {submission?.Score !== null && submission?.Score !== undefined && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Điểm số:</Text>
                  <Text style={styles.scoreValue}>
                    {submission?.Score || submission?.score || 0}/{essay?.TotalPoints || essay?.totalPoints || 10}
                  </Text>
                </View>
              )}

              {submission?.Feedback && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackLabel}>Nhận xét:</Text>
                  <Text style={styles.feedbackText}>
                    {submission.Feedback || submission.feedback}
                  </Text>
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
  audioContainer: {
    marginBottom: verticalScale(16),
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    gap: scale(8),
  },
  audioButtonText: {
    fontSize: scale(16),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
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
  attachmentContainer: {
    marginBottom: verticalScale(20),
  },
  attachmentLabel: {
    fontSize: scale(16),
    fontFamily: 'Quicksand-Bold',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  existingFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: scale(12),
    borderRadius: scale(8),
    gap: scale(8),
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: scale(12),
    borderRadius: scale(8),
    gap: scale(8),
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Medium',
    color: colors.text,
  },
  selectedFileSize: {
    fontSize: scale(12),
    fontFamily: 'Quicksand-Regular',
    color: colors.textSecondary,
    marginTop: scale(2),
  },
  existingFileInfo: {
    flex: 1,
  },
  existingFileName: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Medium',
    color: colors.text,
  },
  removeFileButton: {
    padding: scale(4),
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: scale(12),
    borderRadius: scale(8),
    gap: scale(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  attachButtonText: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Medium',
    color: colors.primary,
  },
  attachButtonTextDisabled: {
    color: colors.textSecondary,
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
  charCount: {
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
  actionButtonsContainer: {
    gap: scale(12),
    marginBottom: verticalScale(20),
  },
  actionButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  actionButtonText: {
    fontSize: scale(18),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  submitButton: {
    // Styles inherited from actionButton
  },
  updateButton: {
    // Styles inherited from actionButton
  },
  deleteButton: {
    // Styles inherited from actionButton
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
