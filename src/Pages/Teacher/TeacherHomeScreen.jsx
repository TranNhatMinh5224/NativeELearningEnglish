import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import teacherService from '../../Services/teacherService';
import authService from '../../Services/authService';
import { getResponseData } from '../../Utils/apiHelper';

const TeacherHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ totalCourses: 0 });
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      // Lấy danh sách lớp để lấy TotalCount
      const coursesRes = await teacherService.getMyCourses({ 
        pageNumber: 1, 
        pageSize: 1 // Chỉ cần TotalCount, không cần lấy tất cả courses
      });
      
      const responseData = getResponseData(coursesRes);
      const totalCount = responseData?.totalCount || responseData?.TotalCount || 0;
      
      setStats({
        totalCourses: totalCount, // Dùng TotalCount từ backend
      });
    } catch (error) {
      console.error('Error loading teacher home:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#4F46E5']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.teacherName}>Giáo viên {user?.firstName || user?.fullName || ''}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || user?.fullName?.charAt(0) || 'T'}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalCourses}</Text>
            <Text style={styles.statLabel}>Lớp học</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.sectionTitle}>Quản lý nhanh</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('TeacherClasses')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="school" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Lớp học của tôi</Text>
            <Text style={styles.actionDesc}>Quản lý các lớp đang dạy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateCourse')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="add-circle" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionTitle}>Tạo lớp mới</Text>
            <Text style={styles.actionDesc}>Mở lớp học mới ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  teacherName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default TeacherHomeScreen;

