import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import paymentService from '../../Services/paymentService';
import courseService from '../../Services/courseService';

const PaymentScreen = ({ navigation, route }) => {
  const { courseId, courseTitle, price, thumbnail } = route.params;
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [orderCode, setOrderCode] = useState(null);

  // Xử lý quay lại từ trình duyệt (Deep Linking)
  // Trong môi trường Expo Go, việc test Deep Link hơi phức tạp
  // Nên ta sẽ dùng cơ chế "Tôi đã thanh toán xong" thủ công để check lại status
  
  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      // Tạo URL quay về App (Deep Link) - Cần cấu hình Scheme trong app.json
      // Ví dụ: native-elearning://payment-result
      const returnUrl = Linking.createURL('payment-result'); 
      const cancelUrl = Linking.createURL('payment-cancel');

      const response = await paymentService.createPaymentLink(courseId, returnUrl, cancelUrl);
      
      if (response && response.data && response.data.checkoutUrl) {
        const { checkoutUrl, orderCode: code } = response.data;
        setPaymentUrl(checkoutUrl);
        setOrderCode(code);
        
        // Mở trình duyệt
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert('Lỗi', 'Không thể mở trình duyệt thanh toán');
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tạo link thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi khởi tạo thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!orderCode) return;
    
    try {
      setLoading(true);
      // Gọi API confirm/check status
      // Lưu ý: API confirm bên Backend có thể cần chỉnh sửa để trả về status thay vì redirect
      // Ở đây giả định ta gọi confirm để trigger check
      const response = await paymentService.confirmPayment(orderCode);
      
      if (response && response.success) {
        Alert.alert(
          'Thanh toán thành công! 🎉',
          'Bạn đã đăng ký khóa học thành công.',
          [
            { 
              text: 'Vào học ngay', 
              onPress: () => {
                // Navigate về OnionScreen hoặc LessonList
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainApp', params: { screen: 'MyCourses' } }],
                });
              } 
            }
          ]
        );
      } else {
        Alert.alert('Chưa hoàn tất', 'Giao dịch chưa được xác nhận hoặc đang xử lý. Vui lòng kiểm tra lại sau giây lát.');
      }
    } catch (error) {
      console.error('Check Status Error:', error);
      Alert.alert('Thông báo', 'Giao dịch đang được xử lý hoặc chưa hoàn tất.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận thanh toán</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Image 
            source={{ uri: thumbnail || 'https://via.placeholder.com/150' }} 
            style={styles.courseImage}
            resizeMode="cover"
          />
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>{courseTitle}</Text>
            <Text style={styles.coursePrice}>{formatPrice(price)}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tạm tính</Text>
            <Text style={styles.value}>{formatPrice(price)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(price)}</Text>
          </View>
        </View>

        {paymentUrl ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Đang chờ thanh toán...
            </Text>
            <Text style={styles.statusSubtext}>
              Vui lòng hoàn tất thanh toán trên trình duyệt PayOS, sau đó quay lại đây và bấm nút bên dưới.
            </Text>
            
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheckPaymentStatus}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.success, '#10B981']}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Tôi đã thanh toán xong</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reopenButton}
              onPress={() => Linking.openURL(paymentUrl)}
            >
              <Text style={styles.reopenButtonText}>Mở lại trang thanh toán</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleCreatePayment}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Tiến hành thanh toán</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseImage: {
    width: '100%',
    height: verticalScale(150),
  },
  courseInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    marginTop: 20,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  checkButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  reopenButton: {
    padding: 12,
  },
  reopenButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default PaymentScreen;
