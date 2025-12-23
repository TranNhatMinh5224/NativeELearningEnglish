import axiosClient from './axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = {
  // Login
  login: async (email, password) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        email,
        password,
      });

      // Save tokens and user info
      if (response.accessToken) {
        await AsyncStorage.setItem('accessToken', response.accessToken);
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await axiosClient.post('/auth/register', userData);
      
      // Auto login after register
      if (response.accessToken) {
        await AsyncStorage.setItem('accessToken', response.accessToken);
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // Continue logout even if API call fails
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  },

  // Forgot Password - Send OTP
  forgotPassword: async (email) => {
    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        email,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reset Password with OTP
  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await axiosClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Login with Google
  loginWithGoogle: async (googleToken) => {
    try {
      const response = await axiosClient.post('/auth/google', {
        token: googleToken,
      });

      if (response.accessToken) {
        await AsyncStorage.setItem('accessToken', response.accessToken);
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login with Facebook
  loginWithFacebook: async (facebookToken) => {
    try {
      const response = await axiosClient.post('/auth/facebook', {
        token: facebookToken,
      });

      if (response.accessToken) {
        await AsyncStorage.setItem('accessToken', response.accessToken);
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default authService;
