import 'dotenv/config';

export default {
  expo: {
    name: 'Native E-Learning English',
    slug: 'native-elearning-english',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#6366F1',
    },
    extra: {
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://192.168.1.178:5029/api',
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
    },
    web: {
      favicon: './assets/favicon.png',
    },
  },
};
