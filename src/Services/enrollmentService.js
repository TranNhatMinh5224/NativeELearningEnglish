import axiosClient from './axiosClient';

const enrollmentService = {
  /**
   * Đăng ký khóa học
   * @param {object} data - { courseId }
   * @returns {Promise} Response đăng ký
   */
  enroll: (data) => {
    return axiosClient.post('/user/enrollments/course', data);
  },

  /**
   * Lấy danh sách khóa học đã đăng ký với phân trang
   * @param {number} pageNumber - Số trang (mặc định 1)
   * @param {number} pageSize - Số lượng bản ghi mỗi trang (mặc định 25)
   * @returns {Promise} Response chứa danh sách courses
   */
  getMyCourses: (pageNumber = 1, pageSize = 25) => {
    return axiosClient.get('/user/enrollments/my-courses', {
      params: { pageNumber, pageSize }
    });
  },

  /**
   * Tham gia khóa học bằng mã lớp
   * @param {object} data - { classCode }
   * @returns {Promise} Response tham gia
   */
  joinByClassCode: (data) => {
    return axiosClient.post('/user/enrollments/join-by-class-code', data);
  },
};

export default enrollmentService;


