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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale } from '../../../Theme/responsive';
import colors from '../../../Theme/colors';
import authService from '../../../Services/authService';
import Toast from '../../../Components/Common/Toast';

const LoginPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authService.login(email, password);
      // Hiển thị toast notification
      setToast({
        visible: true,
        message: 'Đăng nhập thành công!',
        type: 'success',
      });
      // Navigate sau 1.5 giây để user thấy toast
      setTimeout(() => {
        navigation.navigate('MainApp');
      }, 1500);
    } catch (error) {
      setToast({
        visible: true,
        message: error.message || 'Đăng nhập thất bại',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Google Login', 'Chức năng đang được phát triển');
    // TODO: Implement Google OAuth
  };

  const handleFacebookLogin = async () => {
    Alert.alert('Facebook Login', 'Chức năng đang được phát triển');
    // TODO: Implement Facebook OAuth
  };

  const handleGuestLogin = () => {
    Alert.alert('Guest Mode', 'Chức năng đang được phát triển');
    // TODO: Navigate to app without login
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={toast.type === 'success' ? 2000 : 3000}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>
            Đăng nhập để tiếp tục hành trình của bạn.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: null });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={[styles.input, errors.password && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu của bạn"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: null });
                }}
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

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialButtonText}>Đăng nhập bằng Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton]}
            onPress={handleFacebookLogin}
          >
            <Text style={styles.socialIcon}>f</Text>
            <Text style={[styles.socialButtonText, styles.socialButtonTextWhite]}>
              Đăng nhập bằng Facebook
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.guestButton]}
            onPress={handleGuestLogin}
          >
            <Text style={styles.socialIcon}>👤</Text>
            <Text style={[styles.socialButtonText, styles.socialButtonTextWhite]}>
              Đăng nhập bằng khách
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  content: {
    padding: 32,
    paddingTop: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 25,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 20,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 12,
    color: '#6B7280',
  },
  forgotText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#9CA3AF',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  guestButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  socialButtonTextWhite: {
    color: '#FFFFFF',
  },
});

export default LoginPage;
