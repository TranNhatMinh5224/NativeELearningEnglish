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

  // Get lessons by course
  getLessonsByCourse: async (courseId) => {
    try {
      const response = await axiosClient.get(`/teacher/lessons/course/${courseId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new lesson
  createLesson: async (data) => {
    try {
      const response = await axiosClient.post('/teacher/lessons', data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get lesson by ID
  getLessonById: async (lessonId) => {
    try {
      const response = await axiosClient.get(`/teacher/lessons/${lessonId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update lesson
  updateLesson: async (lessonId, data) => {
    try {
      const response = await axiosClient.put(`/teacher/lessons/${lessonId}`, data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete lesson
  deleteLesson: async (lessonId) => {
    try {
      const response = await axiosClient.delete(`/teacher/lessons/${lessonId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get modules by lesson
  getModulesByLesson: async (lessonId) => {
    try {
      const response = await axiosClient.get(`/teacher/modules/lesson/${lessonId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new module
  createModule: async (data) => {
    try {
      const response = await axiosClient.post('/teacher/modules', data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get module by ID
  getModuleById: async (moduleId) => {
    try {
      const response = await axiosClient.get(`/teacher/modules/${moduleId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update module
  updateModule: async (moduleId, data) => {
    try {
      const response = await axiosClient.put(`/teacher/modules/${moduleId}`, data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete module
  deleteModule: async (moduleId) => {
    try {
      const response = await axiosClient.delete(`/teacher/modules/${moduleId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default teacherService;

