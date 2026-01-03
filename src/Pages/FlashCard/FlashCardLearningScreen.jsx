import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import flashcardReviewService from '../../Services/flashcardReviewService';
import lessonService from '../../Services/lessonService';
import FlashCardItem from '../../Components/FlashCard/FlashCardItem';

const { width } = Dimensions.get('window');

const FlashCardLearningScreen = ({ navigation, route }) => {
  const { moduleId, moduleName } = route.params;
  const insets = useSafeAreaInsets();
  
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const response = await flashcardReviewService.getFlashcardsByModule(moduleId);
      
      // Handle response - backend returns ServiceResponse format
      let flashcardsData = [];
      if (response?.data?.success && response?.data?.data) {
        flashcardsData = response.data.data;
      } else if (response?.data) {
        flashcardsData = Array.isArray(response.data) ? response.data : [];
      }
      
      setFlashcards(flashcardsData);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải danh sách từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      // Gọi API startModule (cũng là api mark complete cho flashcard module)
      await lessonService.startModule(moduleId);

      // Điều hướng sang màn hình kết quả bài học
      navigation.replace('LessonResultScreen', {
        type: 'flashcard',
        moduleName,
        totalItems: flashcards.length,
      });
    } catch (error) {
      console.error('Error completing module:', error);
      Alert.alert('Lỗi', 'Không thể lưu tiến độ học tập.');
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thẻ bài...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="albums-outline" size={64} color={colors.textLight} />
        <Text style={styles.errorText}>Không có thẻ nào trong bài này</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Progress Bar - Giống Web app */}
      <View style={styles.headerContainer}>
        <View style={styles.progressTopRow}>
          <Text style={styles.progressLabel}>Số lượng</Text>
          <Text style={styles.progressCount}>
            {currentIndex + 1}/{flashcards.length}
          </Text>
        </View>
        <View style={styles.progressBottomRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.closeButton}
          >
            <Ionicons name="close" size={scale(20)} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#41D6E3', '#D946EF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / flashcards.length) * 100}%` }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Cards List - Full width, không có mũi tên 2 bên */}
      <View style={styles.cardsContainer}>
        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={flashcards}
            renderItem={({ item, index }) => (
              <View style={styles.cardWrapper}>
                <FlashCardItem card={item} active={index === currentIndex} />
              </View>
            )}
            keyExtractor={(item) => item.flashCardId?.toString() || Math.random().toString()}
            horizontal
            pagingEnabled={true} // Bật paging để chỉ hiển thị 1 card
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            scrollEnabled={true}
            snapToInterval={width} // Snap theo full screen width
            snapToAlignment="start" // Snap từ đầu
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
            getItemLayout={(data, index) => {
              return {
                length: width, // Full screen width
                offset: width * index,
                index,
              };
            }}
          />
        </View>
      </View>

      {/* Navigation Buttons ở dưới - Đẹp hơn */}
      <View style={[styles.bottomNavigation, { paddingBottom: insets.bottom + scale(20) }]}>
        {currentIndex > 0 && (
          <TouchableOpacity 
            style={styles.navButtonBottom}
            onPress={handlePrev}
          >
            <Ionicons name="chevron-back" size={scale(20)} color="#FFFFFF" />
            <Text style={styles.navButtonText}>Trước đó</Text>
          </TouchableOpacity>
        )}
        
        {currentIndex < flashcards.length - 1 ? (
          <TouchableOpacity 
            style={[styles.navButtonBottom, styles.navButtonNext]}
            onPress={handleNext}
            disabled={completing}
          >
            <Text style={styles.navButtonText}>Tiếp theo</Text>
            <Ionicons name="chevron-forward" size={scale(20)} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navButtonBottom, styles.completeButtonBottom]}
            onPress={handleComplete}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={scale(20)} color="#FFFFFF" />
                <Text style={styles.navButtonText}>Hoàn thành</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  // Header với Progress Bar - Giống Web app
  headerContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
    backgroundColor: '#FFFFFF',
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  progressLabel: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#1F2937',
  },
  progressCount: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  closeButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  progressTrack: {
    flex: 1,
    height: scale(12),
    backgroundColor: '#E5E7EB',
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(6),
  },
  // Cards Container - Full width, không có mũi tên 2 bên
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  // List Container - Full width
  listContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden', // Ngăn hiển thị card tiếp theo
  },
  flatListContent: {
    alignItems: 'center',
  },
  cardWrapper: {
    width: width, // Full screen width để paging hoạt động đúng
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20), // Padding bên trong
  },
  // Bottom Navigation - Đẹp hơn
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    gap: scale(12),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButtonBottom: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#41D6E3', // Cyan color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonNext: {
    backgroundColor: '#10B981', // Green color cho nút tiếp theo
  },
  completeButtonBottom: {
    backgroundColor: '#10B981', // Green color cho nút hoàn thành
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
  // Complete Button - Giống Web app
  completeButtonContainer: {
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(20),
    alignItems: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(10),
    minWidth: scale(250),
    height: scale(60),
    paddingHorizontal: scale(40),
    borderRadius: scale(30),
    backgroundColor: '#10B981', // Green like Web app
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default FlashCardLearningScreen;
