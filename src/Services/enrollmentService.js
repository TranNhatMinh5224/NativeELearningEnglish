import axiosClient from './axiosClient';

const enrollmentService = {
  /**
   * Đăng ký khóa học
   * @param {object} data - { CourseId } (PascalCase)
   * @returns {Promise} Response đăng ký
   */
  enroll: (data) => {
    // Backend DTO yêu cầu PascalCase: CourseId
    // Đảm bảo format đúng nếu caller gửi camelCase
    const payload = {
      CourseId: data.CourseId || data.courseId,
    };
    return axiosClient.post('/user/enrollments/course', payload);
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
   * @param {object} data - { ClassCode } (PascalCase)
   * @returns {Promise} Response tham gia
   */
  joinByClassCode: (data) => {
    // Backend DTO yêu cầu PascalCase: ClassCode
    // Đảm bảo format đúng nếu caller gửi camelCase
    const payload = {
      ClassCode: data.ClassCode || data.classCode,
    };
    return axiosClient.post('/user/enrollments/join-by-class-code', payload);
  },
};

export default enrollmentService;

