import axiosClient from './axiosClient';

const pronunciationService = {

  assess: (data) => {
    return axiosClient.post('/user/pronunciation-assessments', data);
  },

  // Lấy danh sách flashcard với pronunciation progress theo module - Giống Web app
  getByModule: (moduleId) => {
    return axiosClient.get(`/user/pronunciation-assessments/module/${moduleId}`);
  },

  // Lấy summary/statistics của pronunciation cho module - Giống Web app
  getModuleSummary: (moduleId) => {
    return axiosClient.get(`/user/pronunciation-assessments/module/${moduleId}/summary`);
  }
};

export default pronunciationService;