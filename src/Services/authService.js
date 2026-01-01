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

      // Backend trả về ServiceResponse với Data = AuthResponseDto { AccessToken, RefreshToken, User }
      // axiosClient interceptor trả về response.data, nên response có thể là:
      // - { success, data: { AccessToken, RefreshToken, User } } nếu là ServiceResponse
      // - { AccessToken, RefreshToken, User } nếu là AuthResponseDto trực tiếp
      
      let authData = null;
      if (response && response.data) {
        authData = response.data; // Nếu là ServiceResponse
      } else if (response && (response.AccessToken || response.accessToken)) {
        authData = response; // Nếu là AuthResponseDto trực tiếp
      }

      // Save tokens and user info
      if (authData) {
        const accessToken = authData.AccessToken || authData.accessToken;
        const refreshToken = authData.RefreshToken || authData.refreshToken;
        const user = authData.User || authData.user;
        
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
          if (user) {
            await AsyncStorage.setItem('user', JSON.stringify(user));
          }
        }
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
      
      // Backend trả về ServiceResponse với Data = AuthResponseDto
      let authData = null;
      if (response && response.data) {
        authData = response.data;
      } else if (response && (response.AccessToken || response.accessToken)) {
        authData = response;
      }

      // Auto login after register
      if (authData) {
        const accessToken = authData.AccessToken || authData.accessToken;
        const refreshToken = authData.RefreshToken || authData.refreshToken;
        const user = authData.User || authData.user;
        
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
          if (user) {
            await AsyncStorage.setItem('user', JSON.stringify(user));
          }
        }
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

  // Verify Email OTP (for registration)
  verifyEmail: async (email, otpCode) => {
    try {
      const response = await axiosClient.post('/auth/verify-email', {
        email,
        otpCode,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify OTP (for forgot password)
  verifyOtp: async (email, otpCode) => {
    try {
      const response = await axiosClient.post('/auth/verify-otp', {
        email,
        otpCode,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Set New Password (after OTP verification for forgot password)
  setNewPassword: async (email, otpCode, newPassword, confirmPassword) => {
    try {
      const response = await axiosClient.post('/auth/set-new-password', {
        email,
        otpCode,
        newPassword,
        confirmPassword,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Resend OTP
  resendOtp: async (email) => {
    try {
      const response = await axiosClient.post('/auth/resend-otp', {
        email,
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

  // Save user to AsyncStorage
  saveUser: async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      // Error saving user
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
