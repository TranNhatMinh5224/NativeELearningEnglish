import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import courseService from '../../Services/courseService';
import CourseCard from '../../Components/Courses/CourseCard';
import Toast from '../../Components/Common/Toast';

const SearchScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState(route?.params?.initialQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Auto search when query changes (with debounce)
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timer = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      
      const response = await courseService.searchCourses(query.trim());
      
      // Backend trả về ServiceResponse: { success, data, message, statusCode }
      const results = response?.data || response || [];
      
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error searching courses:', error);
      setSearchResults([]);
      setToast({
        visible: true,
        message: error?.message || 'Tìm kiếm thất bại',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (course) => {
    const courseId = course.CourseId || course.courseId || course.id;
    if (courseId) {
      navigation.navigate('CourseDetail', { courseId });
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
        </TouchableOpacity>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={scale(20)} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Ionicons name="close-circle" size={scale(20)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
          </View>
        ) : hasSearched ? (
          searchResults.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                Tìm thấy {searchResults.length} khóa học
              </Text>
              <View style={styles.resultsList}>
                {searchResults.map((course) => (
                  <CourseCard
                    key={course.CourseId || course.courseId || course.id}
                    course={course}
                    showProgress={false}
                    onPress={() => handleCoursePress(course)}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={scale(64)} color={colors.textLight} />
              <Text style={styles.emptyText}>Không tìm thấy khóa học nào</Text>
              <Text style={styles.emptySubtext}>
                Thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          )
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={scale(64)} color={colors.textLight} />
            <Text style={styles.emptyText}>Nhập từ khóa để tìm kiếm</Text>
            <Text style={styles.emptySubtext}>
              Tìm kiếm theo tên khóa học, mô tả...
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SAFE_AREA_PADDING.top,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: scale(12),
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(80),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  resultsList: {
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SearchScreen;

