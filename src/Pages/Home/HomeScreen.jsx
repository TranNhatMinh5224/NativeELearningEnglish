import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import CourseCard from '../../Components/Courses/CourseCard';
import EmptyState from '../../Components/Home/EmptyState';
import courseService from '../../Services/courseService';
import authService from '../../Services/authService';
import notificationService from '../../Services/notificationService';
import { useNotifications } from '../../Context/NotificationContext';
import { mochiWelcome } from '../../../assets/images';
import {
  FeatureSectionOne,
  FeatureSectionTwo,
  WelcomeFooter,
} from '../../Components/Welcome';

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data lần đầu khi component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load data khi màn hình được focus (để reload sau khi đăng nhập hoặc thanh toán)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Load user and courses data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      const loggedIn = await authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      // Get current user if logged in
      if (loggedIn) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Load unread notification count via Context (Same as Web logic)
        await fetchUnreadCount();
      }

      // Load featured courses (public - không cần đăng nhập)
      const featuredCoursesRes = await courseService.getFeaturedCourses().catch((err) => {
        console.error('Error loading featured courses:', err);
        return { data: [] };
      });
      
      const featuredCoursesData = featuredCoursesRes?.data || featuredCoursesRes || [];
      setFeaturedCourses(Array.isArray(featuredCoursesData) ? featuredCoursesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setFeaturedCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Navigate to course detail
  const handleCoursePress = (course) => {
    const courseId = course.CourseId || course.courseId || course.id;
    if (courseId) {
      navigation.navigate('CourseDetail', { courseId });
    }
  };

  // Navigate to Login
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Navigate to Register
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Memoize filtered courses để tránh re-calculate mỗi lần render
  const { freeCourses, paidCourses } = useMemo(() => {
    const free = featuredCourses.filter(course => {
      const price = course.Price || course.price || 0;
      return !price || price === 0;
    });
    const paid = featuredCourses.filter(course => {
      const price = course.Price || course.price || 0;
      return price && price > 0;
    });
    return { freeCourses: free, paidCourses: paid };
  }, [featuredCourses]);



  // Render header with gradient
  const renderHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + verticalScale(8) }]}
    >
      {/* Logo and User Info */}
      <View style={styles.headerTop}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={mochiWelcome}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Catalunya English</Text>
        </View>
        
        <View style={styles.headerRight}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity style={styles.coinBadge}>
                <Text style={styles.coinIcon}>💰</Text>
                <Text style={styles.coinText}>0 ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications" size={scale(20)} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                activeOpacity={0.7}
              >
                <Text style={styles.registerText}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        {renderHeader()}

        {/* Nội dung khác nhau tùy thuộc vào trạng thái đăng nhập */}
        {isLoggedIn ? (
          /* ===== GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP ===== */
          <View style={styles.content}>
            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Chào mừng trở lại, {user?.firstName || user?.lastName || 'Bạn'} ✨
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Hãy tiếp tục hành trình học tiếng Anh nào. 🎉
              </Text>
            </View>

            {/* Search Bar */}
            <TouchableOpacity
              style={styles.searchContainer}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={scale(20)} color={colors.textSecondary} style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>Tìm kiếm khóa học...</Text>
            </TouchableOpacity>

            {/* Featured Courses Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Kho tàng khóa học nổi bật ⭐
                </Text>
              </View>

              {featuredCourses.length === 0 ? (
                <EmptyState
                  title="Chưa có khóa học nào"
                  message="Các khóa học sẽ sớm được cập nhật!"
                />
              ) : (
                <View style={styles.coursesList}>
                  {/* Free Courses Section */}
                  {freeCourses.length > 0 && (
                    <View style={styles.courseSection}>
                      <View style={styles.courseSectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                          <Ionicons name="gift-outline" size={scale(20)} color={colors.success} />
                          <Text style={styles.courseSectionTitle}>Khóa học miễn phí</Text>
                        </View>
                        <View style={styles.sectionBadge}>
                          <Text style={styles.sectionBadgeText}>{freeCourses.length}</Text>
                        </View>
                      </View>
                      {freeCourses.map((course) => (
                        <CourseCard
                          key={course.CourseId || course.courseId || course.id}
                          course={course}
                          showProgress={false}
                          onPress={() => handleCoursePress(course)}
                        />
                      ))}
                    </View>
                  )}

                  {/* Paid Courses Section */}
                  {paidCourses.length > 0 && (
                    <View style={styles.courseSection}>
                      <View style={styles.courseSectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                          <Ionicons name="diamond-outline" size={scale(20)} color={colors.primary} />
                          <Text style={styles.courseSectionTitle}>Khóa học premium</Text>
                        </View>
                        <View style={styles.sectionBadge}>
                          <Text style={styles.sectionBadgeText}>{paidCourses.length}</Text>
                        </View>
                      </View>
                      {paidCourses.map((course) => (
                        <CourseCard
                          key={course.CourseId || course.courseId || course.id}
                          course={course}
                          showProgress={false}
                          onPress={() => handleCoursePress(course)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* ===== GIAO DIỆN KHI CHƯA ĐĂNG NHẬP - WELCOME PAGE ===== */
          <>
            {/* Feature Sections */}
            <FeatureSectionOne featureImage={mochiWelcome} />
            <FeatureSectionTwo featureImage={mochiWelcome} />

            {/* Footer */}
            <WelcomeFooter />
          </>
        )}

        {/* Bottom Spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    paddingBottom: verticalScale(12),
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImage: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
  },
  appName: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loginButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: scale(14),
    marginRight: 8,
  },
  coinIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  coinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  notificationButton: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Quan trọng để badge absolute
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: colors.primary, // Viền cùng màu header cho đẹp
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: verticalScale(100),
  },
  coursesList: {
    gap: 16,
  },
  courseSection: {
    marginBottom: 24,
  },
  courseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    borderRadius: scale(12),
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalScroll: {
    marginHorizontal: -24,
  },
  horizontalCoursesList: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    gap: 16,
  },
  courseCardWrapper: {
    width: scale(280),
    marginRight: 16,
  },
  guestButtonsContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(32),
    backgroundColor: '#FFFFFF',
  },
  guestLoginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: scale(12),
    width: '100%',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guestLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  guestRegisterButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: scale(12),
    width: '100%',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  guestRegisterText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  guestCoursesSection: {
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(24),
    backgroundColor: '#FFFFFF',
  },
  guestCoursesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(20),
  },
});

export default HomeScreen;
