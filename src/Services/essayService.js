import axiosClient from './axiosClient';

const essayService = {
  // Get essays list by assessment ID
  getEssaysByAssessmentId: async (assessmentId) => {
    try {
      // Backend: GET api/user/essays/assessment/{assessmentId}
      const response = await axiosClient.get(`/user/essays/assessment/${assessmentId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get essay details by essay ID
  getEssayById: async (essayId) => {
    try {
      const response = await axiosClient.get(`/user/essays/${essayId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit essay (student)
  // Backend endpoint: POST api/user/essay-submissions/submit
  // DTO: CreateEssaySubmissionDto { EssayId, TextContent, AttachmentTempKey?, AttachmentType? }
  submitEssay: async (essayId, textContent, attachmentTempKey = null, attachmentType = null) => {
    try {
      const payload = {
        essayId,
        textContent,
      };

      if (attachmentTempKey) {
        payload.attachmentTempKey = attachmentTempKey;
        if (attachmentType) {
          payload.attachmentType = attachmentType;
        }
      }

      const response = await axiosClient.post(`/user/essay-submissions/submit`, payload);
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
      // For student app this is effectively the same as getSubmissionStatus
      const response = await axiosClient.get(`/user/essay-submissions/submission-status/essay/${essayId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get submission status for an essay
  getSubmissionStatus: async (essayId) => {
    try {
      const response = await axiosClient.get(`/user/essay-submissions/submission-status/essay/${essayId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update essay submission
  updateSubmission: async (submissionId, content, attachments = []) => {
    try {
      const response = await axiosClient.put(`/user/essay-submissions/update/${submissionId}`, {
        content,
        attachments
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default essayService;
