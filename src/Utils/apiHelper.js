export const getResponseData = (res) => {
  if (!res) return null;
  
  // Chỉ bóc lớp .data của Axios nếu có
  // Nếu axiosClient đã bóc rồi (unwrap) thì trả về chính res
  const data = res.data !== undefined ? res.data : res;
  
  // Backend trả về ServiceResponse<T> format:
  // { Success: true, Data: {...}, Message: "..." }
  // hoặc { success: true, data: {...}, message: "..." }
  // Nếu có Data/data thì trả về Data/data, nếu không thì trả về chính data
  if (data?.Data !== undefined) {
    return data.Data;
  }
  if (data?.data !== undefined && data?.success !== undefined) {
    return data.data;
  }
  
  return data;
};