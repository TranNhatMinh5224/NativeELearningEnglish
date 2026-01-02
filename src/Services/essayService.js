import axiosClient from './axiosClient';

const essayService = {
  // Get essay details by essay ID
  getEssayById: async (essayId) => {
    try {
      const response = await axiosClient.get(`/user/essays/${essayId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit essay
  submitEssay: async (essayId, content, attachments = []) => {
    try {
      const response = await axiosClient.post(`/user/essay-submissions`, {
        essayId,
        content,
        attachments
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get essay submission by ID
  getSubmission: async (submissionId) => {
    try {
      const response = await axiosClient.get(`/user/essay-submissions/${submissionId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get my submissions for an essay
  getMySubmissions: async (essayId) => {
    try {
      const response = await axiosClient.get(`/user/essay-submissions/essay/${essayId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default essayService;
