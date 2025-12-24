import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import { useFadeIn } from '../../Theme/animations';
import CourseCard from '../../Components/Courses/CourseCard';
import EmptyState from '../../Components/Home/EmptyState';
import courseService from '../../Services/courseService';
import authService from '../../Services/authService';
import { mochiWelcome } from '../../../assets/images';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fadeIn = useFadeIn();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load user and courses data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      // Load courses in parallel
      const [myCoursesRes, featuredCoursesRes] = await Promise.all([
        courseService.getMyCourses().catch((err) => {
          console.error('Error loading my courses:', err);
          return { data: [] };
        }),
        courseService.getFeaturedCourses().catch((err) => {
          console.error('Error loading featured courses:', err);
          return { data: [] };
        }),
      ]);

      // Backend trả về ServiceResponse: { success, data, message, statusCode }
      // axiosClient đã unwrap response.data, nên response trực tiếp là ServiceResponse
      const myCoursesData = myCoursesRes?.data || myCoursesRes || [];
      const featuredCoursesData = featuredCoursesRes?.data || featuredCoursesRes || [];

      console.log('My courses count:', Array.isArray(myCoursesData) ? myCoursesData.length : 0);
      console.log('Featured courses count:', Array.isArray(featuredCoursesData) ? featuredCoursesData.length : 0);

      setMyCourses(Array.isArray(myCoursesData) ? myCoursesData : []);
      setFeaturedCourses(Array.isArray(featuredCoursesData) ? featuredCoursesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setMyCourses([]);
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

  // Render header with gradient (compact)
  const renderHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
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
          <TouchableOpacity style={styles.coinBadge}>
            <Text style={styles.coinText}>💰 0 ngày</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
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

        {/* Content */}
        <View style={styles.content}>
          {/* Welcome Message - Outside header */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Chào mừng trở lại, {user?.firstName || 'bạn'} ✨
            </Text>
            <Text style={styles.welcomeSubtext}>
              Hãy tiếp tục hành trình học tiếng Anh nào.
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

          {/* My Courses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Khóa học của tôi</Text>
              {myCourses.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('MyCourses')}
                >
                  <Text style={styles.seeAllText}>Xem tất cả →</Text>
                </TouchableOpacity>
              )}
            </View>

            {myCourses.length === 0 ? (
              <EmptyState
                title="Chưa có khóa học nào"
                message="Hãy khám phá các khóa học dưới đây để bắt đầu hành trình học tập của bạn!"
              />
            ) : (
              <View style={styles.coursesList}>
                {myCourses.slice(0, 3).map((course) => (
                  <CourseCard
                    key={course.CourseId || course.courseId || course.id}
                    course={course}
                    showProgress={true}
                    onPress={() => handleCoursePress(course)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Featured Courses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Kho tàng khóa học nổi bật 💎
              </Text>
            </View>

            {featuredCourses.length === 0 ? (
              <EmptyState
                title="Chưa có khóa học nào"
                message="Các khóa học sẽ sớm được cập nhật!"
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCoursesList}
                style={styles.horizontalScroll}
              >
                {featuredCourses.map((course) => (
                  <View key={course.CourseId || course.courseId || course.id} style={styles.courseCardWrapper}>
                    <CourseCard
                      course={course}
                      showProgress={false}
                      onPress={() => handleCoursePress(course)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bottom Spacing for tab bar */}
          <View style={styles.bottomSpacing} />
        </View>
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
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(20),
    paddingHorizontal: 24,
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
  },
  appName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: scale(4),
    borderRadius: scale(16),
    marginRight: 8,
  },
  coinText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationIcon: {
    fontSize: 18,
  },
  avatarButton: {
    marginLeft: 8,
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeContainer: {
    marginTop: 16,
    marginBottom: 20,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 14 * 1.5,
  },
  topNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 4,
    borderRadius: scale(8),
  },
  navTabActive: {
    backgroundColor: colors.primary + '15',
  },
  navTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  navTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 32,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: verticalScale(80),
  },
  coursesList: {
    gap: 16,
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
});

export default HomeScreen;
