import axiosClient from './axiosClient';

const pronunciationService = {
  // Assess pronunciation
  assessPronunciation: async (audioBlob, referenceText) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('referenceText', referenceText);

      const response = await axiosClient.post('/user/pronunciation-assessments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get assessment history
  getAssessmentHistory: async (pageNumber = 1, pageSize = 10) => {
    try {
      const response = await axiosClient.get('/user/pronunciation-assessments/history', {
        params: { pageNumber, pageSize }
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default pronunciationService;
