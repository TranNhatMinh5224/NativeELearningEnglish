import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../Theme/colors';
import teacherService from '../../Services/teacherService';
import { getResponseData } from '../../Utils/apiHelper';
import Toast from '../../Components/Common/Toast';
import ModuleModal from '../../Components/Teacher/ModuleModal';
import LessonModal from '../../Components/Teacher/LessonModal';

const DEFAULT_LESSON_IMAGE = require('../../../assets/images/mochi-lesson-teacher.jpg');
const DEFAULT_MODULE_IMAGE = require('../../../assets/images/mochi-module-teacher.jpg');

const TeacherLessonDetailScreen = ({ route, navigation }) => {
  const { courseId, lessonId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    if (lessonId) {
      loadLessonDetail();
      loadModules();
    }
  }, [lessonId]);

  const loadLessonDetail = async () => {
    try {
      const response = await teacherService.getLessonById(lessonId);
      const data = getResponseData(response);
      setLesson(data);
    } catch (error) {
      console.error('Error loading lesson detail:', error);
      Toast.show('Không thể tải thông tin bài học', 'error');
    }
  };

  const loadModules = async () => {
    try {
      const response = await teacherService.getModulesByLesson(lessonId);
      const data = getResponseData(response);
      const modulesList = Array.isArray(data) ? data : [];

      const modulesWithImages = await Promise.all(
        modulesList.map(async (module) => {
          try {
            const moduleId = module.moduleId || module.ModuleId;
            const detailResponse = await teacherService.getModuleById(moduleId);
            const detailData = getResponseData(detailResponse);

            if (detailData) {
              return {
                ...module,
                imageUrl: detailData.imageUrl || detailData.ImageUrl || module.imageUrl || module.ImageUrl,
                ImageUrl: detailData.imageUrl || detailData.ImageUrl || module.imageUrl || module.ImageUrl,
              };
            }
            return module;
          } catch (err) {
            console.error(`Error fetching module ${module.moduleId || module.ModuleId} detail:`, err);
            return module;
          }
        })
      );

      setModules(modulesWithImages);
    } catch (error) {
      console.error('Error loading modules:', error);
      Toast.show('Không thể tải danh sách modules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLessonDetail(), loadModules()]);
    setRefreshing(false);
  };

  const handleAddModule = () => {
    setSelectedModule(null);
    setShowModuleModal(true);
  };

  const handleEditModule = (module) => {
    setSelectedModule(module);
    setShowModuleModal(true);
  };

  const handleModuleSuccess = () => {
    loadModules();
  };

  const handleLessonSuccess = () => {
    loadLessonDetail();
    loadModules();
  };

  const handleDeleteModule = (module) => {
    const moduleId = module.moduleId || module.ModuleId;
    const moduleName = module.name || module.Name || 'module này';

    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa module "${moduleName}"? Hành động này không thể hoàn tác.`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await teacherService.deleteModule(moduleId);
              Toast.show('Đã xóa module thành công', 'success');
              loadModules();
            } catch (error) {
              console.error('Error deleting module:', error);
              const errorMessage = error?.message || error?.Message || 'Không thể xóa module';
              Toast.show(errorMessage, 'error');
            }
          },
        },
      ]
    );
  };

  const getContentTypeName = (contentType) => {
    const contentTypeMap = {
      1: 'Lecture',
      2: 'FlashCard',
      3: 'Assessment',
    };
    return contentTypeMap[contentType] || 'Unknown';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const lessonTitle = lesson?.title || lesson?.Title || 'Bài học';
  const lessonDescription = lesson?.description || lesson?.Description || '';
  const lessonImage = lesson?.imageUrl || lesson?.ImageUrl ? { uri: lesson.imageUrl || lesson.ImageUrl } : DEFAULT_LESSON_IMAGE;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Quản lý bài học
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.mainContent}>
          <View style={styles.lessonInfoCard}>
            <Image source={lessonImage} style={styles.lessonImage} resizeMode="cover" />
            <View style={styles.lessonInfoContent}>
              <Text style={styles.lessonTitle}>{lessonTitle}</Text>
              {lessonDescription ? <Text style={styles.lessonDescription}>{lessonDescription}</Text> : null}
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => setShowLessonModal(true)}
              >
                <Text style={styles.updateButtonText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modulesCard}>
            {modules.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>Chưa có module nào</Text>
              </View>
            ) : (
              modules.map((module, index) => {
                const moduleId = module.moduleId || module.ModuleId || index;
                const moduleName = module.name || module.Name || `Module ${index + 1}`;
                const moduleImageUrl = module.imageUrl || module.ImageUrl;
                const moduleImage = moduleImageUrl ? { uri: moduleImageUrl } : DEFAULT_MODULE_IMAGE;
                const contentType = module.contentType || module.ContentType || 1;
                const contentTypeName = getContentTypeName(contentType);

                return (
                  <View key={moduleId} style={styles.moduleItem}>
                    <Image source={moduleImage} style={styles.moduleImage} resizeMode="cover" />
                    <View style={styles.moduleInfo}>
                      <Text style={styles.moduleName} numberOfLines={1}>
                        {moduleName}
                      </Text>
                      <Text style={styles.moduleType}>{contentTypeName}</Text>
                    </View>
                    <View style={styles.moduleActions}>
                      <TouchableOpacity
                        style={styles.moduleUpdateButton}
                        onPress={() => handleEditModule(module)}
                      >
                        <Text style={styles.moduleUpdateButtonText}>Cập nhật</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.moduleDeleteButton}
                        onPress={() => handleDeleteModule(module)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            <TouchableOpacity style={styles.addModuleButton} onPress={handleAddModule} activeOpacity={0.8}>
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.addModuleButtonText}>Thêm Module</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <LessonModal
        visible={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        courseId={courseId}
        lesson={lesson}
        onSuccess={handleLessonSuccess}
      />

      <ModuleModal
        visible={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        lessonId={lessonId}
        module={selectedModule}
        onSuccess={handleModuleSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
    gap: 16,
  },
  lessonInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  lessonInfoContent: {
    gap: 8,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  lessonDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  updateButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modulesCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 12,
  },
  moduleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  moduleInfo: {
    flex: 1,
    gap: 4,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  moduleType: {
    fontSize: 14,
    color: colors.textLight,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleUpdateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  moduleUpdateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  moduleDeleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  addModuleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherLessonDetailScreen;

