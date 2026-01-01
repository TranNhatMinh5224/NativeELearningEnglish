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
import { useNotifications } from '../../Context/NotificationContext';

const { width } = Dimensions.get('window');

const PaymentScreen = ({ navigation, route }) => {
  const { 
    courseId, courseTitle, 
    packageId, packageName, packageDescription,
    price, thumbnail 
  } = route.params;
  const insets = useSafeAreaInsets();
  const { refresh } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false); // Track payment success
  
  const pollingInterval = useRef(null);

  useEffect(() => {
    initializePaymentFlow();
    return () => stopPolling();
  }, []);

  const initializePaymentFlow = async () => {
    try {
      setLoading(true);
      
      // Nếu là teacher package, check subscription trước khi gọi API
      if (packageId) {
        try {
          // Fetch user mới từ API để có subscription info mới nhất
          const userResponse = await userService.getProfile();
          const currentUser = userResponse?.data?.data || userResponse?.data || userResponse;
          const subscription = currentUser?.TeacherSubscription || currentUser?.teacherSubscription;
          const currentPackageId = subscription?.TeacherPackageId || subscription?.teacherPackageId;
          const expiresAt = subscription?.ExpiresAt || subscription?.expiresAt;
          
          const isActive = subscription && (!expiresAt || new Date(expiresAt) > new Date());
          
          // Nếu đã có subscription active cho package này, không gọi API
          if (currentPackageId && parseInt(currentPackageId) === parseInt(packageId) && isActive) {
            Alert.alert(
              'Thông báo',
              'Bạn đang sử dụng gói này. Gói sẽ được gia hạn tự động khi hết hạn.',
              [{ 
                text: 'OK', 
                onPress: () => navigation.goBack() 
              }]
            );
            setLoading(false);
            return;
          }
          
          // Nếu có subscription active cho package khác, vẫn cho phép upgrade (backend sẽ xử lý)
          // Không block ở đây vì user có thể muốn upgrade từ package cũ sang package mới
        } catch (userError) {
          // Nếu không lấy được user info, vẫn tiếp tục (backend sẽ check)
          // Không log warning để tránh spam log
        }
      }
      
      // Bước 1: Gọi API process để lấy paymentId
      let processRes;
      if (courseId) {
        // Thanh toán khóa học (Type = 1)
        processRes = await paymentService.processPayment(courseId, 1);
      } else if (packageId) {
        // Thanh toán gói giáo viên (Type = 2)
        processRes = await paymentService.processPayment(packageId, 2);
      } else {
        throw new Error('Thiếu thông tin sản phẩm thanh toán');
      }
      
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
      // Chỉ log error nếu chưa thanh toán thành công
      if (!paymentSuccess) {
        console.error('Payment Flow Error:', error);
      }
      
      // Parse error message từ backend
      const serverMessage = error.response?.data?.message || error.message;
      
      // Nếu backend trả về "Bạn đã mua sản phẩm này rồi", hiển thị message thân thiện
      if (serverMessage && (serverMessage.includes('đã mua') || serverMessage.includes('already purchased'))) {
        Alert.alert(
          'Thông báo',
          serverMessage || 'Bạn đã mua sản phẩm này rồi.',
          [{ 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }]
        );
        setLoading(false);
        return;
      }
      
      // Chỉ hiển thị alert nếu chưa thanh toán thành công
      if (!paymentSuccess) {
        Alert.alert(
          'Thông báo', 
          serverMessage || 'Đã xảy ra lỗi khi khởi tạo thanh toán.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
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
        setPaymentSuccess(true); // Đánh dấu đã thanh toán thành công
        stopPolling();
        handlePaymentSuccess();
      }
    } catch (error) {
      // Chỉ log error nếu chưa thanh toán thành công
      if (!paymentSuccess) {
        // Ignore error during polling (có thể payment chưa hoàn tất)
      }
    }
  };

    const handleCancel = () => {
    stopPolling();
    Alert.alert('Đã hủy', 'Bạn đã hủy giao dịch thanh toán.');
    navigation.goBack();
  };

  const onNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('WebView Nav:', url);

    const lowerUrl = url.toLowerCase();

    // 1. Check Cancel
    if (lowerUrl.includes('payos/cancel') || lowerUrl.includes('cancel=true') || lowerUrl.includes('status=cancelled') || lowerUrl.includes('payment/cancel')) {
        handleCancel();
        return false;
    }

    // 2. Check Redirect Success
    if (url.includes('payment-success') || url.includes('payment/success')) {
        stopPolling();
        handlePaymentSuccess();
        return false;
    }

    // 3. Check Return URL (Localhost/IP)
    if (url.includes('payos/return') || url.includes('localhost') || url.includes('192.168')) {
        if (url.includes('code=00') || url.includes('status=PAID')) {
            stopPolling();
            handlePaymentSuccess();
            return false;
        }
    }
  };

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    
    // Cập nhật lại số lượng thông báo (Web-style logic)
    await refresh();

    setTimeout(() => {
      const successMessage = packageId 
        ? 'Bạn đã nâng cấp tài khoản giáo viên thành công.' 
        : 'Khóa học đã được kích hoạt. Chúc bạn học tốt!';
          
        Alert.alert(
          'Thành công! 🎉',
          successMessage,
          [{ 
            text: 'OK', 
            onPress: () => {
              if (packageId) {
                  // Nếu mua gói -> Về màn hình Profile
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainApp', params: { screen: 'Profile' } }],
                  });
              } else {
                  // Nếu mua khóa học -> Về màn hình MyCourses
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainApp', params: { screen: 'MyCourses' } }],
                  });
              }
            } 
          }]
        );
      }, 500);
    };
  
    const formatPrice = (value) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };
  
    const renderProductInfo = () => {
        if (courseId) {
            return (
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
            );
        } else {
            return (
              <View style={styles.card}>
                  <View style={[styles.packageIconContainer, { backgroundColor: '#F5F3FF' }]}>
                      <Ionicons name="diamond" size={64} color="#8B5CF6" />
                  </View>
                  <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{packageName}</Text>
                      <Text style={styles.packageDesc} numberOfLines={2}>{packageDescription}</Text>
                      <Text style={styles.coursePrice}>{formatPrice(price)}</Text>
                  </View>
              </View>
            );
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
  
        {/* Hiển thị thông tin nếu chưa có URL (hoặc đang load) */}
        {!paymentUrl && !loading ? (
           <View style={{padding: 20}}>
               {renderProductInfo()}
           </View>
        ) : (
          <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={onNavigationStateChange}
              onShouldStartLoadWithRequest={(request) => {
                  if (request.url.includes('localhost') || request.url.includes('payos/return')) {
                      onNavigationStateChange(request); 
                      return false;
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
        )}
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
  
  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {width:0, height:2}
  },
  courseImage: {
    width: '100%',
    height: 180,
  },
  packageIconContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default PaymentScreen;
