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
    console.log(`📡 Connecting to Backend at: ${apiUrl}`);

    try {
      // Gọi thử một API public bất kỳ để check kết nối
      // Dùng timeout ngắn (5s) để không chờ quá lâu
      await axiosClient.get('/user/courses/system-courses', { timeout: 5000 });
      
      console.log('✅ Connected to Backend successfully!');
      // Kết nối thành công -> Vào App
      navigation.replace('MainApp');
    } catch (error) {
      console.error('❌ Connection Failed:', error.message);
      
      Alert.alert(
        'Lỗi kết nối Server',
        `Không thể kết nối đến máy chủ.\n\nURL: ${apiUrl}\n\nLỗi: ${error.message}\n\nHãy đảm bảo:\n1. Backend đã chạy.\n2. Điện thoại và PC cùng Wifi.\n3. Tắt Firewall trên PC.`,
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
    // Khi animation loading kết thúc, mới bắt đầu check API
    checkConnectionAndNavigate();
  };

  // Sử dụng component LoadingScreen có sẵn, nó sẽ gọi onFinish khi chạy xong animation
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

