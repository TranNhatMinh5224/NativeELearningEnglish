import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import { mochiWelcome } from '../../../assets/images';

const FeatureItem = ({ icon, title, description }) => (
  <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={scale(24)} color={colors.primary} />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={scale(20)} color={colors.textLight} />
  </TouchableOpacity>
);

const GuestView = ({ onLogin, onRegister }) => (
  <ScrollView 
    style={styles.container}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.content}
  >
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Image source={mochiWelcome} style={styles.logo} resizeMode="contain" />
        </View>
      </View>
      <Text style={styles.title}>Chào mừng bạn!</Text>
      <Text style={styles.subtitle}>
        Đăng nhập để truy cập đầy đủ tính năng và theo dõi tiến trình học tập của bạn.
      </Text>
    </LinearGradient>

    <View style={styles.features}>
      <FeatureItem
        icon="library"
        title="Khóa học của bạn"
        description="Truy cập các khóa học đã đăng ký"
      />
      <FeatureItem
        icon="document-text"
        title="Ôn tập từ vựng"
        description="Củng cố từ vựng với flashcard thông minh"
      />
      <FeatureItem
        icon="stats-chart"
        title="Theo dõi tiến trình"
        description="Xem thống kê học tập chi tiết"
      />

      <TouchableOpacity style={styles.loginButton} onPress={onLogin} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Ionicons name="log-in-outline" size={scale(22)} color="#FFF" />
          <Text style={styles.loginText}>Đăng nhập</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerButton} onPress={onRegister} activeOpacity={0.7}>
        <Text style={styles.registerText}>Chưa có tài khoản? </Text>
        <Text style={styles.registerLink}>Đăng ký ngay</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoContainer: { marginBottom: 20 },
  logoCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '70%', height: '70%' },
  title: {
    fontSize: scale(26),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: scale(14),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: { padding: 20 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: scale(12),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: scale(12),
    color: colors.textLight,
  },
  loginButton: {
    marginTop: 20,
    marginBottom: 16,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#FFF',
  },
  registerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerText: {
    fontSize: scale(14),
    color: colors.textLight,
  },
  registerLink: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.primary,
  },
});

export default GuestView;
