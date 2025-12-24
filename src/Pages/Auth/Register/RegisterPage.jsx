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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../../Theme/colors';
import authService from '../../../Services/authService';
import Toast from '../../../Components/Common/Toast';

const RegisterPage = ({ navigation }) => {
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
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        birthDate: `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`,
      };

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
      // Extract detailed error message from backend
      let errorMessage = 'Đăng ký thất bại';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show detailed error in toast
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setErrors({ ...errors, [key]: null });
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
          duration={3000}
        />
        <View style={styles.content}>
          <Text style={styles.title}>Tạo tài khoản của bạn</Text>

          {/* First Name & Last Name */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="Tên"
                placeholderTextColor="#9CA3AF"
                value={formData.firstName}
                onChangeText={(text) => updateFormData('firstName', text)}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Họ"
                placeholderTextColor="#9CA3AF"
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <View style={[styles.input, errors.password && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Tạo mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <View style={[styles.input, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeIconText}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="Số điện thoại"
              placeholderTextColor="#9CA3AF"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              keyboardType="phone-pad"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Birth Date */}
          <View style={styles.dateContainer}>
            <View style={styles.dateRow}>
              <View style={[styles.inputContainer, styles.dateInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="8"
                  placeholderTextColor="#9CA3AF"
                  value={formData.birthDay}
                  onChangeText={(text) => updateFormData('birthDay', text)}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={[styles.inputContainer, styles.dateInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  value={formData.birthMonth}
                  onChangeText={(text) => updateFormData('birthMonth', text)}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={[styles.inputContainer, styles.dateInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="2005"
                  placeholderTextColor="#9CA3AF"
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

            {/* Date Labels */}
            <View style={styles.dateLabels}>
              <Text style={styles.dateLabel}>Ngày</Text>
              <Text style={styles.dateLabel}>Tháng</Text>
              <Text style={styles.dateLabel}>Năm</Text>
              <Text style={styles.dateLabel}></Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 32,
    paddingTop: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 32,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  eyeIconText: {
    fontSize: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  dateContainer: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  genderContainer: {
    flex: 1.2,
    flexDirection: 'column',
    gap: 4,
  },
  genderButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
  },
  dateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  registerGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
});

export default RegisterPage;
