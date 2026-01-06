import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../../Theme/colors';
import paymentService from '../../Services/paymentService';
import enrollmentService from '../../Services/enrollmentService';

const PaymentSuccess = ({ navigation, route }) => {
  const { paymentId, courseId, orderCode } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentId) {
        setError('Không tìm thấy thông tin thanh toán');
        setLoading(false);
        return;
      }

      try {
        // Bước 1: Kiểm tra status payment trước
        let payment = null;
        let paymentCompleted = false;
        
        try {
          const detailResponse = await paymentService.getTransactionDetail(parseInt(paymentId));
          if (detailResponse?.data?.success && detailResponse?.data?.data) {
            payment = detailResponse.data.data;
            const status = payment.status;
            // Status: 0 = Pending, 1 = Processing, 2 = Completed
            paymentCompleted = status === 2 || status === 'Completed' || status === 'completed' || status === 'PAID';
          }
        } catch (detailErr) {
        }

        // Bước 2: Xác nhận thanh toán PayOS (nếu chưa completed)
        let confirmSuccess = false;
        if (!paymentCompleted) {
          try {
            const response = await paymentService.confirmPayOs(parseInt(paymentId));
            confirmSuccess = response?.data?.success || false;
          } catch (confirmErr) {
            const confirmErrorMsg = confirmErr.response?.data?.message || confirmErr.message;
            // Nếu lỗi là payment đã được xác nhận hoặc không tìm thấy, vẫn tiếp tục
            if (
              confirmErrorMsg?.includes('already') ||
              confirmErrorMsg?.includes('not found') ||
              confirmErrorMsg?.includes('Payment not completed on PayOS')
            ) {
              // Kiểm tra lại status
              try {
                const retryResponse = await paymentService.getTransactionDetail(parseInt(paymentId));
                if (retryResponse?.data?.success && retryResponse?.data?.data) {
                  payment = retryResponse.data.data;
                  const status = payment.status;
                  paymentCompleted = status === 2 || status === 'Completed' || status === 'completed' || status === 'PAID';
                  if (paymentCompleted) {
                    confirmSuccess = true;
                  }
                }
              } catch (retryErr) {
              }
            } else {
              // Lỗi khác, hiển thị lỗi
              setError(confirmErrorMsg || 'Không thể xác nhận thanh toán');
              setLoading(false);
              return;
            }
          }
        } else {
          confirmSuccess = true;
        }

        // Bước 3: Nếu payment thành công, enroll vào course
        if (confirmSuccess || paymentCompleted) {
          // Lấy lại payment detail nếu chưa có
          if (!payment) {
            try {
              const detailResponse = await paymentService.getTransactionDetail(parseInt(paymentId));
              if (detailResponse?.data?.success && detailResponse?.data?.data) {
                payment = detailResponse.data.data;
              }
            } catch (detailErr) {
            }
          }

          // Enroll vào course nếu là Course (productType = 1)
          if (payment && payment.productType === 1 && payment.productId) {
            try {
              // Backend DTO yêu cầu PascalCase: CourseId
              await enrollmentService.enroll({ CourseId: payment.productId });
              setEnrolled(true);
            } catch (enrollErr) {
              const enrollErrorMsg = enrollErr.response?.data?.message || '';
              if (
                enrollErrorMsg.includes('đã đăng ký') ||
                enrollErrorMsg.includes('already enrolled') ||
                enrollErrorMsg.includes('already exists')
              ) {
                setEnrolled(true);
              } else {
                setEnrolled(false);
              }
            }
          }

          setLoading(false);
        } else {
          setError('Giao dịch chưa hoàn tất hoặc đang được xử lý');
          setLoading(false);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xác nhận thanh toán';
        setError(errorMsg);
        setLoading(false);
      }
    };

    confirmPayment();
  }, [paymentId]);

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  const handleGoToCourse = async () => {
    if (courseId) {
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainApp' },
          {
            name: 'CourseDetail',
            params: { courseId: parseInt(courseId) },
          },
        ],
      });
    } else {
      // Lấy courseId từ payment detail
      try {
        const detailResponse = await paymentService.getTransactionDetail(parseInt(paymentId));
        if (detailResponse?.data?.success && detailResponse?.data?.data) {
          const payment = detailResponse.data.data;
          if (payment.productType === 1 && payment.productId) {
            navigation.reset({
              index: 0,
              routes: [
                { name: 'MainApp' },
                {
                  name: 'CourseDetail',
                  params: { courseId: payment.productId },
                },
              ],
            });
            return;
          }
        }
      } catch (err) {
        // Ignore
      }
      handleGoHome();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang xác nhận thanh toán...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="close-circle" size={80} color="#ef4444" />
            <Text style={styles.errorTitle}>Xác nhận thanh toán thất bại</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
              <Text style={styles.homeButtonText}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.successTitle}>Thanh toán thành công!</Text>
          <Text style={styles.successMessage}>
            Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xử lý thành công.
          </Text>
          {orderCode && (
            <Text style={styles.orderCode}>Mã giao dịch: {orderCode}</Text>
          )}
          {enrolled && (
            <Text style={styles.enrolledText}>
              Bạn đã được đăng ký vào khóa học!
            </Text>
          )}
          <View style={styles.buttonContainer}>
            {enrolled && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoToCourse}
              >
                <Text style={styles.secondaryButtonText}>Xem khóa học</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.gradientButton}
              >
                <Text style={styles.primaryButtonText}>Về trang chủ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  successContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 20,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 20,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  orderCode: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  enrolledText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default PaymentSuccess;

