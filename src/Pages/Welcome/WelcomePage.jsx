import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import LoadingScreen from '../../Components/Loading';
import {
  WelcomeHeader,
  HeroSection,
  FeatureSectionOne,
  FeatureSectionTwo,
  PricingSection,
  WelcomeFooter,
} from '../../Components/Welcome';
import { welcome, mochiWelcome } from '../../../assets/images';

const WelcomePage = ({ navigation }) => {
  const [showLoading, setShowLoading] = useState(true);

  // Handlers with navigation
  const handleLoadingFinish = useCallback(() => {
    setShowLoading(false);
  }, []);

  const handleLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  const handleGetStarted = useCallback(() => {
    // TODO: Navigate to main app or course selection
    Alert.alert('Bắt đầu', 'Chức năng đang được phát triển');
    // navigation.navigate('CourseSelection');
  }, []);

  const handleJoinGroup = useCallback(() => {
    // TODO: Open link or navigate to group
    Alert.alert('Tham gia nhóm', 'Chức năng đang được phát triển');
    // Linking.openURL('https://...');
  }, []);

  const handleLearnMore = useCallback(() => {
    // TODO: Navigate to course details
    Alert.alert('Tìm hiểu thêm', 'Chức năng đang được phát triển');
    // navigation.navigate('CourseDetails', { courseId: 'ielts-adaptive' });
  }, []);

  const handleSelectPlan = useCallback((plan) => {
    // TODO: Navigate to payment screen
    Alert.alert('Chọn gói', `Bạn đã chọn: ${plan.duration}\nGiá: ${plan.price}`);
    // navigation.navigate('Payment', { planId: plan.id });
  }, []);

  if (showLoading) {
    return <LoadingScreen onFinish={handleLoadingFinish} />;
  }

  return (
    <View style={styles.container}>
      <WelcomeHeader onLoginPress={handleLogin} onRegisterPress={handleRegister} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <HeroSection heroImage={welcome} onGetStarted={handleGetStarted} />

        <FeatureSectionOne
          featureImage={mochiWelcome}
          onJoinGroup={handleJoinGroup}
        />

        <FeatureSectionTwo
          featureImage={mochiWelcome}
          onLearnMore={handleLearnMore}
        />

        <PricingSection onSelectPlan={handleSelectPlan} />

        <WelcomeFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
});

export default WelcomePage;
