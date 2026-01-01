import axiosClient from './axiosClient';

const paymentService = {
  // Bước 1: Tạo record thanh toán trong hệ thống
  // typeproduct: 1 (Course), 2 (TeacherPackage)
  processPayment: async (productId, typeproduct) => {
    return axiosClient.post('/user/payments/process', {
      ProductId: productId,
      typeproduct: typeproduct,
      IdempotencyKey: `${Date.now()}-${Math.floor(Math.random() * 10000)}` // Random key để luôn tạo đơn mới
    });
  },

  // Bước 2: Tạo link PayOS từ paymentId vừa nhận được
  createPayOSLink: async (paymentId) => {
    return axiosClient.post(`/user/payments/payos/create-link/${paymentId}`);
  },

  // Polling: Xác nhận trạng thái thanh toán (Backend sẽ check với PayOS)
  confirmPayOSPayment: async (paymentId) => {
    return axiosClient.post(`/user/payments/payos/confirm/${paymentId}`);
  },

  // Lấy lịch sử giao dịch
  getPaymentHistory: async (pageNumber = 1, pageSize = 10) => {
    return axiosClient.get(`/user/payments/history?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }
};

export default paymentService;