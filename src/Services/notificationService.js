import axiosClient from './axiosClient';

const notificationService = {
  // Lấy tất cả thông báo (Backend giới hạn 30 cái gần nhất)
  getAll: async () => {
    return axiosClient.get('/user/notifications');
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async () => {
    return axiosClient.get('/user/notifications/unread-count');
  },

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: async (id) => {
    return axiosClient.put(`/user/notifications/${id}/mark-as-read`);
  },

  // Đánh dấu tất cả là đã đọc
  markAllAsRead: async () => {
    return axiosClient.put('/user/notifications/mark-all-read');
  }
};

export default notificationService;
