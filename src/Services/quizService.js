import axiosClient from './axiosClient';

const quizService = {
  // Get quiz details by quiz ID
  getQuizById: async (quizId) => {
    try {
      const response = await axiosClient.get(`/user/quizzes/${quizId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Start a quiz attempt
  startQuizAttempt: async (quizId) => {
    try {
      const response = await axiosClient.post(`/user/quiz-attempts/start/${quizId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit quiz answers
  submitQuizAttempt: async (attemptId) => {
    try {
      const response = await axiosClient.post(`/user/quiz-attempts/submit/${attemptId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Save individual answer
  saveAnswer: async (attemptId, questionId, selectedOptionId) => {
    try {
      const response = await axiosClient.post(
        `/user/quiz-attempts/${attemptId}/answer`,
        { questionId, selectedOptionId }
      );
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get quiz attempt result
  getQuizAttemptResult: async (attemptId) => {
    try {
      const response = await axiosClient.get(`/user/quiz-attempts/${attemptId}/result`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default quizService;
