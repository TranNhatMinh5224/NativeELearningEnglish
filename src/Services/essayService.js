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
      // Backend expects PascalCase: EssayId, TextContent, AttachmentTempKey, AttachmentType
      const payload = {
        EssayId: essayId,
        TextContent: textContent,
      };

      if (attachmentTempKey) {
        payload.AttachmentTempKey = attachmentTempKey;
        if (attachmentType) {
          payload.AttachmentType = attachmentType;
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
  // Backend endpoint: PUT api/user/essay-submissions/update/{submissionId}
  // DTO: UpdateEssaySubmissionDto { TextContent?, AttachmentTempKey?, AttachmentType?, RemoveAttachment }
  updateSubmission: async (submissionId, textContent, attachmentTempKey = null, attachmentType = null, removeAttachment = false) => {
    try {
      // Backend expects PascalCase: TextContent, AttachmentTempKey, AttachmentType, RemoveAttachment
      // Đảm bảo RemoveAttachment là boolean thực sự
      const payload = {
        RemoveAttachment: Boolean(removeAttachment),
      };

      // Chỉ thêm TextContent nếu có giá trị (có thể là empty string)
      if (textContent !== null && textContent !== undefined) {
        payload.TextContent = textContent;
      }

      // Chỉ thêm attachment fields nếu có
      if (attachmentTempKey) {
        payload.AttachmentTempKey = attachmentTempKey;
        if (attachmentType) {
          payload.AttachmentType = attachmentType;
        }
      }

      const response = await axiosClient.put(`/user/essay-submissions/update/${submissionId}`, payload);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete essay submission
  // Backend endpoint: DELETE api/user/essay-submissions/delete/{submissionId}
  deleteSubmission: async (submissionId) => {
    try {
      const response = await axiosClient.delete(`/user/essay-submissions/delete/${submissionId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Request AI grading for essay submission (System Course only)
  // Backend endpoint: POST api/user/essay-submissions/{submissionId}/request-ai-grading
  requestAiGrading: async (submissionId) => {
    try {
      const response = await axiosClient.post(`/user/essay-submissions/${submissionId}/request-ai-grading`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default essayService;
