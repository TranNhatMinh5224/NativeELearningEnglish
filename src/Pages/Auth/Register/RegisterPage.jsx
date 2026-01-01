import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../../Theme/responsive';
import colors from '../../../Theme/colors';
import authService from '../../../Services/authService';
import Toast from '../../../Components/Common/Toast';
import { mochiWelcome } from '../../../../assets/images';

const RegisterPage = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: 'Nam',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vui lòng nhập tên';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Vui lòng nhập họ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (formData.phone && (!/^0[0-9]{9}$/.test(formData.phone) || formData.phone.length !== 10)) {
      newErrors.phone = 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Validate date if entered partially
      let birthDate = null;
      if (formData.birthYear && formData.birthMonth && formData.birthDay) {
          birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;
      }

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone.trim() || "", // Gửi empty string nếu không nhập (database NOT NULL)
        dateOfBirth: birthDate,
        isMale: formData.gender === 'Nam'
      };
      
      console.log('Register payload:', userData);

      const response = await authService.register(userData);
      
      // Navigate to OTP verification screen
      setToast({
        visible: true,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.',
        type: 'success',
      });
      setTimeout(() => {
        navigation.navigate('OTPVerification', {
          email: formData.email,
          type: 'register',
        });
      }, 1500);
    } catch (error) {
      console.error('Register Error Detail:', error);
      
      // Parse error message (Backend trả về ServiceResponse hoặc Validation errors)
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error && typeof error === 'object') {
          errorMessage = error.message || error.Message || error.detail || errorMessage;
          
          // Nếu là lỗi validation từ FluentValidation (trả về object errors)
          if (error.errors && typeof error.errors === 'object') {
              const firstErrorField = Object.keys(error.errors)[0];
              const fieldErrors = error.errors[firstErrorField];
              if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                  errorMessage = `${firstErrorField}: ${fieldErrors[0]}`;
              }
          }
      } else if (typeof error === 'string') {
          errorMessage = error;
      }
      
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });

      // Thêm Alert để chắc chắn user thấy lỗi nếu Toast bị che
      Alert.alert('Lỗi đăng ký', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setErrors({ ...errors, [key]: null });
  };

  const handleGuestLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={toast.type === 'success' ? 2000 : 3000}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + verticalScale(8) }]}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image
                  source={mochiWelcome}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.headerTitle}>Tạo tài khoản mới</Text>
            <Text style={styles.headerSubtitle}>
              Bắt đầu hành trình học tiếng Anh của bạn
            </Text>
          </LinearGradient>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Tên</Text>
                <View style={[styles.inputWrapper, errors.firstName && styles.inputError]}>
                  <Ionicons name="person-outline" size={scale(18)} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Tên"
                    placeholderTextColor={colors.textLight}
                    value={formData.firstName}
                    onChangeText={(text) => updateFormData('firstName', text)}
                  />
                </View>
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Họ</Text>
                <View style={[styles.inputWrapper, errors.lastName && styles.inputError]}>
                  <Ionicons name="person-outline" size={scale(18)} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Họ"
                    placeholderTextColor={colors.textLight}
                    value={formData.lastName}
                    onChangeText={(text) => updateFormData('lastName', text)}
                  />
                </View>
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={scale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor={colors.textLight}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={scale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                  placeholderTextColor={colors.textLight}
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={scale(22)} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="shield-checkmark-outline" size={scale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.textLight}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateFormData('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={scale(22)} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại (tùy chọn)</Text>
              <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={scale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={colors.textLight}
                  value={formData.phone}
                  onChangeText={(text) => updateFormData('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Birth Date & Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ngày sinh & Giới tính (tùy chọn)</Text>
              <View style={styles.dateGenderRow}>
                <View style={[styles.dateInputWrapper, styles.smallInput]}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    placeholderTextColor={colors.textLight}
                    value={formData.birthDay}
                    onChangeText={(text) => updateFormData('birthDay', text)}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={[styles.dateInputWrapper, styles.smallInput]}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="MM"
                    placeholderTextColor={colors.textLight}
                    value={formData.birthMonth}
                    onChangeText={(text) => updateFormData('birthMonth', text)}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={[styles.dateInputWrapper, styles.yearInput]}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY"
                    placeholderTextColor={colors.textLight}
                    value={formData.birthYear}
                    onChangeText={(text) => updateFormData('birthYear', text)}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>

                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'Nam' && styles.genderButtonActive,
                    ]}
                    onPress={() => updateFormData('gender', 'Nam')}
                  >
                    <Ionicons 
                      name="male" 
                      size={scale(16)} 
                      color={formData.gender === 'Nam' ? '#FFFFFF' : colors.textSecondary} 
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === 'Nam' && styles.genderButtonTextActive,
                      ]}
                    >
                      Nam
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'Nữ' && styles.genderButtonActive,
                    ]}
                    onPress={() => updateFormData('gender', 'Nữ')}
                  >
                    <Ionicons 
                      name="female" 
                      size={scale(16)} 
                      color={formData.gender === 'Nữ' ? '#FFFFFF' : colors.textSecondary} 
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === 'Nữ' && styles.genderButtonTextActive,
                      ]}
                    >
                      Nữ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                    <Ionicons name="arrow-forward" size={scale(20)} color="#FFFFFF" style={styles.registerButtonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest Login */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
            >
              <Ionicons name="person-outline" size={scale(18)} color={colors.textSecondary} />
              <Text style={styles.guestButtonText}>Tiếp tục với tư cách khách</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header Styles
  header: {
    paddingBottom: verticalScale(16),
    paddingHorizontal: 20,
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },
  backButton: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  logoImage: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  // Form Styles
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 11,
    marginTop: 4,
  },
  // Date & Gender Styles
  dateGenderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateInputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  smallInput: {
    width: scale(50),
  },
  yearInput: {
    width: scale(65),
  },
  dateInput: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  genderContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: scale(10),
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  // Register Button
  registerButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerButtonIcon: {
    marginLeft: 8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: colors.textSecondary,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  guestButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default RegisterPage;
