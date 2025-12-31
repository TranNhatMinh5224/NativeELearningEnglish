import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../Theme/colors';
import paymentService from '../../Services/paymentService';

const { width } = Dimensions.get('window');

const PaymentScreen = ({ navigation, route }) => {
  const { courseId, price } = route.params;
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pollingInterval = useRef(null);

  useEffect(() => {
    initializePaymentFlow();
    return () => stopPolling();
  }, []);

  const initializePaymentFlow = async () => {
    try {
      setLoading(true);
      
      // Bước 1: Gọi API process để lấy paymentId
      const processRes = await paymentService.processPayment(courseId, 1); // 1 = Course
      
      if (processRes && processRes.success && processRes.data) {
        const id = processRes.data.paymentId;
        setPaymentId(id);

        // Trường hợp khóa học miễn phí, Backend có thể tự động confirm ngay
        if (processRes.data.amount === 0) {
            handlePaymentSuccess();
            return;
        }

        // Bước 2: Gọi API lấy link PayOS
        const linkRes = await paymentService.createPayOSLink(id);
        
        if (linkRes && linkRes.success && linkRes.data?.checkoutUrl) {
          setPaymentUrl(linkRes.data.checkoutUrl);
          startPolling(id);
        } else {
          throw new Error(linkRes.message || 'Không thể lấy link thanh toán');
        }
      } else {
        throw new Error(processRes.message || 'Lỗi khởi tạo đơn hàng');
      }
    } catch (error) {
      console.error('Payment Flow Error:', error);
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi kết nối.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id) => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      checkStatus(id);
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const checkStatus = async (id) => {
    try {
      // Dùng endpoint chuẩn của Backend: POST payos/confirm/{id}
      const response = await paymentService.confirmPayOSPayment(id);
      if (response && response.success) {
        stopPolling();
        handlePaymentSuccess();
      }
    } catch (error) {
      // Ignore error during polling
    }
  };

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      Alert.alert(
        'Thành công! 🎉',
        'Khóa học đã được kích hoạt.',
        [{ 
          text: 'Vào học ngay', 
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainApp', params: { screen: 'MyCourses' } }],
            });
          } 
        }]
      );
    }, 500);
  };

  const handleCancel = () => {
    stopPolling();
    Alert.alert('Đã hủy', 'Bạn đã hủy giao dịch thanh toán.');
    navigation.goBack();
  };

  const onNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('WebView Nav:', url);

    // Chuẩn hóa URL để check dễ hơn
    const lowerUrl = url.toLowerCase();

    // 1. Check Cancel (Ưu tiên cao nhất)
    // PayOS thường redirect về endpoint /cancel hoặc có param cancel=true
    if (lowerUrl.includes('payos/cancel') || lowerUrl.includes('cancel=true') || lowerUrl.includes('status=cancelled') || lowerUrl.includes('payment/cancel')) {
        handleCancel();
        return false;
    }

    // 2. Check Redirect từ Backend về App (Deep Link Success)
    if (url.includes('payment-success') || url.includes('payment/success')) {
        stopPolling();
        handlePaymentSuccess();
        return false;
    }

    // 3. Check Return URL từ PayOS (Localhost/IP)
    if (url.includes('payos/return') || url.includes('localhost') || url.includes('192.168')) {
        // Chỉ coi là thành công nếu có code=00 hoặc status=PAID rõ ràng
        if (url.includes('code=00') || url.includes('status=PAID')) {
            stopPolling();
            handlePaymentSuccess();
            return false;
        } else {
            // Trường hợp về return nhưng không phải code 00 -> Có thể lỗi
            // Nhưng không tự động cancel, để user xem lỗi trên webview hoặc back
            return true; 
        }
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tạo link thanh toán...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán an toàn</Text>
        <View style={{ width: 28 }} />
      </View>

      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={(request) => {
            // Chặn load localhost trên iOS để tránh lỗi connection refused
            if (request.url.includes('localhost') || request.url.includes('payos/return')) {
                onNavigationStateChange(request); // Tái sử dụng logic check success
                return false; // Chặn load
            }
            return true;
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />

      {isProcessing && (
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.successText}>Đã hoàn tất thanh toán!</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  closeButton: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  webViewLoading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 99 },
  successCard: { backgroundColor: '#fff', padding: 32, borderRadius: 20, alignItems: 'center', width: width * 0.8 },
  successText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16 },
});

export default PaymentScreen;
