import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import pronunciationService from '../../Services/pronunciationService';
import fileService from '../../Services/fileService';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - scale(48);
const CARD_HEIGHT = height * 0.65; 

const FlashCardItem = ({ card, active }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState();

  // Pronunciation States
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (!active) {
      setIsFlipped(false);
      animatedValue.setValue(0);
      setScore(null); 
    }
  }, [active]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Request permissions once
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
    })();
  }, []);

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      
      if (card.audioUrl || card.AudioUrl) {
        playAudio();
      }
    }
    setIsFlipped(!isFlipped);
  };

  const playAudio = async () => {
    try {
      const audioUrl = card.audioUrl || card.AudioUrl;
      if (!audioUrl) return;

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

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      setScore(null);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể khởi động Micro');
    }
  };

  const stopAndAssess = async () => {
    setIsRecording(false);
    setAssessing(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); 
      
      const uploadRes = await fileService.uploadFile(uri, 'recording.m4a');
      const audioKey = uploadRes?.data?.fileKey || uploadRes?.data?.FileKey || uploadRes?.tempKey;
      
      if (!audioKey) throw new Error('Upload ghi âm thất bại');

      const assessPayload = {
          FlashCardId: card.flashCardId || card.id,
          AudioTempKey: audioKey,
          AudioType: 'audio/m4a'
      };

      const response = await pronunciationService.assess(assessPayload);
      if (response && response.data) {
          const result = response.data;
          setScore(result.accuracyScore || result.pronunciationScore || 0);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Lỗi chấm điểm';
      Alert.alert('Lỗi', msg);
    } finally {
      setAssessing(false);
      setRecording(null);
    }
  };

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  // Data mapping
  const imageUrl = card.imageUrl || card.ImageUrl || card.image || null;
  const word = card.word || card.Word || '';
  const meaning = card.meaning || card.Meaning || '';
  const pronunciation = card.pronunciation || card.Pronunciation || '';
  const example = card.example || card.Example || '';
  const translation = card.exampleTranslation || card.ExampleTranslation || '';
  const partOfSpeech = card.partOfSpeech || card.PartOfSpeech || '';
  const audioUrl = card.audioUrl || card.AudioUrl || '';

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={flipCard} style={styles.touchable}>
        <View style={styles.cardContainer}>
          
          {/* ================= FRONT SIDE ================= */}
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              {
                transform: [{ rotateY: frontInterpolate }],
                opacity: frontOpacity,
              },
            ]}
          >
            {/* Audio Icon Top - giống Web app */}
            {audioUrl && (
              <View style={styles.audioIconTop}>
                <TouchableOpacity 
                  style={styles.audioIconButton}
                  onPress={(e) => { e.stopPropagation(); playAudio(); }}
                >
                  <Ionicons name="volume-high" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.frontContentWrapper}>
                <View style={styles.imageSection}>
                    {imageUrl ? (
                    <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.cardImage} 
                        resizeMode="contain" 
                    />
                    ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={60} color="#E5E7EB" />
                    </View>
                    )}
                </View>
                
                <View style={styles.wordSection}>
                    <Text style={styles.word} adjustsFontSizeToFit numberOfLines={1}>{word}</Text>
                </View>

                <View style={styles.tapIndicator}>
                    <Text style={styles.tapToFlip}>Ấn vào thẻ để lật</Text>
                    <Ionicons name="swap-horizontal" size={16} color={colors.textLight} />
                </View>
            </View>
          </Animated.View>

          {/* ================= BACK SIDE ================= */}
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              {
                transform: [{ rotateY: backInterpolate }],
                opacity: backOpacity,
              },
            ]}
          >
            {/* Audio Icon Top - giống Web app */}
            {audioUrl && (
              <View style={styles.audioIconTop}>
                <TouchableOpacity 
                  style={styles.audioIconButton}
                  onPress={(e) => { e.stopPropagation(); playAudio(); }}
                >
                  <Ionicons name="volume-high" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
            
            <ScrollView 
              style={styles.backScroll} 
              contentContainerStyle={styles.backContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.backContentWrapper}>
                {/* Word */}
                <Text style={styles.backWord}>{word}</Text>
                
                {/* Pronunciation */}
                {pronunciation ? (
                  <Text style={styles.backPronunciation}>{pronunciation}</Text>
                ) : null}
                
                {/* Part of Speech */}
                {partOfSpeech ? (
                  <Text style={styles.backPartOfSpeech}>{partOfSpeech}</Text>
                ) : null}
                
                {/* Meaning */}
                {meaning ? (
                  <View style={styles.backMeaning}>
                    <Text style={styles.backMeaningText}>{meaning}</Text>
                  </View>
                ) : null}
                
                {/* Example Translation */}
                {translation ? (
                  <View style={styles.backExampleTranslation}>
                    <Text style={styles.backExampleTranslationText}>{translation}</Text>
                  </View>
                ) : null}
                
                {/* Hint */}
                <View style={styles.backHint}>
                  <Text style={styles.backHintText}>Ấn vào thẻ để lật</Text>
                </View>
            </View>
            </ScrollView>
          </Animated.View>

        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginHorizontal: scale(8),
    marginTop: verticalScale(10),
  },
  touchable: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: scale(20),
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardFront: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
    width: '100%',
    height: '100%',
    backgroundColor: '#fffacd', // Pale yellow background - giống Web app
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF', 
    padding: scale(20),
  },
  
  audioIconTop: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(20),
    marginTop: scale(25),
    zIndex: 10,
  },
  audioIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    backgroundColor: '#FFD700', // Gold color - giống Web app
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  // FRONT
  frontContentWrapper: {
    flex: 1,
    padding: scale(16),
    justifyContent: 'space-between',
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  word: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  miniAudioButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    marginTop: 8,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.6,
  },
  tapToFlip: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // BACK
  backScroll: {
    flex: 1,
  },
  backContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    gap: scale(16),
  },
  backWord: {
    fontSize: scale(36),
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    margin: 0,
  },
  backPronunciation: {
    fontSize: scale(20),
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    margin: 0,
  },
  backPartOfSpeech: {
    fontSize: scale(16),
    color: colors.textSecondary,
    fontStyle: 'italic',
    textTransform: 'capitalize',
    textAlign: 'center',
    margin: 0,
  },
  backMeaning: {
    marginTop: scale(10),
    textAlign: 'center',
  },
  backMeaningText: {
    fontSize: scale(20),
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    margin: 0,
  },
  backExampleTranslation: {
    marginTop: scale(15),
    padding: scale(12),
    backgroundColor: 'rgba(240, 248, 255, 0.8)',
    borderRadius: 8,
    width: '100%',
  },
  backExampleTranslationText: {
    fontSize: scale(16),
    color: colors.textSecondary,
    margin: 0,
    lineHeight: scale(24),
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backHint: {
    position: 'absolute',
    bottom: scale(15),
    alignSelf: 'center',
  },
  backHintText: {
    fontSize: scale(14),
    color: colors.textLight,
    margin: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  posBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  partOfSpeech: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontStyle: 'italic',
  },
  actionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: colors.primary,
  },
  recordingButton: {
      backgroundColor: '#EF4444',
      transform: [{ scale: 1.1 }],
  },
  scoreBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
  },
  scoreText: {
      fontWeight: '800',
      fontSize: 14,
  },
  meaningContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  meaning: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 18,
    color: colors.textLight,
    fontStyle: 'italic',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginBottom: 20,
  },
  exampleBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  example: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 24,
  },
  translation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default FlashCardItem;