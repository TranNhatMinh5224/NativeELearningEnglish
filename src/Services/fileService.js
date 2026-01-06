import axiosClient from './axiosClient';

const fileService = {
  // Upload file lên server (thư mục tạm) - cho avatar
  uploadFile: async (fileUri, fileName = 'avatar.jpg') => {
    const formData = new FormData();
    
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    });

    try {
      // Backend: POST /api/shared/files/temp-file?BucketName=avatars&TempFolder=temp
      const response = await axiosClient.post('/shared/files/temp-file', formData, {
        params: {
            BucketName: 'avatars',
            TempFolder: 'temp'
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  
  uploadTempFile: async (file, bucketName, tempFolder = 'temp') => {
    const formData = new FormData();
    
    // React Native: file is { uri, name, type }
    // Web: file is File object
    if (file && file.uri) {
      // React Native: { uri, name, type }
      formData.append('file', file);
    } else {
      // Web: File object
      formData.append('file', file);
    }

    // Backend expects query params: BucketName and TempFolder (PascalCase) hoặc bucketName và tempFolder (camelCase)
    // Thử cả 2 format để đảm bảo tương thích
    return axiosClient.post(
      `/shared/files/temp-file?BucketName=${bucketName}&TempFolder=${tempFolder}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
};

export default fileService;
