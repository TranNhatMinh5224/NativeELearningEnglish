import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ==========================================
// API Configuration
// ==========================================
// URL được lấy từ file .env thông qua app.json
// Nếu không có .env, sử dụng fallback mặc định
// ==========================================
const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://172.20.10.4:5030/api';

console.log('🔧 API Base URL:', BASE_URL);

if (!Constants.expoConfig?.extra?.apiBaseUrl) {
  console.warn(
    '⚠️ Using fallback API URL!\n' +
    '📝 Please check .env file\n' +
    '🔧 Current URL: ' + BASE_URL
  );
}

// Create axios instance
const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        // Backend endpoint là /auth/refresh-token
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        // Backend trả về ServiceResponse với Data = { AccessToken, ... }
        let refreshData = response.data;
        if (refreshData && refreshData.data) {
          refreshData = refreshData.data; // Nếu là ServiceResponse
        }
        
        const accessToken = refreshData?.AccessToken || refreshData?.accessToken;
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        }
        throw new Error('No access token in response');
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
