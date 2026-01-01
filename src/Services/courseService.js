import axiosClient from './axiosClient';

const courseService = {
  // Get all courses (public)
  getAllCourses: async () => {
    try {
      const response = await axiosClient.get('/courses');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get my enrolled courses (requires auth)
  getMyCourses: async () => {
    try {
      const response = await axiosClient.get('/user/enrollments/my-courses');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Join course by class code
  joinByClassCode: async (classCode) => {
    try {
      const response = await axiosClient.post('/user/enrollments/join-by-class-code', {
        classCode,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get featured courses (system courses)
  getFeaturedCourses: async () => {
    try {
      const response = await axiosClient.get('/user/courses/system-courses');
      // Backend trả về ServiceResponse với structure: { success, data, message, statusCode }
      // data là array của courses
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get course by ID (with enrollment status)
  getCourseById: async (courseId) => {
    try {
      const response = await axiosClient.get(`/user/courses/${courseId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Enroll in course
  enrollCourse: async (courseId) => {
    try {
      const response = await axiosClient.post('/user/enrollments/course', {
        courseId,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search courses
  searchCourses: async (keyword) => {
    try {
      const response = await axiosClient.get('/user/courses/search', {
        params: { keyword },
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default courseService;
