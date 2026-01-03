import axiosClient from './axiosClient';

const lessonService = {
  // Get lessons by course ID
  getLessonsByCourse: async (courseId) => {
    try {
      const response = await axiosClient.get(`/user/lessons/course/${courseId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get lesson detail by ID
  getLessonById: async (lessonId) => {
    try {
      const response = await axiosClient.get(`/user/lessons/${lessonId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get modules of a lesson with progress
  getModulesByLessonId: async (lessonId) => {
    try {
      const response = await axiosClient.get(`/user/modules/lesson/${lessonId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get module detail with progress
  getModuleById: async (moduleId) => {
    try {
      const response = await axiosClient.get(`/user/modules/${moduleId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Start and complete module (auto-complete for content modules)
  startModule: async (moduleId) => {
    try {
      const response = await axiosClient.post(`/user/modules/${moduleId}/start`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark lesson as completed
  markLessonCompleted: async (lessonId) => {
    try {
      const response = await axiosClient.post(`/user/lessons/${lessonId}/complete`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get lecture by ID
  getLectureById: async (lectureId) => {
    try {
      const response = await axiosClient.get(`/user/lectures/${lectureId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get lectures by module ID
  getLecturesByModuleId: async (moduleId) => {
    try {
      const response = await axiosClient.get(`/user/lectures/module/${moduleId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get lecture tree by module ID
  getLectureTreeByModuleId: async (moduleId) => {
    try {
      const response = await axiosClient.get(`/user/lectures/module/${moduleId}/tree`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get assessment by ID
  getAssessmentById: async (assessmentId) => {
    try {
      const response = await axiosClient.get(`/user/assessments/${assessmentId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get assessments by module ID
  getAssessmentsByModuleId: async (moduleId) => {
    try {
      const response = await axiosClient.get(`/user/assessments/module/${moduleId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default lessonService;
