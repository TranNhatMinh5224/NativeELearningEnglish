import axiosClient from './axiosClient';

const flashcardReviewService = {
  // Get flashcards due for review today
  getDueFlashCards: async () => {
    try {
      const response = await axiosClient.get('/user/flashcard-review/due');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get review statistics (dashboard)
  getStatistics: async () => {
    try {
      const response = await axiosClient.get('/user/flashcard-review/statistics');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get mastered flashcards (vocabulary notebook)
  getMasteredFlashCards: async () => {
    try {
      const response = await axiosClient.get('/user/flashcard-review/mastered');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Review a flashcard
  reviewFlashCard: async (flashCardId, quality) => {
    try {
      const response = await axiosClient.post('/user/flashcard-review/review', {
        flashCardId,
        quality,
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Start learning a module
  startLearningModule: async (moduleId) => {
    try {
      const response = await axiosClient.post(`/user/flashcard-review/start-module/${moduleId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default flashcardReviewService;

