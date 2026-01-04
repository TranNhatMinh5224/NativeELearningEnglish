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

  // Get student detail in course
  getStudentDetail: async (courseId, studentId) => {
    try {
      const response = await axiosClient.get(`/teacher/courses/${courseId}/students/${studentId}`);
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

  // Get assessments by module ID
  // GET: /api/teacher/assessments/module/{moduleId}
  getAssessmentsByModule: async (moduleId) => {
    try {
      const response = await axiosClient.get(`/teacher/assessments/module/${moduleId}`);
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

  // ========== Essay Submissions Management ==========
  
  // Get submissions by essay ID with pagination
  // GET: /api/teacher/essay-submissions/essay/{essayId}?pageNumber=1&pageSize=10
  getEssaySubmissions: async (essayId, params = {}) => {
    try {
      const response = await axiosClient.get(`/teacher/essay-submissions/essay/${essayId}`, { params });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get submission detail by ID
  // GET: /api/teacher/essay-submissions/{submissionId}
  getSubmissionDetail: async (submissionId) => {
    try {
      const response = await axiosClient.get(`/teacher/essay-submissions/${submissionId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download submission file
  // GET: /api/teacher/essay-submissions/{submissionId}/download
  downloadSubmissionFile: async (submissionId) => {
    try {
      const response = await axiosClient.get(`/teacher/essay-submissions/${submissionId}/download`, {
        responseType: 'blob', // For file download
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Grade submission with AI
  // POST: /api/teacher/essay-submissions/{submissionId}/grade-ai
  gradeSubmissionWithAI: async (submissionId) => {
    try {
      const response = await axiosClient.post(`/teacher/essay-submissions/${submissionId}/grade-ai`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Grade submission manually (first time or update)
  // POST: /api/teacher/essay-submissions/{submissionId}/grade
  // PUT: /api/teacher/essay-submissions/{submissionId}/grade (for update)
  gradeSubmission: async (submissionId, data, isUpdate = false) => {
    try {
      // data: { Score, Feedback } in PascalCase
      const payload = {
        Score: data.Score || data.score,
        Feedback: data.Feedback || data.feedback || '',
      };
      
      if (isUpdate) {
        const response = await axiosClient.put(`/teacher/essay-submissions/${submissionId}/grade`, payload);
        return response;
      } else {
        const response = await axiosClient.post(`/teacher/essay-submissions/${submissionId}/grade`, payload);
        return response;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Batch grade by AI for all submissions of an essay
  // POST: /api/teacher/essay-submissions/essay/{essayId}/batch-grade-ai
  batchGradeByAI: async (essayId) => {
    try {
      const response = await axiosClient.post(`/teacher/essay-submissions/essay/${essayId}/batch-grade-ai`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get essay statistics
  // GET: /api/teacher/essay-submissions/essay/{essayId}/statistics
  getEssayStatistics: async (essayId) => {
    try {
      const response = await axiosClient.get(`/teacher/essay-submissions/essay/${essayId}/statistics`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Essay Management ==========
  
  // Get essays by assessment ID
  // GET: /api/teacher/essays/assessment/{assessmentId}
  getEssaysByAssessment: async (assessmentId) => {
    try {
      const response = await axiosClient.get(`/teacher/essays/assessment/${assessmentId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Quiz Management ==========
  
  // Get quizzes by assessment ID
  // GET: /api/teacher/quizzes/assessment/{assessmentId}
  getQuizzesByAssessment: async (assessmentId) => {
    try {
      const response = await axiosClient.get(`/teacher/quizzes/assessment/${assessmentId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Quiz Attempts Management ==========
  
  // Get quiz attempts with pagination
  // GET: /api/teacher/quiz-attempts/quiz/{quizId}/paged?pageNumber=1&pageSize=10
  getQuizAttempts: async (quizId, params = {}) => {
    try {
      const response = await axiosClient.get(`/teacher/quiz-attempts/quiz/${quizId}/paged`, { params });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get quiz attempt statistics
  // GET: /api/teacher/quiz-attempts/stats/{quizId}
  getQuizAttemptStats: async (quizId) => {
    try {
      const response = await axiosClient.get(`/teacher/quiz-attempts/stats/${quizId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get quiz attempt detail for review
  // GET: /api/teacher/quiz-attempts/{attemptId}/review
  getQuizAttemptDetail: async (attemptId) => {
    try {
      const response = await axiosClient.get(`/teacher/quiz-attempts/${attemptId}/review`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Force submit quiz attempt
  // POST: /api/teacher/quiz-attempts/force-submit/{attemptId}
  forceSubmitQuizAttempt: async (attemptId) => {
    try {
      const response = await axiosClient.post(`/teacher/quiz-attempts/force-submit/${attemptId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default teacherService;

