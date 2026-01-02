import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../Theme/colors';
import { scale, verticalScale } from '../../../Theme/responsive';
import pronunciationService from '../../../Services/pronunciationService';
import Toast from '../../../Components/Common/Toast';

const PronunciationScreen = ({ route, navigation }) => {
  const { 
    word: initialWord, 
    pronunciation: initialPronunciation, 
    referenceAudioUrl: initialAudioUrl,
    flashcards = [],
    initialIndex = 0,
  } = route.params || {};
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Get current flashcard with useMemo to ensure updates
  const currentCardData = useMemo(() => {
    if (flashcards.length > 0 && currentIndex < flashcards.length) {
      const card = flashcards[currentIndex];
      return {
        word: card?.Term || card?.term || initialWord || '',
        pronunciation: card?.Pronunciation || card?.pronunciation || initialPronunciation || '',
        audioUrl: card?.AudioUrl || card?.audioUrl || initialAudioUrl,
      };
    }
    return {
      word: initialWord || '',
      pronunciation: initialPronunciation || '',
      audioUrl: initialAudioUrl,
    };
  }, [currentIndex, flashcards, initialWord, initialPronunciation, initialAudioUrl]);

  const hasMultipleCards = flashcards.length > 1;

  useEffect(() => {
    setupAudio();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Reset recording when changing flashcard
  useEffect(() => {
    setRecordingUri(null);
    setResult(null);
    if (sound) {
      sound.unloadAsync();
    }
  }, [currentIndex]);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể truy cập microphone');
    }
  };

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setResult(null);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      
      // Auto assess after recording
      if (uri) {
        assessPronunciation(uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể dừng ghi âm');
    }
  };

  const playRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phát lại');
    }
  };

  const playReferenceAudio = async () => {
    try {
      if (!currentCardData.audioUrl) return;
      
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: currentCardData.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phát âm mẫu');
    }
  };

  const assessPronunciation = async (uri) => {
    try {
      setAssessing(true);
      
      // Create form data with audio file
      const audioBlob = {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      };

      const response = await pronunciationService.assessPronunciation(
        audioBlob,
        currentCardData.word || ''
      );
      
      const assessmentData = response?.data || response;
      setResult(assessmentData);
      
      const score = assessmentData?.Score || assessmentData?.score || 0;
      if (score >= 80) {
        setToast({
          visible: true,
          message: '🎉 Phát âm xuất sắc!',
          type: 'success',
        });
      } else if (score >= 60) {
        setToast({
          visible: true,
          message: '👍 Phát âm tốt!',
          type: 'success',
        });
      } else {
        setToast({
          visible: true,
          message: '💪 Cần luyện tập thêm',
          type: 'info',
        });
      }
    } catch (error) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể đánh giá phát âm',
        type: 'error',
      });
    } finally {
      setAssessing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Xuất sắc';
    if (score >= 60) return 'Tốt';
    if (score >= 40) return 'Trung bình';
    return 'Cần cải thiện';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={scale(28)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luyện phát âm</Text>
        <View style={styles.headerButton} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Word Display */}
        <View style={styles.wordCard}>
          <Text style={styles.word}>{currentCardData.word || 'apple'}</Text>
          {currentCardData.pronunciation && (
            <Text style={styles.pronunciation}>/{currentCardData.pronunciation}/</Text>
          )}
          
          {currentCardData.audioUrl && (
            <TouchableOpacity
              style={styles.referenceButton}
              onPress={playReferenceAudio}
              disabled={isPlaying}
            >
              <Ionicons
                name={isPlaying ? 'volume-high' : 'volume-medium'}
                size={scale(24)}
                color={colors.primary}
              />
              <Text style={styles.referenceButtonText}>Nghe phát âm chuẩn</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recording Area */}
        <View style={styles.recordingCard}>
          <Text style={styles.instructionText}>
            {isRecording ? 'Đang ghi âm...' : 'Nhấn và giữ để ghi âm phát âm của bạn'}
          </Text>

          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonRecording]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#7C3AED']}
              style={styles.micButtonGradient}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={scale(48)}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}
        </View>

        {/* Playback Controls */}
        {recordingUri && !isRecording && (
          <View style={styles.playbackCard}>
            <TouchableOpacity
              style={styles.playbackButton}
              onPress={playRecording}
              disabled={isPlaying}
            >
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={scale(32)}
                color={colors.primary}
              />
              <Text style={styles.playbackText}>
                {isPlaying ? 'Đang phát...' : 'Nghe lại'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setRecordingUri(null);
                setResult(null);
              }}
            >
              <Ionicons name="refresh" size={scale(24)} color={colors.textSecondary} />
              <Text style={styles.retryText}>Ghi lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assessment Result */}
        {assessing && (
          <View style={styles.assessingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.assessingText}>Đang đánh giá phát âm...</Text>
          </View>
        )}

        {result && !assessing && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Kết quả đánh giá</Text>
            
            <View style={styles.scoreContainer}>
              <View style={[
                styles.scoreCircle,
                { borderColor: getScoreColor(result.Score || result.score || 0) }
              ]}>
                <Text style={[
                  styles.scoreText,
                  { color: getScoreColor(result.Score || result.score || 0) }
                ]}>
                  {result.Score || result.score || 0}
                </Text>
                <Text style={styles.scoreLabel}>điểm</Text>
              </View>
              
              <View style={styles.scoreFeedback}>
                <Text style={[
                  styles.scoreLabelText,
                  { color: getScoreColor(result.Score || result.score || 0) }
                ]}>
                  {getScoreLabel(result.Score || result.score || 0)}
                </Text>
                <Text style={styles.feedbackText}>
                  {result.Feedback || result.feedback || 'Tiếp tục luyện tập để cải thiện!'}
                </Text>
              </View>
            </View>

            {/* Detailed Metrics */}
            {(result.AccuracyScore || result.accuracyScore) && (
              <View style={styles.metricsContainer}>
                <Text style={styles.metricsTitle}>Chi tiết đánh giá</Text>
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Độ chính xác:</Text>
                  <View style={styles.metricBarContainer}>
                    <View
                      style={[
                        styles.metricBar,
                        { width: `${result.AccuracyScore || result.accuracyScore}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.metricValue}>
                    {result.AccuracyScore || result.accuracyScore}%
                  </Text>
                </View>

                {(result.FluencyScore || result.fluencyScore) && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Độ trôi chảy:</Text>
                    <View style={styles.metricBarContainer}>
                      <View
                        style={[
                          styles.metricBar,
                          { width: `${result.FluencyScore || result.fluencyScore}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.metricValue}>
                      {result.FluencyScore || result.fluencyScore}%
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Navigation Buttons - Only show if multiple flashcards */}
        {hasMultipleCards && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
              onPress={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={scale(24)}
                color={currentIndex === 0 ? '#9CA3AF' : colors.primary}
              />
              <Text style={[
                styles.navButtonText,
                currentIndex === 0 && styles.navButtonTextDisabled
              ]}>
                Từ trước
              </Text>
            </TouchableOpacity>

            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>
                {currentIndex + 1} / {flashcards.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentIndex === flashcards.length - 1 && styles.navButtonDisabled
              ]}
              onPress={() => setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === flashcards.length - 1}
            >
              <Text style={[
                styles.navButtonText,
                currentIndex === flashcards.length - 1 && styles.navButtonTextDisabled
              ]}>
                Từ sau
              </Text>
              <Ionicons
                name="chevron-forward"
                size={scale(24)}
                color={currentIndex === flashcards.length - 1 ? '#9CA3AF' : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
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
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    padding: scale(32),
    alignItems: 'center',
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: 5,
  },
  word: {
    fontSize: scale(40),
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  pronunciation: {
    fontSize: scale(20),
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: verticalScale(20),
  },
  referenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    backgroundColor: '#EFF6FF',
    borderRadius: scale(24),
    gap: scale(8),
  },
  referenceButtonText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.primary,
  },
  recordingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    padding: scale(32),
    alignItems: 'center',
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: 5,
  },
  instructionText: {
    fontSize: scale(16),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(32),
  },
  micButton: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.2,
    shadowRadius: scale(16),
    elevation: 8,
  },
  micButtonRecording: {
    transform: [{ scale: 1.1 }],
  },
  micButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(24),
    gap: scale(8),
  },
  recordingDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#EF4444',
  },
  playbackCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(24),
    gap: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 3,
  },
  playbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    backgroundColor: '#EFF6FF',
    borderRadius: scale(12),
    gap: scale(8),
  },
  playbackText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.primary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(12),
    gap: scale(8),
  },
  retryText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  assessingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(32),
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  assessingText: {
    fontSize: scale(16),
    color: colors.textSecondary,
    marginTop: verticalScale(16),
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    padding: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: 5,
  },
  resultTitle: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(24),
    gap: scale(24),
  },
  scoreCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: scale(32),
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginTop: verticalScale(4),
  },
  scoreFeedback: {
    flex: 1,
  },
  scoreLabelText: {
    fontSize: scale(20),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  feedbackText: {
    fontSize: scale(15),
    color: colors.text,
    lineHeight: scale(22),
  },
  metricsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: verticalScale(20),
  },
  metricsTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: verticalScale(16),
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    gap: scale(12),
  },
  metricLabel: {
    fontSize: scale(14),
    color: colors.textSecondary,
    width: scale(100),
  },
  metricBarContainer: {
    flex: 1,
    height: verticalScale(8),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: scale(4),
  },
  metricValue: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.text,
    width: scale(50),
    textAlign: 'right',
  },  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    marginTop: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.08,
    shadowRadius: scale(8),
    elevation: 3,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  progressIndicator: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(12),
  },
  progressText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.text,
  },});

export default PronunciationScreen;
