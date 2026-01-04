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

    // Không refresh token cho các request authentication (login, register, etc.)
    // Vì các request này không cần token và nếu 401 thì là do sai thông tin đăng nhập
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/forgot-password') ||
                          originalRequest.url?.includes('/auth/verify-otp') ||
                          originalRequest.url?.includes('/auth/verify-email') ||
                          originalRequest.url?.includes('/auth/set-new-password') ||
                          originalRequest.url?.includes('/auth/reset-password');

    // If 401 and not already retried, try refresh token
    // Nhưng không refresh cho auth requests và không refresh nếu không có refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Không có refresh token, trả về error gốc từ backend
          return Promise.reject(error);
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
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Trả về error gốc từ backend thay vì refresh error
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
