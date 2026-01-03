export const getResponseData = (res) => {
  if (!res) return null;
  
  // Chỉ bóc lớp .data của Axios nếu có
  // Nếu axiosClient đã bóc rồi (unwrap) thì trả về chính res
  const data = res.data !== undefined ? res.data : res;
  
  return data;
};