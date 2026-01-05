import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../../Theme/responsive';
import colors from '../../../Theme/colors';
import pronunciationService from '../../../Services/pronunciationService';
import flashcardReviewService from '../../../Services/flashcardReviewService';
import PronunciationCard from '../../../Components/Pronunciation/PronunciationCard';

const PronunciationDetailScreen = ({ route, navigation }) => {
  const { moduleId, moduleName, lessonId, lessonTitle, courseId, courseTitle } = route.params || {};
  const insets = useSafeAreaInsets();

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchData();
    } else {
      setError('Module ID không hợp lệ');
      setLoading(false);
    }
  }, [moduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch flashcards with pronunciation progress
      const flashcardsResponse = await pronunciationService.getByModule(moduleId);
      
      // Handle response - axiosClient already unwraps response.data
      // So flashcardsResponse is already the ServiceResponse object: { success, data, message, statusCode }
      let flashcardsData = [];
      if (flashcardsResponse?.success && flashcardsResponse?.data) {
        // Standard ServiceResponse format: { success: true, data: [...] }
        flashcardsData = Array.isArray(flashcardsResponse.data) ? flashcardsResponse.data : [];
      } else if (Array.isArray(flashcardsResponse)) {
        // Direct array response
        flashcardsData = flashcardsResponse;
      } else if (flashcardsResponse?.data) {
        // Fallback: check if data exists
        flashcardsData = Array.isArray(flashcardsResponse.data) ? flashcardsResponse.data : [];
      }

      if (flashcardsData.length === 0) {
        setError(flashcardsResponse?.message || 'Không có dữ liệu flashcard');
        setFlashcards([]);
      } else {
        // Normalize flashcard data (handle both PascalCase and camelCase)
        // Response format: { word, definition, phonetic, audioUrl, imageUrl, flashCardId, example, progress }
        const flashcardsWithDetails = flashcardsData.map((flashcard) => ({
          ...flashcard,
          word: flashcard.word || flashcard.Word || flashcard.term || flashcard.Term || '',
          meaning: flashcard.meaning || flashcard.Meaning || flashcard.definition || flashcard.Definition || '',
          pronunciation: flashcard.pronunciation || flashcard.Pronunciation || flashcard.phonetic || flashcard.Phonetic || '',
          phonetic: flashcard.phonetic || flashcard.Phonetic || flashcard.pronunciation || flashcard.Pronunciation || '',
          audioUrl: flashcard.audioUrl || flashcard.AudioUrl || '',
          imageUrl: flashcard.imageUrl || flashcard.ImageUrl || '',
          flashCardId: flashcard.flashCardId || flashcard.FlashCardId || flashcard.id || flashcard.Id,
          example: flashcard.example || flashcard.Example || '',
          progress: flashcard.progress || flashcard.Progress || null,
        }));

        setFlashcards(flashcardsWithDetails);
        if (flashcardsWithDetails.length > 0) {
          setCurrentIndex(0);
        }
      }

      // Fetch summary (optional - don't fail if this fails)
      try {
        const summaryResponse = await pronunciationService.getModuleSummary(moduleId);
        // axiosClient already unwraps response.data, so summaryResponse is already the ServiceResponse
        if (summaryResponse?.success && summaryResponse?.data) {
          setSummary(summaryResponse.data);
        } else if (summaryResponse) {
          // Fallback: use response directly if it's not ServiceResponse format
          setSummary(summaryResponse);
        }
      } catch (summaryErr) {
        // Don't set error for summary failure
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu phát âm';
      setError(errorMessage);
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAssessmentComplete = async (result) => {
    // Update current flashcard's progress in local state
    if (result && flashcards.length > 0 && currentIndex < flashcards.length) {
      const updatedFlashcards = [...flashcards];
      const currentFlashcard = updatedFlashcards[currentIndex];
      
      // Update progress for current flashcard
      if (currentFlashcard) {
        updatedFlashcards[currentIndex] = {
          ...currentFlashcard,
          progress: {
            ...currentFlashcard.progress,
            bestScore: result.PronunciationScore || result.pronunciationScore || currentFlashcard.progress?.bestScore || 0,
            hasPracticed: true,
            HasPracticed: true,
          },
        };
        setFlashcards(updatedFlashcards);
      }
    }
  };

  const handleComplete = async () => {
    // Reload summary before showing
    try {
      const summaryResponse = await pronunciationService.getModuleSummary(moduleId);
      // axiosClient already unwraps response.data, so summaryResponse is already the ServiceResponse
      if (summaryResponse?.success && summaryResponse?.data) {
        setSummary(summaryResponse.data);
      } else if (summaryResponse) {
        // Fallback: use response directly if it's not ServiceResponse format
        setSummary(summaryResponse);
      }
    } catch (err) {
      // Still show summary even if reload fails
    }
    setShowSummary(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (error && flashcards.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackClick}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentFlashcard = flashcards[currentIndex];
  const canGoNext = currentIndex < flashcards.length - 1;
  const canGoPrevious = currentIndex > 0;

  if (showSummary && summary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryIcon}>
            <Ionicons name="checkmark-circle" size={scale(80)} color="#10B981" />
          </View>
          <Text style={styles.summaryTitle}>Hoàn thành Luyện Phát Âm!</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.totalFlashCards || 0}</Text>
              <Text style={styles.statLabel}>Tổng số từ</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.totalPracticed || 0}</Text>
              <Text style={styles.statLabel}>Đã luyện</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.masteredCount || 0}</Text>
              <Text style={styles.statLabel}>Đã thuộc</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.averageScore?.toFixed(1) || 0}</Text>
              <Text style={styles.statLabel}>Điểm TB</Text>
            </View>
          </View>
          <View style={styles.summaryGrade}>
            <Text style={styles.gradeLabel}>Xếp loại:</Text>
            <Text style={styles.gradeValue}>{summary.grade || 'N/A'}</Text>
          </View>
          <Text style={styles.summaryMessage}>{summary.message || 'Chúc mừng bạn đã hoàn thành!'}</Text>
          <View style={styles.summaryActions}>
            <TouchableOpacity
              style={styles.summaryActionButton}
              onPress={() => setShowSummary(false)}
            >
              <Text style={styles.summaryActionText}>Luyện lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.summaryActionButton, styles.summaryActionButtonPrimary]}
              onPress={handleBackClick}
            >
              <Text style={[styles.summaryActionText, styles.summaryActionTextPrimary]}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={handleBackClick}>
          <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luyện Phát Âm</Text>
        <View style={styles.headerRight} />
      </View>

      {currentFlashcard && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.cardContainer}>
            <PronunciationCard
              flashcard={currentFlashcard}
              currentIndex={currentIndex}
              totalCards={flashcards.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              onAssessmentComplete={handleAssessmentComplete}
              onComplete={handleComplete}
              isLastCard={currentIndex === flashcards.length - 1}
            />
          </View>
        </ScrollView>
      )}
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
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorText: {
    fontSize: scale(16),
    color: colors.error,
    textAlign: 'center',
    marginBottom: scale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButtonHeader: {
    padding: scale(8),
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: scale(40),
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    padding: scale(20),
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  summaryIcon: {
    marginBottom: scale(20),
  },
  summaryTitle: {
    fontSize: scale(24),
    fontWeight: '700',
    color: colors.text,
    marginBottom: scale(30),
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: scale(30),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: scale(28),
    fontWeight: '800',
    color: colors.primary,
    marginBottom: scale(8),
  },
  statLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  summaryGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(20),
  },
  gradeLabel: {
    fontSize: scale(18),
    fontWeight: '600',
    color: colors.text,
  },
  gradeValue: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.primary,
  },
  summaryMessage: {
    fontSize: scale(16),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(30),
    paddingHorizontal: scale(20),
  },
  summaryActions: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
    paddingHorizontal: scale(20),
  },
  summaryActionButton: {
    flex: 1,
    paddingVertical: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  summaryActionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  summaryActionText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.primary,
  },
  summaryActionTextPrimary: {
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    backgroundColor: colors.primary,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default PronunciationDetailScreen;

