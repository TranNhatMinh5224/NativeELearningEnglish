import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import authService from '../../Services/authService';
import userService from '../../Services/userService';
import fileService from '../../Services/fileService';
import * as ImagePicker from 'expo-image-picker';
import Toast from '../../Components/Common/Toast';
import GuestView from '../../Components/Profile/GuestView';
import UserInfo from '../../Components/Profile/UserInfo';
import PasswordModal from '../../Components/Profile/PasswordModal';
import InfoModal from '../../Components/Profile/InfoModal';

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeInfo, setShowChangeInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [infoData, setInfoData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [infoErrors, setInfoErrors] = useState({});
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  useFocusEffect(useCallback(() => { checkLoginStatus(); }, []));

  const handleUpdateAvatar = async () => {
    try {
      // 1. Xin quyền truy cập thư viện ảnh
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh của bạn để đổi ảnh đại diện.');
        return;
      }

      // 2. Chọn ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUpdatingAvatar(true);
        const selectedImage = result.assets[0];

        // 3. Upload file tạm lên server
        const uploadRes = await fileService.uploadFile(selectedImage.uri, selectedImage.fileName || 'avatar.jpg');
        console.log('Upload Result:', uploadRes);
        
       
        const tempKey = uploadRes?.data?.tempKey || uploadRes?.tempKey;

        if (!tempKey) {
          throw new Error('Không nhận được mã file từ server');
        }

        // 4. Gọi API cập nhật Avatar thật
        await userService.updateAvatar(tempKey);
        
        setToast({ visible: true, message: 'Cập nhật ảnh đại diện thành công!', type: 'success' });
        await loadProfile(); // Reload lại dữ liệu user
      }
    } catch (error) {
      console.error('Update avatar error:', error);
      setToast({ visible: true, message: 'Không thể cập nhật ảnh đại diện', type: 'error' });
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) setUser(currentUser);
        await loadProfile();
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await userService.getProfile();
      const userData = response?.data || response;
      if (userData) {
        setUser(userData);
        await authService.saveUser(userData);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          setIsLoggedIn(false);
          setUser(null);
        },
      },
    ]);
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwordData.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Mật khẩu không khớp';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setSaving(true);
    try {
      await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setToast({ visible: true, message: 'Đổi mật khẩu thành công!', type: 'success' });
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đổi mật khẩu thất bại';
      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const validateInfoForm = () => {
    const errors = {};
    if (!infoData.firstName.trim()) errors.firstName = 'Vui lòng nhập tên';
    if (!infoData.lastName.trim()) errors.lastName = 'Vui lòng nhập họ';
    if (!infoData.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^0[0-9]{9}$/.test(infoData.phone)) errors.phone = 'Số điện thoại không hợp lệ';
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
      const updatedUser = response.data || response;
      if (updatedUser) {
        setUser(updatedUser);
        setToast({ visible: true, message: 'Cập nhật thông tin thành công!', type: 'success' });
        setShowChangeInfo(false);
        await loadProfile();
      }
    } catch (error) {
      let errorMessage = 'Cập nhật thông tin thất bại';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && typeof errorData.errors === 'object') {
          const validationErrors = [];
          Object.keys(errorData.errors).forEach((field) => {
            const fieldErrors = errorData.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((msg) => {
                const fieldName = field === 'PhoneNumber' ? 'Số điện thoại' : 
                                 field === 'FirstName' ? 'Tên' : 
                                 field === 'LastName' ? 'Họ' : field;
                validationErrors.push(`${fieldName}: ${msg}`);
              });
            }
          });
          if (validationErrors.length > 0) errorMessage = validationErrors.join('\n');
          else errorMessage = errorData.message || errorData.title || errorMessage;
        } else {
          errorMessage = errorData.message || errorData.title || errorMessage;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <GuestView
        onLogin={() => navigation.navigate('Login')}
        onRegister={() => navigation.navigate('Register')}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <UserInfo 
            user={user} 
            onUpgradePro={() => navigation.navigate('Pro')} 
            onUpdateAvatar={handleUpdateAvatar}
            updatingAvatar={updatingAvatar}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => setShowChangePassword(true)}>
            <View style={styles.actionIcon}>
              <Ionicons name="key-outline" size={scale(22)} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={scale(20)} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => {
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
            <View style={styles.actionIcon}>
              <Ionicons name="create-outline" size={scale(22)} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Chỉnh sửa thông tin</Text>
            <Ionicons name="chevron-forward" size={scale(20)} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Pro')}>
            <View style={styles.actionIcon}>
              <Ionicons name="diamond-outline" size={scale(22)} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Nâng cấp tài khoản</Text>
            <Ionicons name="chevron-forward" size={scale(20)} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('PaymentHistory')}>
            <View style={styles.actionIcon}>
              <Ionicons name="receipt-outline" size={scale(22)} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Lịch sử thanh toán</Text>
            <Ionicons name="chevron-forward" size={scale(20)} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={scale(22)} color={colors.error} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        showPasswords={showPasswords}
        setShowPasswords={setShowPasswords}
        errors={passwordErrors}
        setErrors={setPasswordErrors}
        onSave={handleChangePassword}
        saving={saving}
      />

      <InfoModal
        visible={showChangeInfo}
        onClose={() => setShowChangeInfo(false)}
        infoData={infoData}
        setInfoData={setInfoData}
        errors={infoErrors}
        setErrors={setInfoErrors}
        onSave={handleChangeInfo}
        saving={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: scale(14),
    color: colors.textLight,
  },
  actions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: scale(12),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: '500',
    color: colors.text,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}15`,
    padding: 16,
    borderRadius: scale(12),
    gap: 8,
  },
  logoutText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.error,
  },
});

export default ProfileScreen;
