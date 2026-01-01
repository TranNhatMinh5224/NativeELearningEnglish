import axiosClient from './axiosClient';

const streakService = {
  // Lấy thông tin streak của người dùng hiện tại
  getMyStreak: async () => {
    return axiosClient.get('/user/streaks');
  },

  // Điểm danh (thường backend tự động làm khi user học bài, nhưng có thể gọi tay)
  checkIn: async () => {
    return axiosClient.post('/user/streaks/checkin');
  }
};

export default streakService;
