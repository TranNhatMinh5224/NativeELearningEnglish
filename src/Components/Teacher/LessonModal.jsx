import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../Theme/colors';
import teacherService from '../../Services/teacherService';
import fileService from '../../Services/fileService';
import { getResponseData } from '../../Utils/apiHelper';
import Toast from '../Common/Toast';

const LessonModal = ({ visible, onClose, courseId, lesson, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (lesson) {
        setFormData({
          title: lesson.title || lesson.Title || '',
          description: lesson.description || lesson.Description || '',
        });
        setImage(lesson.imageUrl || lesson.ImageUrl ? { uri: lesson.imageUrl || lesson.ImageUrl } : null);
      } else {
        setFormData({ title: '', description: '' });
        setImage(null);
      }
    }
  }, [visible, lesson]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Toast.show('Không thể chọn ảnh', 'error');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Toast.show('Vui lòng nhập tiêu đề bài học', 'error');
      return;
    }

    try {
      setSaving(true);
      let imageTempKey = null;
      let imageType = null;

      if (image && image.uri && !image.uri.startsWith('http')) {
        setUploading(true);
        try {
          const uploadResponse = await fileService.uploadTempFile(
            {
              uri: image.uri,
              name: image.fileName || 'lesson-image.jpg',
              type: image.mimeType || 'image/jpeg',
            },
            'lessons',
            'temp'
          );
          const uploadData = getResponseData(uploadResponse);
          imageTempKey = uploadData.tempKey || uploadData.TempKey || uploadData.key || uploadData.Key;
          imageType = uploadData.imageType || uploadData.ImageType || image.mimeType || 'image/jpeg';
        } catch (uploadError) {
          Toast.show('Không thể tải ảnh lên', 'error');
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      } else if (image && image.uri && image.uri.startsWith('http')) {
        // Existing image URL, no need to upload
        imageType = 'image/jpeg';
      }

      const payload = {
        Title: formData.title.trim(),
        Description: formData.description.trim() || null,
        CourseId: courseId,
      };

      if (imageTempKey) {
        payload.ImageTempKey = imageTempKey;
        payload.ImageType = imageType;
      }

      let response;
      if (lesson) {
        const lessonId = lesson.lessonId || lesson.LessonId;
        response = await teacherService.updateLesson(lessonId, payload);
      } else {
        response = await teacherService.createLesson(payload);
      }

      const responseData = getResponseData(response);
      if (responseData && (responseData.success !== false)) {
        Toast.show(lesson ? 'Cập nhật bài học thành công' : 'Tạo bài học thành công', 'success');
        onSuccess();
        onClose();
      } else {
        throw new Error(responseData?.message || responseData?.Message || 'Không thể lưu bài học');
      }
    } catch (error) {
      const errorMessage = error?.message || error?.Message || 'Không thể lưu bài học';
      Toast.show(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{lesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tiêu đề *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Nhập tiêu đề bài học"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Nhập mô tả bài học"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ảnh bìa</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color={colors.textLight} />
                    <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={saving || uploading}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (saving || uploading) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving || uploading}
            >
              {saving || uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
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
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#FFF',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textLight,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default LessonModal;

