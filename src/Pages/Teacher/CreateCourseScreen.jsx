import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Markdown from 'react-native-markdown-display';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import teacherService from '../../Services/teacherService';
import userService from '../../Services/userService';
import teacherPackageService from '../../Services/teacherPackageService';
import fileService from '../../Services/fileService';
import Toast from '../../Components/Common/Toast';
import { getResponseData } from '../../Utils/apiHelper';

const CreateCourseScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { courseData, isUpdateMode = false } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: courseData?.title || courseData?.Title || '',
    description: courseData?.description || courseData?.Description || '',
    maxStudent: courseData?.maxStudent || courseData?.MaxStudent || 0,
  });
  
  const [image, setImage] = useState(courseData?.imageUrl || courseData?.ImageUrl ? { uri: courseData.imageUrl || courseData.ImageUrl } : null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (isUpdateMode && courseData) {
      // If update mode, don't load teacher info (maxStudent already set from courseData)
      setFetchingProfile(false);
    } else {
      loadTeacherInfo();
    }
  }, []);

  const loadTeacherInfo = async () => {
    try {
      setFetchingProfile(true);
      
      // 1. Lấy user profile để có packageLevel
      const profileResponse = await userService.getProfile();
      const user = getResponseData(profileResponse);
      const packageLevel = user?.teacherSubscription?.packageLevel || user?.TeacherSubscription?.PackageLevel;
      
      if (!packageLevel) {
        setFormData(prev => ({ ...prev, maxStudent: 0 }));
        return;
      }

      // 2. Lấy danh sách teacher packages
      const packagesResponse = await teacherPackageService.getTeacherPackages();
      const packagesData = getResponseData(packagesResponse);
      const packages = packagesData?.data || packagesData || [];

      // 3. Tìm package match với packageLevel của user
      const matchedPackage = packages.find((pkg) => {
        const pkgName = pkg.packageName || pkg.PackageName || '';
        const pkgNameLower = pkgName.toLowerCase();
        const userLevelLower = packageLevel.toLowerCase().trim();
        return pkgNameLower.includes(userLevelLower);
      });

      if (matchedPackage) {
        const maxStudents = matchedPackage.maxStudents || matchedPackage.MaxStudents || 0;
        setFormData(prev => ({ ...prev, maxStudent: maxStudents }));
      } else {
        setFormData(prev => ({ ...prev, maxStudent: 0 }));
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, maxStudent: 0 }));
    } finally {
      setFetchingProfile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để tải ảnh bìa.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
      }
    } catch (error) {
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!formData.title.trim()) {
      setToast({ visible: true, message: 'Vui lòng nhập tên lớp học', type: 'warning' });
      return;
    }

    if (!formData.description.trim()) {
      setToast({ visible: true, message: 'Vui lòng nhập mô tả lớp học', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      let imageTempKey = null;
      let imageType = null;

      // Upload ảnh lên temp storage với bucket 'courses' (chỉ nếu có ảnh mới)
      if (image && image.uri && !image.uri.startsWith('http')) {
        const uploadRes = await fileService.uploadTempFile(
          {
            uri: image.uri,
            name: image.fileName || 'course-cover.jpg',
            type: image.mimeType || 'image/jpeg'
          },
          'courses',  // bucket name
          'temp'      // temp folder
        );
        
        const uploadData = getResponseData(uploadRes);
        // Backend trả về PascalCase: TempKey, ImageType
        imageTempKey = uploadData?.tempKey || uploadData?.TempKey || uploadData?.fileKey || uploadData?.FileKey;
        imageType = uploadData?.imageType || uploadData?.ImageType || image.mimeType || 'image/jpeg';
        
        if (!imageTempKey) {
          throw new Error('Không nhận được TempKey từ server sau khi upload ảnh');
        }
      }

      const courseId = courseData?.courseId || courseData?.CourseId;
      const payload = {
        Title: formData.title.trim(),
        Description: formData.description.trim(),
        MaxStudent: formData.maxStudent || 0,
        Type: 2, // CourseType.Teacher
        ...(imageTempKey && { ImageTempKey: imageTempKey }),
        ...(imageType && { ImageType: imageType })
      };

      if (isUpdateMode && courseId) {
        await teacherService.updateCourse(courseId, payload);
        Alert.alert(
          'Thành công',
          'Lớp học đã được cập nhật thành công!',
          [{ text: 'OK', onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}]
        );
      } else {
        await teacherService.createCourse(payload);
        Alert.alert(
          'Thành công',
          'Lớp học đã được tạo thành công!',
          [{ text: 'OK', onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}]
        );
      }

    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      setToast({ visible: true, message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
      return (
          <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang kiểm tra quyền hạn...</Text>
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
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isUpdateMode ? 'Cập nhật lớp học' : 'Tạo lớp học mới'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
        
        {/* Image Upload */}
        <TouchableOpacity style={styles.imageUpload} onPress={handlePickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={48} color={colors.textLight} />
              <Text style={styles.uploadText}>Tải ảnh bìa lớp học</Text>
            </View>
          )}
          <View style={styles.editIcon}>
            <Ionicons name="camera" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tên lớp học <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Lớp IELTS Intensive 6.5+"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Học viên tối đa (Theo gói dịch vụ)</Text>
          <View style={[styles.input, styles.disabledInput]}>
            <Text style={styles.disabledInputText}>{formData.maxStudent} học viên</Text>
            <Ionicons name="lock-closed" size={16} color={colors.textLight} />
          </View>
          <Text style={styles.hint}>Số lượng học viên tối đa được quy định bởi gói giáo viên bạn đang dùng.</Text>
        </View>

        {/* Description with Preview Toggle */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Mô tả lớp học</Text>
            <TouchableOpacity onPress={() => setPreviewMode(!previewMode)}>
                <Text style={styles.previewLink}>
                    {previewMode ? 'Sửa (Edit)' : 'Xem trước (Preview)'}
                </Text>
            </TouchableOpacity>
          </View>
          
          {previewMode ? (
            <ScrollView style={styles.previewBox} nestedScrollEnabled>
                {formData.description.trim() ? (
                  <Markdown style={markdownStyles}>
                    {formData.description}
                  </Markdown>
                ) : (
                  <Text style={styles.previewTextEmpty}>
                    Chưa có nội dung mô tả
                  </Text>
                )}
            </ScrollView>
          ) : (
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Giới thiệu về mục tiêu, lộ trình của lớp học này... (Hỗ trợ Markdown)"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
            style={[styles.createButton, loading && styles.disabledButton]} 
            onPress={handleCreate}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.createButtonText}>
                  {isUpdateMode ? 'Cập nhật lớp học' : 'Tạo lớp học ngay'}
                </Text>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageUpload: {
    width: '100%',
    height: verticalScale(180),
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    color: colors.textLight,
    fontWeight: '500',
  },
  editIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledInputText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 150,
  },
  previewBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    maxHeight: 300,
  },
  previewText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  previewTextEmpty: {
    fontSize: 16,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

// Markdown styles
const markdownStyles = {
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  heading4: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 8,
    marginBottom: 8,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  list_item: {
    marginTop: 4,
    marginBottom: 4,
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginTop: 16,
    marginBottom: 16,
  },
};

export default CreateCourseScreen;