import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import colors from '../../Theme/colors';
import teacherService from '../../Services/teacherService';
import { getResponseData } from '../../Utils/apiHelper';
import Toast from '../../Components/Common/Toast';
import LessonModal from '../../Components/Teacher/LessonModal';
import AddStudentModal from '../../Components/Teacher/AddStudentModal';
import StudentDetailModal from '../../Components/Teacher/StudentDetailModal';

const DEFAULT_COURSE_IMAGE = require('../../../assets/images/mochi-course-teacher.jpg');
const DEFAULT_LESSON_IMAGE = require('../../../assets/images/mochi-lesson-teacher.jpg');
const Tab = createMaterialTopTabNavigator();

// --- Custom Tab Bar with "|" separator ---
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.customTabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <React.Fragment key={route.key}>
            <View style={styles.tabItemContainer}>
              <TouchableOpacity
                onPress={onPress}
                style={styles.tabItem}
              >
                <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
                  {label}
                </Text>
                {isFocused && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </View>
            {index < state.routes.length - 1 && (
              <View style={styles.separator} pointerEvents="none" />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// --- TAB: OVERVIEW ---
const OverviewTab = ({ course, onEdit }) => {
  if (!course) {
    return (
      <View style={[styles.tabContent, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalStudents = course.totalStudents || course.TotalStudents || 0;
  const totalLessons = course.totalLessons || course.TotalLessons || 0;
  const classCode = course.classCode || course.ClassCode || 'N/A';
  const description = course.description || course.Description || 'Chưa có mô tả';
  const courseImage = course.imageUrl || course.ImageUrl || null;
  const courseTitle = course.title || course.Title || 'Khóa học';

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.courseImageCard}>
        {courseImage ? (
          <Image source={{ uri: courseImage }} style={styles.courseImage} resizeMode="cover" />
        ) : (
          <Image source={DEFAULT_COURSE_IMAGE} style={styles.courseImage} resizeMode="cover" />
        )}
      </View>

      <View style={styles.courseInfoCard}>
        <Text style={styles.courseTitleText}>{courseTitle}</Text>
        <Text style={styles.courseDescriptionText}>{description}</Text>

        <View style={styles.courseDetailsSection}>
          <View style={styles.courseDetailItem}>
            <Text style={styles.courseDetailLabel}>Mã khóa học:</Text>
            <View style={styles.courseCodeContainer}>
              <Text style={styles.courseCodeText}>{classCode}</Text>
            </View>
          </View>
          <View style={styles.courseDetailItem}>
            <Text style={styles.courseDetailLabel}>Bài học:</Text>
            <Text style={styles.courseDetailValue}>{totalLessons}</Text>
          </View>
          <View style={styles.courseDetailItem}>
            <Text style={styles.courseDetailLabel}>Tổng số học sinh:</Text>
            <Text style={styles.courseDetailValue}>{totalStudents}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={onEdit}>
          <Text style={styles.updateButtonText}>Cập nhật</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// --- TAB: CURRICULUM ---
const CurriculumTab = ({ lessons, onAddLesson, onEditLesson, onAddModule, refreshing, onRefresh }) => {
  return (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {lessons.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyText}>Chưa có bài học nào</Text>
          <Text style={styles.emptySubtext}>Thêm bài học mới để bắt đầu</Text>
        </View>
      ) : (
        lessons.map((lesson, index) => {
          const lessonId = lesson.lessonId || lesson.LessonId || index;
          const lessonTitle = lesson.title || lesson.Title || `Bài học ${index + 1}`;
          const lessonImage = lesson.imageUrl || lesson.ImageUrl || null;

          return (
            <View key={lessonId} style={styles.lessonItemCard}>
              <TouchableOpacity
                style={styles.lessonItemContent}
                onPress={() => onEditLesson(lesson)}
                activeOpacity={0.7}
              >
                <Image
                  source={lessonImage ? { uri: lessonImage } : DEFAULT_LESSON_IMAGE}
                  style={styles.lessonItemImage}
                  resizeMode="cover"
                />
                <Text style={styles.lessonItemTitle} numberOfLines={2}>
                  {lessonTitle}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addModuleButton}
                onPress={() => onAddModule(lesson)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.addModuleButtonText}>Thêm Module</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.addLessonButton} onPress={onAddLesson} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={24} color="#FFF" />
        <Text style={styles.addLessonButtonText}>Thêm Lesson</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// --- TAB: STUDENTS ---
const StudentsTab = ({ courseId, refreshing, onRefresh }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [courseId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await teacherService.getCourseStudents(courseId);
      const data = getResponseData(response);
      
      // Handle pagination response (web app returns { items, totalCount, totalPages })
      // or simple array
      let studentsList = [];
      if (Array.isArray(data)) {
        studentsList = data;
      } else if (data?.items || data?.Items) {
        studentsList = data.items || data.Items || [];
      } else if (data?.students || data?.Students) {
        studentsList = data.students || data.Students || [];
      }
      
      setStudents(studentsList);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Không thể tải danh sách học viên');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadStudents();
    if (onRefresh) onRefresh();
  };

  const handleRemoveStudent = (studentId) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa học viên này khỏi khóa học?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await teacherService.removeStudentFromCourse(courseId, studentId);
            Toast.show('Đã xóa học viên khỏi khóa học', 'success');
            loadStudents();
          } catch (err) {
            console.error('Error removing student:', err);
            Toast.show('Không thể xóa học viên', 'error');
          }
        },
      },
    ]);
  };

  const handleAddStudentSuccess = () => {
    loadStudents();
  };

  const handleStudentClick = async (studentId) => {
    try {
      const response = await teacherService.getStudentDetail(courseId, studentId);
      const data = getResponseData(response);
      if (data) {
        setSelectedStudent(data);
        setShowStudentDetailModal(true);
      }
    } catch (err) {
      console.error('Error fetching student detail:', err);
      Toast.show('Không thể tải thông tin học viên', 'error');
    }
  };

  if (loading && students.length === 0) {
    return (
      <View style={[styles.tabContent, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && students.length === 0) {
    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>Chưa có học viên nào</Text>
            <Text style={styles.emptySubtext}>Học viên sẽ xuất hiện ở đây khi đăng ký khóa học</Text>
            <TouchableOpacity
              style={styles.addStudentButton}
              onPress={() => setShowAddStudentModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.addStudentButtonText}>Thêm học viên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.studentsHeader}>
              <Text style={styles.studentsCount}>
                Tổng số học viên: {String(students.length)}
              </Text>
                <TouchableOpacity
                  style={styles.addStudentButtonSmall}
                  onPress={() => setShowAddStudentModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color="#FFF" />
                  <Text style={styles.addStudentButtonSmallText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            {students.map((student, index) => {
              if (!student) return null;
              
              const studentId = student.userId || student.UserId || student.id || student.Id || index;
              const studentName =
                student.fullName || 
                student.FullName || 
                student.displayName ||
                student.DisplayName ||
                `${student.firstName || student.FirstName || ''} ${student.lastName || student.LastName || ''}`.trim() ||
                student.name || 
                student.Name || 
                'Không có tên';
              const studentEmail = student.email || student.Email || '';
              const avatarUrl = student.avatarUrl || student.AvatarUrl;

              return (
                <TouchableOpacity
                  key={String(studentId)}
                  style={styles.studentItem}
                  onPress={() => handleStudentClick(studentId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentAvatar}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.studentAvatarImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {String(studentName)}
                    </Text>
                    {studentEmail ? (
                      <Text style={styles.studentEmail} numberOfLines={1}>
                        {String(studentEmail)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.studentActions}>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveStudent(studentId);
                      }} 
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} style={styles.chevronIcon} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddStudentModal
        visible={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={handleAddStudentSuccess}
        courseId={courseId}
      />

      <StudentDetailModal
        visible={showStudentDetailModal}
        onClose={() => {
          setShowStudentDetailModal(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        courseId={courseId}
      />
    </>
  );
};

// --- MAIN SCREEN ---
const TeacherCourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [lessons, setLessons] = useState([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    loadCourseDetail();
    loadLessons();
  }, [courseId]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getCourseById(courseId);
      const data = getResponseData(response);
      setCourse(data);
    } catch (error) {
      console.error('Error loading course detail:', error);
      setToast({ visible: true, message: 'Không thể tải thông tin khóa học', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async () => {
    try {
      const response = await teacherService.getLessonsByCourse(courseId);
      const data = getResponseData(response);
      setLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCourseDetail(), loadLessons()]);
    setRefreshing(false);
  };

  const handleEditCourse = () => {
    if (!course) return;
    navigation.navigate('CreateCourse', {
      courseData: {
        courseId: course.courseId || course.CourseId || courseId,
        title: course.title || course.Title || '',
        description: course.description || course.Description || '',
        imageUrl: course.imageUrl || course.ImageUrl || null,
        maxStudent: course.maxStudent || course.MaxStudent || 0,
      },
      isUpdateMode: true,
    });
  };

  const handleAddLesson = () => {
    setSelectedLesson(null);
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const handleAddModule = (lesson) => {
    const lessonId = lesson.lessonId || lesson.LessonId;
    if (lessonId) {
      navigation.navigate('TeacherLessonDetail', {
        courseId: courseId,
        lessonId: lessonId,
      });
    }
  };

  const handleLessonSuccess = () => {
    loadLessons();
    loadCourseDetail();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Quản lý khóa học
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* TAB NAVIGATOR - ĐÃ FIX TRIỆT ĐỂ */}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            lazy: true,
            swipeEnabled: true,
          }}
          sceneContainerStyle={{ backgroundColor: '#F3F4F6' }}
        >
          <Tab.Screen name="Overview" options={{ tabBarLabel: 'Tổng quan' }}>
            {() => <OverviewTab course={course} onEdit={handleEditCourse} />}
          </Tab.Screen>

          <Tab.Screen name="Curriculum" options={{ tabBarLabel: 'Chương trình' }}>
            {() => (
              <CurriculumTab
                lessons={lessons}
                onAddLesson={handleAddLesson}
                onEditLesson={handleEditLesson}
                onAddModule={handleAddModule}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="Students" options={{ tabBarLabel: 'Học viên' }}>
            {() => (
              <StudentsTab
                courseId={courseId}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>

      <LessonModal
        visible={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        courseId={courseId}
        lesson={selectedLesson}
        onSuccess={handleLessonSuccess}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Custom Tab Bar Styles
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderBottomWidth: 0,
  },
  tabItemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabLabelInactive: {
    color: '#9CA3AF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  separator: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'stretch',
  },

  tabContent: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },

  courseImageCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  courseImage: { width: '100%', height: 200 },

  courseInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  courseTitleText: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  courseDescriptionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  courseDetailsSection: { marginBottom: 20 },
  courseDetailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  courseDetailLabel: { fontSize: 14, color: colors.textSecondary, minWidth: 120, fontWeight: '500' },
  courseCodeContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  courseCodeText: { fontSize: 14, color: colors.text },
  courseDetailValue: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },

  updateButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: { fontSize: 16, fontWeight: '500', color: colors.text },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: '500', marginTop: 16 },
  emptySubtext: { color: colors.textLight, fontSize: 14, marginTop: 8 },

  lessonItemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  lessonItemContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  lessonItemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#F0F0F0' },
  lessonItemTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },

  addModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  addModuleButtonText: { color: '#FFF', fontSize: 14, fontWeight: '500' },

  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addLessonButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },

  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  studentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  studentEmail: { fontSize: 13, color: colors.textLight },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: { padding: 8, borderRadius: 6, backgroundColor: '#FEE2E2' },
  chevronIcon: { marginLeft: 4 },
  studentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  studentsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  addStudentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addStudentButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  addStudentButtonSmallText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TeacherCourseDetailScreen;