import React, { useState, useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../../Theme/responsive';
import colors from '../../../Theme/colors';
import authService from '../../../Services/authService';
import Toast from '../../../Components/Common/Toast';

const OTPVerificationPage = ({ route, navigation }) => {
  const { email, type = 'register' } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (text, index) => {
    if (isBlocked) return;
    
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    // Auto focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode = null) => {
    if (isBlocked) return;
    
    const otpString = otpCode || otp.join('');
    
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'register') {
        // Verify email for registration
        const response = await authService.verifyEmail(email, otpString);
        
        // Backend trả về ServiceResponse<bool> sau khi verify
        // User đã được activate (EmailVerified = true), giờ cần login để lấy tokens
        setWrongAttempts(0);
        setToast({
          visible: true,
          message: 'Xác thực email thành công! Vui lòng đăng nhập.',
          type: 'success',
        });

        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      } else {
        // For forgot password, just verify OTP
        await authService.verifyOtp(email, otpString);
        setWrongAttempts(0);
        setToast({
          visible: true,
          message: 'Xác thực OTP thành công!',
          type: 'success',
        });
        setTimeout(() => {
          navigation.navigate('ResetPassword', { email, otpCode: otpString });
        }, 1500);
      }
    } catch (error) {
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      
      const errorMessage = error?.message || error?.response?.data?.message || 'Mã OTP không hợp lệ';
      
      // Nếu đã nhập sai 5 lần
      if (newAttempts >= 5) {
        setIsBlocked(true);
        setError('Bạn đã nhập sai OTP quá 5 lần. Vui lòng lấy mã OTP mới.');
        setToast({
          visible: true,
          message: 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng lấy mã OTP mới.',
          type: 'error',
        });
        
        // Chuyển về màn hình đăng ký sau 2 giây
        setTimeout(() => {
          if (type === 'register') {
            navigation.replace('Register');
          } else {
            navigation.goBack();
          }
        }, 2000);
      } else {
        setError(`${errorMessage} (Còn lại ${5 - newAttempts} lần thử)`);
        setToast({
          visible: true,
          message: `${errorMessage} (Còn lại ${5 - newAttempts} lần thử)`,
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      if (type === 'register') {
        // Luồng đăng ký: hiện tại backend CHƯA có endpoint resend OTP riêng cho verify email
        // Không được dùng nhầm forgotPassword vì đó là OTP cho quên mật khẩu
        setToast({
          visible: true,
          message: 'Hiện tại chưa hỗ trợ gửi lại OTP cho đăng ký. Vui lòng dùng mã OTP đã gửi trong email.',
          type: 'error',
        });
        return;
      } else {
        // For forgot password, use forgot password endpoint to resend
        await authService.forgotPassword(email);
      }
      setToast({
        visible: true,
        message: 'Mã OTP mới đã được gửi đến email của bạn',
        type: 'success',
      });
      setCanResend(false);
      setCountdown(60);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || error?.response?.data?.message || 'Gửi lại OTP thất bại',
        type: 'error',
      });
    } finally {
      setResendLoading(false);
    }
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
        duration={3000}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={scale(40)} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Xác thực Email</Text>
          <Text style={styles.subtitle}>
            Chúng tôi đã gửi mã OTP 6 chữ số đến email{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  error && styles.otpInputError,
                  isBlocked && styles.otpInputDisabled,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isBlocked}
              />
            ))}
          </View>
          
          {isBlocked && (
            <View style={styles.blockedContainer}>
              <Ionicons name="lock-closed" size={scale(24)} color={colors.error} />
              <Text style={styles.blockedText}>
                Bạn đã nhập sai OTP quá 5 lần. Vui lòng đăng ký lại.
              </Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang xác thực...</Text>
            </View>
          )}

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Không nhận được mã? </Text>
            {canResend ? (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.resendLink}>Gửi lại</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                Gửi lại sau {countdown}s
              </Text>
            )}
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
    paddingTop: 48,
  },
  backButton: {
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 14 * 1.5,
  },
  emailText: {
    fontWeight: '600',
    color: colors.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  otpInput: {
    flex: 1,
    height: scale(60),
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: scale(12),
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: '#F5F3FF',
  },
  otpInputError: {
    borderColor: colors.error,
  },
  otpInputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  blockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: verticalScale(16),
    borderRadius: scale(12),
    marginBottom: 16,
    gap: 8,
  },
  blockedText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default OTPVerificationPage;

