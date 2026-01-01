import axiosClient from './axiosClient';

const fileService = {
  // Upload file lên server (thư mục tạm)
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
      console.error('Upload Error:', error);
      throw error.response?.data || error;
    }
  }
};

export default fileService;
