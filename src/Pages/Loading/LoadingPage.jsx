import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import axiosClient from '../../Services/axiosClient';
import Constants from 'expo-constants';
import LoadingScreen from '../../Components/Loading';
import colors from '../../Theme/colors';

const LoadingPage = ({ navigation }) => {
  const [checking, setChecking] = useState(false);
  const apiUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  const checkConnectionAndNavigate = async () => {
    setChecking(true);

    try {
      await axiosClient.get('/user/courses/system-courses', { timeout: 5000 });
      navigation.replace('MainApp');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      
      let alertMessage = `Không thể kết nối đến máy chủ.\n\nURL: ${apiUrl}\n\n`;
      
      if (statusCode === 500) {
        alertMessage += `⚠️ Lỗi Server (500): Backend đang gặp lỗi.\n\n`;
        alertMessage += `Hãy kiểm tra:\n`;
        alertMessage += `1. Backend logs để xem lỗi chi tiết\n`;
        alertMessage += `2. Database connection\n`;
        alertMessage += `3. Các services đã được đăng ký trong DI container\n`;
        alertMessage += `4. Build lại backend sau khi thêm DI registrations\n\n`;
        alertMessage += `Lỗi: ${errorMessage}`;
      } else if (statusCode) {
        alertMessage += `Lỗi HTTP ${statusCode}: ${errorMessage}`;
      } else {
        alertMessage += `Lỗi: ${errorMessage}\n\n`;
        alertMessage += `Hãy đảm bảo:\n1. Backend đã chạy.\n2. Điện thoại và PC cùng Wifi.\n3. Tắt Firewall trên PC.`;
      }
      
      Alert.alert(
        statusCode === 500 ? 'Lỗi Server (500)' : 'Lỗi kết nối Server',
        alertMessage,
        [
          { text: 'Thử lại', onPress: checkConnectionAndNavigate },
          { 
            text: 'Vào Offline', 
            style: 'cancel',
            onPress: () => navigation.replace('MainApp') // Cho phép vào tạm để test UI
          }
        ]
      );
    } finally {
      setChecking(false);
    }
  };

  const handleLoadingFinish = () => {
    checkConnectionAndNavigate();
  };

  return <LoadingScreen onFinish={handleLoadingFinish} duration={2000} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: colors.primary
  }
});

export default LoadingPage;

