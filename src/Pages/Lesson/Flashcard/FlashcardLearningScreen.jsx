import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import flashcardReviewService from '../../../Services/flashcardReviewService';
import Toast from '../../../Components/Common/Toast';

const { width } = Dimensions.get('window');

const FlashcardLearningScreen = ({ route, navigation }) => {
  const { moduleId, moduleName, lessonId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const flipAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    loadFlashcards();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      // Gọi API lấy flashcards theo moduleId
      const response = await flashcardReviewService.getFlashcardsByModule(moduleId);
      const data = response?.data || response;
      const cards = Array.isArray(data) ? data : data?.flashCards || data?.FlashCards || [];
      
      if (cards.length === 0) {
        setToast({
          visible: true,
          message: 'Module này chưa có flashcards',
          type: 'info',
        });
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }, 1500);
        return;
      }
      
      setFlashcards(cards);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tải flashcards',
        type: 'error',
      });
      setTimeout(() => navigation.goBack(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (audioUrl) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    } else {
      // Completed
      setToast({
        visible: true,
        message: 'Bạn đã học xong tất cả flashcards!',
        type: 'success',
      });
      setTimeout(() => navigation.goBack(), 1500);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const renderFlashcardContent = () => {
    if (flashcards.length === 0) return null;
    
    const card = flashcards[currentIndex];
    const term = card?.Term || card?.term || '';
    const definition = card?.Definition || card?.definition || '';
    const pronunciation = card?.Pronunciation || card?.pronunciation || '';
    const audioUrl = card?.AudioUrl || card?.audioUrl;
    const imageUrl = card?.ImageUrl || card?.imageUrl;
    const exampleSentence = card?.ExampleSentence || card?.exampleSentence || '';

    const frontInterpolate = flipAnim.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <Animated.View style={[styles.flashcardContainer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleFlip}
          style={styles.flashcard}
        >
          {/* Front Side */}
          <Animated.View
            style={[
              styles.flashcardFace,
              styles.flashcardFront,
              {
                transform: [{ rotateY: frontInterpolate }],
                opacity: flipAnim.interpolate({
                  inputRange: [0, 90, 180],
                  outputRange: [1, 0, 0],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <ScrollView 
                contentContainerStyle={styles.flashcardContent}
                showsVerticalScrollIndicator={false}
              >
                {imageUrl && (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.flashcardImage}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.flashcardTerm}>{term}</Text>
                {pronunciation && (
                  <Text style={styles.flashcardPronunciation}>/{pronunciation}/</Text>
                )}
                {definition && (
                  <Text style={styles.flashcardDefinition}>{definition}</Text>
                )}
                {audioUrl && (
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      playAudio(audioUrl);
                    }}
                  >
                    <Ionicons name="volume-high" size={scale(24)} color="#6366F1" />
                  </TouchableOpacity>
                )}
                <Text style={styles.tapHint}>Nhấn để xem mặt sau</Text>
              </ScrollView>
            </LinearGradient>
          </Animated.View>

          {/* Back Side */}
          <Animated.View
            style={[
              styles.flashcardFace,
              styles.flashcardBack,
              {
                transform: [{ rotateY: backInterpolate }],
                opacity: flipAnim.interpolate({
                  inputRange: [0, 90, 180],
                  outputRange: [0, 0, 1],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#FBBF24', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {audioUrl && (
                <TouchableOpacity
                  style={styles.audioButtonBack}
                  onPress={(e) => {
                    e.stopPropagation();
                    playAudio(audioUrl);
                  }}
                >
                  <Ionicons name="volume-high" size={scale(24)} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.flashcardImageBack}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.flashcardContentBack}>
                {exampleSentence && (
                  <View style={styles.exampleContainerBack}>
                    <Text style={styles.exampleTextBack}>{exampleSentence}</Text>
                  </View>
                )}
                <Text style={styles.tapHintBack}>Ấn vào thẻ để lật</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={scale(64)} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Chưa có flashcards nào</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={scale(28)} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{moduleName || 'Flashcards'}</Text>
        <TouchableOpacity 
          style={styles.pronunciationBadge}
          onPress={() => {
            const card = flashcards[currentIndex];
            const flashCardId = card?.FlashCardId || card?.flashCardId || card?.id;
            const term = card?.Term || card?.term || '';
            const pronunciation = card?.Pronunciation || card?.pronunciation || '';
            const audioUrl = card?.AudioUrl || card?.audioUrl;
            
            navigation.navigate('PronunciationScreen', {
              flashCardId,
              word: term,
              pronunciation,
              referenceAudioUrl: audioUrl,
              moduleId,
              moduleName,
              flashcards: flashcards,
              initialIndex: currentIndex,
            });
          }}
        >
          <Ionicons name="mic" size={scale(20)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {flashcards.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / flashcards.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardArea}>
        {renderFlashcardContent()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={scale(32)}
            color={currentIndex === 0 ? colors.textSecondary : colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === flashcards.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
            </Text>
            <Ionicons name="arrow-forward" size={scale(20)} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: scale(16),
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  emptyText: {
    fontSize: scale(18),
    color: colors.textSecondary,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.text,
  },
  pronunciationBadge: {
    width: scale(40),
    height: scale(40),
    backgroundColor: '#22D3EE',
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.15,
    shadowRadius: scale(4),
    elevation: 3,
  },
  progressContainer: {
    paddingHorizontal: scale(24),
    marginBottom: verticalScale(16),
  },
  progressText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
  },
  progressBar: {
    height: verticalScale(8),
    backgroundColor: '#E5E7EB',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: scale(4),
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  flashcardContainer: {
    width: width - scale(48),
    height: verticalScale(400),
  },
  flashcard: {
    flex: 1,
  },
  flashcardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: 5,
  },
  flashcardFront: {},
  flashcardBack: {},
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  flashcardImage: {
    width: '100%',
    height: verticalScale(140),
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
  },
  flashcardContent: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    flexGrow: 1,
    justifyContent: 'center',
  },
  flashcardTerm: {
    fontSize: scale(24),
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(4),
  },
  flashcardPronunciation: {
    fontSize: scale(14),
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: verticalScale(8),
  },
  audioButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  tapHint: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginTop: verticalScale(24),
  },
  flashcardDefinition: {
    fontSize: scale(16),
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: scale(22),
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(8),
  },
  audioButtonBack: {
    position: 'absolute',
    top: scale(16),
    right: scale(16),
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  flashcardImageBack: {
    width: '90%',
    height: verticalScale(200),
    borderRadius: scale(16),
    marginBottom: verticalScale(16),
  },
  flashcardContentBack: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  exampleContainerBack: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: scale(12),
    padding: scale(16),
    width: '100%',
  },
  exampleTextBack: {
    fontSize: scale(16),
    color: colors.text,
    textAlign: 'center',
    lineHeight: scale(24),
    fontWeight: '500',
  },
  tapHintBack: {
    fontSize: scale(14),
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: verticalScale(12),
  },
  exampleContainer: {
    marginTop: verticalScale(16),
    padding: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(12),
    width: '100%',
  },
  exampleLabel: {
    fontSize: scale(14),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: verticalScale(8),
  },
  exampleText: {
    fontSize: scale(16),
    color: '#FFFFFF',
    lineHeight: scale(24),
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(24),
  },
  navButton: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  nextButton: {
    flex: 1,
    marginLeft: scale(16),
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    gap: scale(8),
  },
  nextButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.primary,
    borderRadius: scale(8),
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default FlashcardLearningScreen;
