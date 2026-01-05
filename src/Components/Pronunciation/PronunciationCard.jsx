import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import pronunciationService from '../../Services/pronunciationService';
import fileService from '../../Services/fileService';
import PronunciationProgress from './PronunciationProgress';
import PronunciationMic from './PronunciationMic';

const PronunciationCard = ({
  flashcard,
  currentIndex,
  totalCards,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  onAssessmentComplete,
  onComplete,
  isLastCard,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [recordedSound, setRecordedSound] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [referenceSound, setReferenceSound] = useState(null);
  
  const recordingRef = useRef(null);
  const isMountedRef = useRef(true);
  const flashCardId = flashcard?.flashCardId || flashcard?.FlashCardId || flashcard?.id || flashcard?.Id;
  const word = flashcard?.word || flashcard?.Word || '';
  const definition = flashcard?.meaning || flashcard?.Meaning || flashcard?.definition || flashcard?.Definition || '';
  const phonetic = flashcard?.phonetic || flashcard?.Phonetic || flashcard?.pronunciation || flashcard?.Pronunciation || '';
  const audioUrl = flashcard?.audioUrl || flashcard?.AudioUrl || '';
  const progress = flashcard?.progress || flashcard?.Progress;
  const bestScore = progress?.bestScore || progress?.BestScore || 0;
  const hasPracticed = progress?.hasPracticed || progress?.HasPracticed || false;

  // Reset state when flashcard changes
  useEffect(() => {
    // Cleanup previous audio
    if (recordedSound) {
      recordedSound.unloadAsync().catch(() => {});
      setRecordedSound(null);
    }
    if (referenceSound) {
      referenceSound.unloadAsync().catch(() => {});
      setReferenceSound(null);
    }

    // Reset states
    setAssessmentResult(null);
    setIsRecording(false);
    setIsProcessing(false);
    setIsPlayingRecorded(false);
    setIsPlayingReference(false);
    setRecordedUri(null);
  }, [flashCardId]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recordedSound) {
        recordedSound.unloadAsync().catch(() => {});
      }
      if (referenceSound) {
        referenceSound.unloadAsync().catch(() => {});
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập microphone để ghi âm');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm. Vui lòng thử lại.');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!recordingRef.current) {
        return;
      }
      
      // Get URI and status BEFORE stopping (important!)
      const uri = recordingRef.current.getURI();
      if (!uri) {
        Alert.alert('Lỗi', 'Không thể lấy bản ghi âm. Vui lòng thử lại.');
        setIsRecording(false);
        return;
      }

      // Get recording status to get duration BEFORE stopping
      let duration = null;
      try {
        const status = await recordingRef.current.getStatusAsync();
        duration = status.durationMillis ? status.durationMillis / 1000 : null;
      } catch (statusErr) {
        // Ignore duration error
      }

      // Stop and unload recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Save URI to state
      setRecordedUri(uri);
      setIsRecording(false);
      
      // Process recording (this will upload and assess)
      await handleProcessRecording(uri, duration);
      
      // Clear recording ref AFTER processing
      recordingRef.current = null;
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể dừng ghi âm. Vui lòng thử lại.');
      setIsRecording(false);
      if (recordingRef.current) {
        recordingRef.current = null;
      }
    }
  };

  const handleProcessRecording = async (audioUri, audioDuration = null) => {
    if (!flashCardId) {
      return;
    }

    try {
      setIsProcessing(true);
      setAssessmentResult(null);

      // Upload audio to temp storage (MinIO)
      // Create file object for React Native
      const fileName = `pronunciation_${Date.now()}.m4a`;
      const fileObject = {
        uri: audioUri,
        name: fileName,
        type: 'audio/m4a',
      };

      // Upload to MinIO
      const uploadResponse = await fileService.uploadTempFile(
        fileObject,
        'pronunciations',
        'temp'
      );

      // axiosClient đã unwrap response.data, nên uploadResponse đã là ServiceResponse
      // Structure: { Success, StatusCode, Message, Data: { TempKey, ... } }
      const isUploadSuccess = uploadResponse?.Success || uploadResponse?.success;

      if (!isUploadSuccess || (!uploadResponse?.Data && !uploadResponse?.data)) {
        const errorMsg = uploadResponse?.Message || uploadResponse?.message || 'Không thể upload audio lên MinIO';
        throw new Error(errorMsg);
      }

      // Data chứa TempKey
      const resultData = uploadResponse.Data || uploadResponse.data;
      const tempKey = resultData?.TempKey || resultData?.tempKey;
      const audioType = resultData?.AudioType || resultData?.audioType || resultData?.ImageType || resultData?.imageType || 'audio/m4a';
      const audioSize = resultData?.AudioSize || resultData?.audioSize || resultData?.ImageSize || resultData?.imageSize;

      if (!tempKey) {
        throw new Error('Không nhận được TempKey từ server sau khi upload');
      }

      // Call pronunciation assessment API
      const assessmentData = {
        FlashCardId: flashCardId,
        AudioTempKey: tempKey,
      };

      // Add optional fields if available
      if (audioType && audioType.length > 0 && audioType.length <= 50) {
        assessmentData.AudioType = audioType;
      }
      if (audioSize && audioSize > 0) {
        assessmentData.AudioSize = audioSize;
      }
      if (audioDuration && audioDuration > 0) {
        assessmentData.DurationInSeconds = audioDuration;
      }

      const assessmentResponse = await pronunciationService.assess(assessmentData);

      // Handle response - axiosClient already unwraps response.data
      // So assessmentResponse is already the ServiceResponse object: { Success, Data, Message, StatusCode }
      const responseData = assessmentResponse;
      const isSuccess = responseData?.Success || responseData?.success || responseData?.Success === true;
      const resultDto = responseData?.Data || responseData?.data;
      const errorMessage = responseData?.Message || responseData?.message;

      if (isSuccess && resultDto) {
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) {
          return;
        }

        // Store the result (backend uses PascalCase)
        setAssessmentResult(resultDto);

        // Notify parent component
        if (onAssessmentComplete && isMountedRef.current) {
          onAssessmentComplete(resultDto);
        }
      } else {
        const finalErrorMessage = errorMessage || 'Không thể đánh giá phát âm';
        throw new Error(finalErrorMessage);
      }
    } catch (err) {
      
      // Extract error message from various possible locations
      let errorMessage = 'Không thể xử lý bản ghi âm. Vui lòng thử lại.';
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        errorMessage = errorData?.Message || errorData?.message || errorData?.Message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayRecordedAudio = async () => {
    try {
      if (!recordedUri) return;

      // Load and play recorded audio
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setRecordedSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlayingRecorded(false);
            sound.unloadAsync().catch(() => {});
            setRecordedSound(null);
          } else {
            setIsPlayingRecorded(status.isPlaying);
          }
        }
      });

      await sound.playAsync();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể phát lại bản ghi âm');
    }
  };

  const handleStopRecordedPlayback = async () => {
    if (recordedSound) {
      await recordedSound.stopAsync();
      await recordedSound.unloadAsync();
      setRecordedSound(null);
      setIsPlayingRecorded(false);
    }
  };

  const handlePlayReferenceAudio = async () => {
    if (!audioUrl) {
      return;
    }

    try {
      // Stop any currently playing audio
      if (referenceSound) {
        await referenceSound.unloadAsync();
        setReferenceSound(null);
      }

      // Load and play reference audio
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setReferenceSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlayingReference(false);
            sound.unloadAsync().catch(() => {});
            setReferenceSound(null);
          } else {
            setIsPlayingReference(status.isPlaying);
          }
        }
      });

      await sound.playAsync();
    } catch (err) {
      // Silent fail - don't show alert
    }
  };

  const handleStopReferencePlayback = async () => {
    if (referenceSound) {
      await referenceSound.stopAsync();
      await referenceSound.unloadAsync();
      setReferenceSound(null);
      setIsPlayingReference(false);
    }
  };

  // Get pronunciation score from result
  const getPronunciationScore = () => {
    if (assessmentResult) {
      const score = assessmentResult.PronunciationScore !== undefined
        ? assessmentResult.PronunciationScore
        : assessmentResult.pronunciationScore !== undefined
          ? assessmentResult.pronunciationScore
          : null;

      if (score !== undefined && score !== null && !isNaN(score)) {
        return parseFloat(score);
      }
    }
    return bestScore || 0;
  };

  const pronunciationScore = getPronunciationScore();
  const showScore = assessmentResult !== null || hasPracticed;

  const handleNextOrComplete = () => {
    if (isLastCard && onComplete) {
      onComplete();
    } else if (onNext) {
      onNext();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <PronunciationProgress
          score={pronunciationScore}
          showScore={showScore}
          feedback={
            assessmentResult
              ? (assessmentResult.Feedback || assessmentResult.feedback || 'Chưa tính điểm')
              : hasPracticed
                ? `Điểm tốt nhất: ${Math.round(bestScore)}`
                : 'Chưa tính điểm'
          }
        />

        <View style={styles.wordDisplay}>
          <Text 
            style={styles.wordText}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            {word}
          </Text>
          {phonetic && (
            <Text 
              style={styles.phoneticText}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              /{phonetic}/
            </Text>
          )}
          {definition && (
            <Text 
              style={styles.definitionText}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {definition}
            </Text>
          )}
        </View>

        <View style={styles.instruction}>
          <Text style={styles.instructionText}>Nhấn vào mic để phát âm</Text>
        </View>

        <PronunciationMic
          isRecording={isRecording}
          isProcessing={isProcessing}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      </View>

      <View style={styles.actions}>
        {canGoPrevious && (
          <TouchableOpacity
            style={[styles.actionButton, styles.navButton]}
            onPress={onPrevious}
          >
            <Ionicons name="chevron-back" size={scale(20)} color={colors.primary} />
            <Text style={styles.actionButtonText}>Từ trước</Text>
          </TouchableOpacity>
        )}

        {recordedUri && (
          <TouchableOpacity
            style={[styles.actionButton, styles.playbackButton]}
            onPress={isPlayingRecorded ? handleStopRecordedPlayback : handlePlayRecordedAudio}
          >
            <Ionicons
              name={isPlayingRecorded ? 'stop' : 'volume-high'}
              size={scale(20)}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>
              {isPlayingRecorded ? 'Dừng' : 'Nghe lại'}
            </Text>
          </TouchableOpacity>
        )}

        {assessmentResult && audioUrl && (
          <TouchableOpacity
            style={[styles.actionButton, styles.referenceButton]}
            onPress={isPlayingReference ? handleStopReferencePlayback : handlePlayReferenceAudio}
          >
            <Ionicons
              name={isPlayingReference ? 'stop' : 'volume-high'}
              size={scale(20)}
              color="#10B981"
            />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
              {isPlayingReference ? 'Dừng' : 'Nghe chuẩn'}
            </Text>
          </TouchableOpacity>
        )}

        {(canGoNext || isLastCard) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.nextButton]}
            onPress={handleNextOrComplete}
          >
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              {isLastCard ? 'Hoàn thành' : 'Từ tiếp theo'}
            </Text>
            {!isLastCard && (
              <Ionicons name="chevron-forward" size={scale(20)} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(24),
    marginVertical: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
  },
  wordDisplay: {
    alignItems: 'center',
    marginTop: scale(20),
    marginBottom: scale(16),
    width: '100%',
    paddingHorizontal: scale(16),
  },
  wordText: {
    fontSize: scale(32),
    fontWeight: '700',
    color: colors.text,
    marginBottom: scale(8),
    textAlign: 'center',
    width: '100%',
  },
  phoneticText: {
    fontSize: scale(18),
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: scale(8),
    textAlign: 'center',
    width: '100%',
  },
  definitionText: {
    fontSize: scale(16),
    color: colors.text,
    textAlign: 'center',
    width: '100%',
    lineHeight: scale(24),
  },
  instruction: {
    marginTop: scale(16),
    marginBottom: scale(24),
  },
  instructionText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(8),
    marginTop: scale(24),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    gap: scale(6),
  },
  navButton: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  playbackButton: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  referenceButton: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.primary,
  },
});

export default PronunciationCard;

