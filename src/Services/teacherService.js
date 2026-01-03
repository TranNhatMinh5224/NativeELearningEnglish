import axiosClient from './axiosClient';

const teacherService = {
  // Get teacher's courses
  getMyCourses: async (params = {}) => {
    try {
      const response = await axiosClient.get('/teacher/courses/my-courses', { params });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get course detail by ID
  getCourseById: async (courseId) => {
    try {
      const response = await axiosClient.get(`/teacher/courses/${courseId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new course
  createCourse: async (data) => {
    try {
      const response = await axiosClient.post('/teacher/courses', data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update course
  updateCourse: async (courseId, data) => {
    try {
      const response = await axiosClient.put(`/teacher/courses/${courseId}`, data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      const response = await axiosClient.delete(`/teacher/courses/${courseId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students in a course
  getCourseStudents: async (courseId, params = {}) => {
    try {
      const response = await axiosClient.get(`/teacher/courses/${courseId}/students`, { params });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add student to course
  addStudentToCourse: async (courseId, email) => {
    try {
      const response = await axiosClient.post(`/teacher/courses/${courseId}/students`, { email });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove student from course
  removeStudentFromCourse: async (courseId, studentId) => {
    try {
      const response = await axiosClient.delete(`/teacher/courses/${courseId}/students/${studentId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default teacherService;

