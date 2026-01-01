import axiosClient from './axiosClient';

const paymentService = {
  // Tạo link thanh toán PayOS
  // courseId: ID khóa học
  // returnUrl: Link redirect về app (deep link) hoặc web cancel url
  // cancelUrl: Link redirect khi hủy
  createPaymentLink: async (courseId, returnUrl, cancelUrl) => {
    return axiosClient.post('/user/payments/process', {
      courseId,
      redirectUrl: returnUrl, // Backend map field này sang returnUrl của PayOS
      cancelUrl: cancelUrl
    });
  },

  // Tạo link thanh toán cho gói Teacher
  createTeacherPaymentLink: async (packageId, returnUrl, cancelUrl) => {
    return axiosClient.post('/user/payments/process', {
      teacherPackageId: packageId,
      redirectUrl: returnUrl,
      cancelUrl: cancelUrl
    });
  },

  // Xác nhận thanh toán (thường dùng khi redirect về)
  // orderCode: Mã đơn hàng PayOS trả về
  confirmPayment: async (orderCode) => {
    return axiosClient.get(`/user/payments/confirm?orderCode=${orderCode}`);
  },

  // Lấy lịch sử giao dịch
  getPaymentHistory: async () => {
    return axiosClient.get('/user/payments/history');
  }
};

export default paymentService;
