import React from 'react';
import LoadingScreen from '../../Components/Loading';

const LoadingPage = ({ navigation }) => {
  const handleLoadingFinish = () => {
    // Sau khi loading xong, chuyển thẳng sang MainApp
    navigation.replace('MainApp');
  };

  return <LoadingScreen onFinish={handleLoadingFinish} duration={2000} />;
};

export default LoadingPage;

