import axiosClient from './axiosClient';

const teacherPackageService = {
  // Get all teacher packages
  getTeacherPackages: async () => {
    try {
      const response = await axiosClient.get('/user/teacher-packages/teacher-packages');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get teacher package by ID
  getTeacherPackageById: async (id) => {
    try {
      const response = await axiosClient.get(`/user/teacher-packages/teacher-packages/${id}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default teacherPackageService;

