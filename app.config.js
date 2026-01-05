import 'dotenv/config';

export default {
  expo: {
    name: 'Native E-Learning English',
    slug: 'native-elearning-english',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'elearningenglish', // Deep linking scheme
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#6366F1',
    },
    extra: {
      // API Base URL - Cấu hình từ file .env hoặc fallback mặc định
      // Tạo file .env với: REACT_APP_API_BASE_URL=http://YOUR_IP:5030/api
      // - Android Emulator: http://10.0.2.2:5030/api
      // - iOS Simulator: http://localhost:5030/api
      // - Device thật: http://YOUR_COMPUTER_IP:5030/api
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://192.168.88.102:5030/api',
      googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '872783330590-gc3t4a8rf2dve8s87qu2dte766k6f44p.apps.googleusercontent.com',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.elearning.english',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#6366F1',
      },
      package: 'com.elearning.english',
      permissions: ['INTERNET', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
      usesCleartextTraffic: true, // Cho phép HTTP (cleartext) traffic cho development
    },
    web: {
      favicon: './assets/favicon.png',
    },
  },
};
