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

const ModuleModal = ({ visible, onClose, lessonId, module, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contentType: 1, // 1: Lecture, 2: FlashCard, 3: Assessment
  });
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (module) {
        setFormData({
          name: module.name || module.Name || '',
          description: module.description || module.Description || '',
          contentType: module.contentType || module.ContentType || 1,
        });
        setImage(module.imageUrl || module.ImageUrl ? { uri: module.imageUrl || module.ImageUrl } : null);
      } else {
        setFormData({ name: '', description: '', contentType: 1 });
        setImage(null);
      }
    }
  }, [visible, module]);

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
    if (!formData.name.trim()) {
      Toast.show('Vui lòng nhập tên module', 'error');
      return;
    }

    if (!lessonId) {
      Toast.show('Không tìm thấy ID bài học', 'error');
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
              name: image.fileName || 'module-image.jpg',
              type: image.mimeType || 'image/jpeg',
            },
            'modules',
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
        imageType = 'image/jpeg';
      }

      const payload = {
        Name: formData.name.trim(),
        Description: formData.description.trim() || null,
      };

      if (!module) {
        payload.LessonId = lessonId;
        payload.OrderIndex = 0;
        payload.ContentType = formData.contentType;
      }

      if (imageTempKey) {
        payload.ImageTempKey = imageTempKey;
        payload.ImageType = imageType;
      }

      let response;
      if (module) {
        const moduleId = module.moduleId || module.ModuleId;
        response = await teacherService.updateModule(moduleId, payload);
      } else {
        response = await teacherService.createModule(payload);
      }

      const responseData = getResponseData(response);
      if (responseData && (responseData.success !== false)) {
        Toast.show(module ? 'Cập nhật module thành công' : 'Tạo module thành công', 'success');
        onSuccess();
        onClose();
      } else {
        throw new Error(responseData?.message || responseData?.Message || 'Không thể lưu module');
      }
    } catch (error) {
      const errorMessage = error?.message || error?.Message || 'Không thể lưu module';
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
            <Text style={styles.modalTitle}>{module ? 'Chỉnh sửa Module' : 'Thêm Module mới'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên module *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nhập tên module"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Nhập mô tả module"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Loại nội dung *</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioOption, formData.contentType === 1 && styles.radioOptionActive]}
                  onPress={() => setFormData({ ...formData, contentType: 1 })}
                >
                  <Text style={[styles.radioText, formData.contentType === 1 && styles.radioTextActive]}>
                    Lecture
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioOption, formData.contentType === 2 && styles.radioOptionActive]}
                  onPress={() => setFormData({ ...formData, contentType: 2 })}
                >
                  <Text style={[styles.radioText, formData.contentType === 2 && styles.radioTextActive]}>
                    FlashCard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioOption, formData.contentType === 3 && styles.radioOptionActive]}
                  onPress={() => setFormData({ ...formData, contentType: 3 })}
                >
                  <Text style={[styles.radioText, formData.contentType === 3 && styles.radioTextActive]}>
                    Assessment
                  </Text>
                </TouchableOpacity>
              </View>
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
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  radioOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  radioText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: '700',
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

export default ModuleModal;

