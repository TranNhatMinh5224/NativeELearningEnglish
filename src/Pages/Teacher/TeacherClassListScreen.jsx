import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../Theme/colors';
import { scale } from '../../Theme/responsive';
import teacherService from '../../Services/teacherService';

const TeacherClassListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [])
  );

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getMyCourses({ PageIndex: 1, PageSize: 50 });
      const coursesList = response?.data?.items || response?.items || response?.data || [];
      setCourses(coursesList);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lớp học của tôi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
            <Text style={styles.emptySubtext}>Tạo lớp học mới để bắt đầu</Text>
          </View>
        ) : (
          courses.map((item, index) => {
            const courseId = item.courseId || item.id || item.CourseId || item.Id;
            const title = item.title || item.name || item.Title || item.Name || 'Không có tên';
            
            return (
              <TouchableOpacity
                key={courseId || index}
                style={styles.courseCard}
                onPress={() => {
                  // TODO: Navigate to course detail
                  console.log('Navigate to course:', courseId);
                }}
              >
                <View style={styles.courseIcon}>
                  <Ionicons name="school" size={24} color={colors.primary} />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{title}</Text>
                  <Text style={styles.courseMeta}>
                    {item.studentCount || 0} học viên
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: scale(14),
    color: colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: scale(14),
    color: colors.textLight,
    marginTop: 8,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: scale(12),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  courseMeta: {
    fontSize: scale(12),
    color: colors.textLight,
  },
});

export default TeacherClassListScreen;

