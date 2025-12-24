import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import authService from '../../Services/authService';
import userService from '../../Services/userService';
import Toast from '../../Components/Common/Toast';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeInfo, setShowChangeInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Change Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Change Info Form
  const [infoData, setInfoData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [infoErrors, setInfoErrors] = useState({});

  useEffect(() => {
    // Load từ AsyncStorage trước để hiển thị ngay
    const loadInitialData = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    loadInitialData();
    // Sau đó load từ API để cập nhật
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Không set loading = true để không block UI, vì đã có data từ AsyncStorage
      const response = await userService.getProfile();
      
      // axiosClient interceptor trả về response.data, nên response đã là data rồi
      // Backend trả về ServiceResponse: { success, data, message, statusCode }
      // Nhưng interceptor đã lấy response.data, nên response có thể là:
      // - { success, data, message } nếu backend trả về ServiceResponse
      // - User object trực tiếp nếu backend trả về user
      
      let userData = null;
      
      if (response && response.data) {
        // Nếu response có structure { success, data, message }
        userData = response.data;
      } else if (response && (response.firstName || response.email || response.id || response.userId)) {
        // Nếu response là user object trực tiếp
        userData = response;
      }
      
      if (userData) {
        setUser(userData);
        // Cập nhật AsyncStorage để đồng bộ
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
      // Nếu không có data từ API, giữ nguyên data từ AsyncStorage đã load ở useEffect
    } catch (error) {
      console.error('Load profile error:', error);
      // Không cần fallback vì đã load từ AsyncStorage ở useEffect rồi
      // Chỉ log error để debug
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.replace('Welcome');
        },
      },
    ]);
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setSaving(true);
    try {
      await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setToast({
        visible: true,
        message: 'Đổi mật khẩu thành công!',
        type: 'success',
      });
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Đổi mật khẩu thất bại';
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const validateInfoForm = () => {
    const errors = {};
    if (!infoData.firstName.trim()) {
      errors.firstName = 'Vui lòng nhập tên';
    }
    if (!infoData.lastName.trim()) {
      errors.lastName = 'Vui lòng nhập họ';
    }
    if (!infoData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^0[0-9]{9}$/.test(infoData.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangeInfo = async () => {
    if (!validateInfoForm()) return;

    setSaving(true);
    try {
      const response = await userService.updateProfile({
        FirstName: infoData.firstName,
        LastName: infoData.lastName,
        PhoneNumber: infoData.phone,
      });
      
      // Backend trả về ServiceResponse với structure: { success, data, message, statusCode }
      const updatedUser = response.data || response;
      if (updatedUser) {
        setUser(updatedUser);
        setToast({
          visible: true,
          message: 'Cập nhật thông tin thành công!',
          type: 'success',
        });
        setShowChangeInfo(false);
        // Reload profile để đảm bảo đồng bộ
        await loadProfile();
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Parse validation errors from backend
      let errorMessage = 'Cập nhật thông tin thất bại';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Check for validation errors (400 Bad Request with errors object)
        if (errorData.errors && typeof errorData.errors === 'object') {
          const validationErrors = [];
          
          // Extract all validation error messages
          Object.keys(errorData.errors).forEach((field) => {
            const fieldErrors = errorData.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((msg) => {
                // Map field names to Vietnamese
                const fieldName = field === 'PhoneNumber' ? 'Số điện thoại' : 
                                 field === 'FirstName' ? 'Tên' : 
                                 field === 'LastName' ? 'Họ' : field;
                validationErrors.push(`${fieldName}: ${msg}`);
              });
            }
          });
          
          if (validationErrors.length > 0) {
            errorMessage = validationErrors.join('\n');
          } else {
            errorMessage = errorData.message || errorData.title || errorMessage;
          }
        } else {
          errorMessage = errorData.message || errorData.title || errorMessage;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with 4 decorative images */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.decorativeImages}>
            <View style={styles.decorativeImage}>
              <Ionicons name="book" size={scale(30)} color="rgba(255,255,255,0.3)" />
            </View>
            <View style={styles.decorativeImage}>
              <Ionicons name="school" size={scale(30)} color="rgba(255,255,255,0.3)" />
            </View>
            <View style={styles.decorativeImage}>
              <Ionicons name="trophy" size={scale(30)} color="rgba(255,255,255,0.3)" />
            </View>
            <View style={styles.decorativeImage}>
              <Ionicons name="star" size={scale(30)} color="rgba(255,255,255,0.3)" />
            </View>
          </View>
        </LinearGradient>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)?.toUpperCase() || 
                   user?.lastName?.charAt(0)?.toUpperCase() || 
                   'U'}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="pencil" size={scale(16)} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          {/* Upgrade to Pro Button */}
          <TouchableOpacity
            style={styles.upgradeProButton}
            onPress={() => navigation.navigate('Pro')}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeProButtonGradient}
            >
              <Ionicons name="star" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.upgradeProButtonText}>Nâng cấp lên Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* User Info Form - Display only (Read-only) */}
        <View style={styles.formSection}>
          <View style={styles.formRow}>
            <Text style={styles.label}>Last name:</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputText}>
                {user?.lastName || 'Chưa có thông tin'}
              </Text>
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.label}>First name:</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputText}>
                {user?.firstName || 'Chưa có thông tin'}
              </Text>
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.label}>Email:</Text>
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Text style={[styles.inputText, styles.disabledTextColor]}>
                  {user?.email || 'Chưa có thông tin'}
                </Text>
              </View>
              <Text style={styles.disabledText}>Email không thể thay đổi</Text>
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.label}>Số điện thoại:</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputText}>
                {user?.phoneNumber || user?.phone || 'Chưa có thông tin'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.changePasswordButton]}
            onPress={() => setShowChangePassword(true)}
          >
            <Text style={styles.actionButtonText}>Đổi mật khẩu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.changeInfoButton]}
            onPress={() => {
              // Load current user data into form when opening modal
              if (user) {
                setInfoData({
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  email: user.email || '',
                  phone: user.phoneNumber || user.phone || '',
                });
              }
              setShowChangeInfo(true);
            }}
          >
            <Text style={styles.actionButtonText}>Thay đổi thông tin</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={scale(20)} color={colors.error} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChangePassword(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thay đổi mật khẩu</Text>
              <TouchableOpacity
                onPress={() => setShowChangePassword(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={scale(24)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Mật khẩu hiện tại:</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor={colors.textLight}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => {
                    setPasswordData({ ...passwordData, currentPassword: text });
                    setPasswordErrors({ ...passwordErrors, currentPassword: null });
                  }}
                  secureTextEntry={!showPasswords.current}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                  }
                >
                  <Ionicons
                    name={showPasswords.current ? 'eye-off' : 'eye'}
                    size={scale(22)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordErrors.currentPassword && (
                <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
              )}
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Mật khẩu mới:</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor={colors.textLight}
                  value={passwordData.newPassword}
                  onChangeText={(text) => {
                    setPasswordData({ ...passwordData, newPassword: text });
                    setPasswordErrors({ ...passwordErrors, newPassword: null });
                  }}
                  secureTextEntry={!showPasswords.new}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                  }
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye-off' : 'eye'}
                    size={scale(22)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordErrors.newPassword && (
                <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
              )}
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Nhập lại:</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor={colors.textLight}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => {
                    setPasswordData({ ...passwordData, confirmPassword: text });
                    setPasswordErrors({ ...passwordErrors, confirmPassword: null });
                  }}
                  secureTextEntry={!showPasswords.confirm}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                  }
                >
                  <Ionicons
                    name={showPasswords.confirm ? 'eye-off' : 'eye'}
                    size={scale(22)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordErrors.confirmPassword && (
                <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowChangePassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setPasswordErrors({});
                }}
              >
                <Text style={styles.modalButtonText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Change Info Modal */}
      <Modal
        visible={showChangeInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangeInfo(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChangeInfo(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thay đổi thông tin</Text>
              <TouchableOpacity
                onPress={() => setShowChangeInfo(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={scale(24)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Last name:</Text>
              <TextInput
                style={[styles.modalInput, infoErrors.lastName && styles.inputError]}
                placeholder="Nhập họ"
                placeholderTextColor={colors.textLight}
                value={infoData.lastName}
                onChangeText={(text) => {
                  setInfoData({ ...infoData, lastName: text });
                  setInfoErrors({ ...infoErrors, lastName: null });
                }}
              />
              {infoErrors.lastName && (
                <Text style={styles.errorText}>{infoErrors.lastName}</Text>
              )}
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>First name:</Text>
              <TextInput
                style={[styles.modalInput, infoErrors.firstName && styles.inputError]}
                placeholder="Nhập tên"
                placeholderTextColor={colors.textLight}
                value={infoData.firstName}
                onChangeText={(text) => {
                  setInfoData({ ...infoData, firstName: text });
                  setInfoErrors({ ...infoErrors, firstName: null });
                }}
              />
              {infoErrors.firstName && (
                <Text style={styles.errorText}>{infoErrors.firstName}</Text>
              )}
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Email:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.inputDisabled]}
                  value={infoData.email}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor={colors.textLight}
                />
                <Text style={styles.disabledText}>Email không thể thay đổi</Text>
              </View>
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Số điện thoại:</Text>
              <TextInput
                style={[styles.modalInput, infoErrors.phone && styles.inputError]}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={colors.textLight}
                value={infoData.phone}
                onChangeText={(text) => {
                  setInfoData({ ...infoData, phone: text });
                  setInfoErrors({ ...infoErrors, phone: null });
                }}
                keyboardType="phone-pad"
              />
              {infoErrors.phone && (
                <Text style={styles.errorText}>{infoErrors.phone}</Text>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowChangeInfo(false);
                  setInfoErrors({});
                  loadProfile(); // Reset form
                }}
              >
                <Text style={styles.modalButtonText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangeInfo}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Lưu thông tin</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(30),
    paddingHorizontal: 24,
  },
  decorativeImages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
  },
  decorativeImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -scale(50),
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  upgradeProButton: {
    marginTop: 16,
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  upgradeProButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 4,
  },
  upgradeProButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(60),
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  formSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  formRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: scale(8),
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: scale(8),
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: scale(44),
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 14,
    color: colors.text,
  },
  inputContainer: {
    position: 'relative',
  },
  inputDisabled: {
    backgroundColor: colors.disabled,
  },
  disabledTextColor: {
    color: colors.textSecondary,
  },
  disabledText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordButton: {
    backgroundColor: colors.primary,
  },
  changeInfoButton: {
    backgroundColor: '#06B6D4',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: scale(8),
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  bottomSpacing: {
    height: verticalScale(20),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: scale(16),
    padding: 32,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  modalFormRow: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: scale(8),
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    minHeight: scale(48),
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 8,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 10,
    color: colors.error,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 32,
    gap: 16,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: scale(8),
    minWidth: scale(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.primary,
  },
  saveButton: {
    backgroundColor: '#06B6D4',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;
