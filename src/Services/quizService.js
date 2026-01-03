import axiosClient from './axiosClient';

const quizService = {
  // Get quizzes by assessment ID (list on Assignment screen)
  getQuizzesByAssessmentId: async (assessmentId) => {
    try {
      // Backend route: GET api/user/quizzes/assessment/{assessmentId}
      const response = await axiosClient.get(`/user/quizzes/assessment/${assessmentId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get quiz details by quiz ID
  getQuizById: async (quizId) => {
    try {
      // Backend route: GET api/user/quizzes/quiz/{quizId}
      const response = await axiosClient.get(`/user/quizzes/quiz/${quizId}`);
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

  // Save individual answer (real-time scoring)
  saveAnswer: async (attemptId, questionId, selectedOptionId) => {
    try {
      const response = await axiosClient.post(
        `/user/quiz-attempts/update-answer/${attemptId}`,
        {
          questionId,
          // Backend expects UserAnswer in UpdateAnswerRequestDto
          userAnswer: selectedOptionId,
        }
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

  // Check if there's an active attempt for a quiz
  checkActiveAttempt: async (quizId) => {
    try {
      const response = await axiosClient.get(`/user/quiz-attempts/check-active/${quizId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Resume an existing quiz attempt
  resumeQuizAttempt: async (attemptId) => {
    try {
      const response = await axiosClient.get(`/user/quiz-attempts/resume/${attemptId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default quizService;
