import axiosClient from './axiosClient';

const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await axiosClient.get('/auth/profile');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await axiosClient.put('/auth/update/profile', userData);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axiosClient.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update avatar
  updateAvatar: async (avatarUrl) => {
    try {
      const response = await axiosClient.put('/auth/profile/avatar', {
        avatarUrl,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default userService;

