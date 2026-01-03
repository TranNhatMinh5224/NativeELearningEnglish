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
      
      // Backend trả về ServiceResponse<UserDto> (KHÔNG có token vì cần verify email trước)
      // Response structure: { success, data: UserDto, message, statusCode }
      // Không tự động login vì user chưa verify email
      
      return response;
    } catch (error) {
      // Backend trả về ServiceResponse với error message
      const errorResponse = error.response?.data || error;
      throw errorResponse;
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

  // Login with Google (using idToken from expo-auth-session)
  loginWithGoogle: async (idToken) => {
    try {
      // Try new OAuth2 flow first (if backend supports Code + State)
      // For now, use idToken endpoint
      const response = await axiosClient.post('/auth/google-login-token', {
        idToken: idToken,
      });

      // Handle both ServiceResponse and direct AuthResponseDto
      let authData = null;
      if (response && response.data) {
        authData = response.data;
      } else if (response && (response.AccessToken || response.accessToken)) {
        authData = response;
      }

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

  // Login with Google OAuth2 Code Flow (for web/backend OAuth)
  loginWithGoogleCode: async (code, state) => {
    try {
      const response = await axiosClient.post('/auth/google-login', {
        code: code,
        state: state,
      });

      let authData = null;
      if (response && response.data) {
        authData = response.data;
      } else if (response && (response.AccessToken || response.accessToken)) {
        authData = response;
      }

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

  // Login with Facebook
  loginWithFacebook: async (facebookToken) => {
    try {
      const response = await axiosClient.post('/auth/facebook-login', {
        accessToken: facebookToken,
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
