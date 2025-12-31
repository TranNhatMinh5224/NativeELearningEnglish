import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import AppNavigator from './src/Routes';

export default function App() {
  // Xử lý deep linking khi app mở từ URL
  useEffect(() => {
    // Xử lý khi app đã mở và nhận được deep link
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Xử lý khi app mở từ deep link (app chưa chạy)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleDeepLink = ({ url }: { url?: string }) => {
    if (!url) return;
    
    try {
      const { hostname, path, queryParams } = Linking.parse(url);
      
      // Xử lý deep link từ PayOS
      // Format: elearningenglish://payment-success?paymentId=123&orderCode=ABC
      // Format: elearningenglish://payment-failed?reason=Canceled
      
      if (path === 'payment-success' || hostname === 'payment-success') {
        // Navigate sẽ được xử lý trong navigation container
        // Hoặc có thể dispatch action ở đây
        console.log('Payment Success Deep Link:', queryParams);
      } else if (path === 'payment-failed' || hostname === 'payment-failed') {
        console.log('Payment Failed Deep Link:', queryParams);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
