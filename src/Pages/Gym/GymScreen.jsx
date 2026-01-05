import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import flashcardReviewService from '../../Services/flashcardReviewService';
import authService from '../../Services/authService';
import Toast from '../../Components/Common/Toast';
import { mochiWelcome } from '../../../assets/images';

const GymScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [statistics, setStatistics] = useState(null);
  const [masteredWords, setMasteredWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [sound, setSound] = useState();

  useFocusEffect(
    useCallback(() => {
      checkLoginAndLoadData();
      return () => {
        if (sound) sound.unloadAsync();
      };
    }, [])
  );

  const checkLoginAndLoadData = async () => {
    try {
      setLoading(true);
      const loggedIn = await authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        await loadData();
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const getResponseData = (res) => {
      if (!res) return null;
      let data = res.data || res;
      if (data.data) {
          data = data.data;
      }
      return data;
  };

  const loadData = async () => {
    try {
      const [statsRes, masteredRes] = await Promise.all([
        flashcardReviewService.getStatistics().catch(() => null),
        flashcardReviewService.getMasteredFlashCards().catch(() => null),
      ]);

      const statsData = getResponseData(statsRes);
      const masteredPayload = getResponseData(masteredRes);

      let masteredData = [];
      if (masteredPayload) {
        if (Array.isArray(masteredPayload)) {
            masteredData = masteredPayload;
        } else if (masteredPayload.cards) {
            masteredData = masteredPayload.cards;
        } else if (masteredPayload.flashCards) {
            masteredData = masteredPayload.flashCards;
        }
      }

      setStatistics(statsData);
      setMasteredWords(masteredData);
    } catch (error) {
      setStatistics({ masteredCount: 0 });
      setMasteredWords([]);
    }
  };

  const playAudio = async (audioUrl) => {
    if (!audioUrl) return;
    try {
        if (sound) await sound.unloadAsync();
        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
        );
        setSound(newSound);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkLoginAndLoadData();
    setRefreshing(false);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Render UI khi chưa đăng nhập
  const renderGuestUI = () => (
    <View style={styles.guestContainer}>
      <View style={[styles.guestHeader, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.guestHeaderTitle}>Sổ tay từ vựng</Text>
      </View>
      
      <View style={styles.guestContent}>
        <View style={styles.guestCard}>
          <View style={styles.guestIconContainer}>
            <Image
              source={mochiWelcome}
              style={styles.guestImage}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.guestTitle}>Đăng nhập để xem sổ tay</Text>
          <Text style={styles.guestMessage}>
            Bạn cần đăng nhập để xem và quản lý sổ tay từ vựng của mình.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              <Ionicons name="log-in-outline" size={scale(20)} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return renderGuestUI();
  }

  // Fallback count
  const masteredCount = masteredWords.length || statistics?.masteredCount || 0;

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
          <Text style={styles.headerTitle}>Sổ tay từ vựng</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>Tổng số từ đã thuộc: {masteredCount}</Text>

          {masteredCount === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                Bạn chưa có từ vựng nào đã thuộc.
              </Text>
              <Text style={styles.emptyMessage}>
                Hãy bắt đầu học và ôn tập để thêm từ vào sổ tay nhé!
              </Text>
            </View>
          ) : (
            <View style={styles.wordsList}>
              {masteredWords.map((item, index) => {
                const flashcard = item.flashCard || item; // Support different DTO structures
                const word = flashcard.word || flashcard.Word || '';
                const meaning = flashcard.meaning || flashcard.Meaning || flashcard.definition || '';
                const pronunciation = flashcard.pronunciation || flashcard.Pronunciation || '';
                const partOfSpeech = flashcard.partOfSpeech || flashcard.PartOfSpeech || 'word';
                const audioUrl = flashcard.audioUrl || flashcard.AudioUrl;

                return (
                  <View key={item.id || item.flashCardId || index} style={styles.wordCard}>
                    <View style={styles.wordContent}>
                        {/* Row 1: Word + Audio + POS */}
                        <View style={styles.wordHeader}>
                            <Text style={styles.wordText}>{word}</Text>
                            {audioUrl && (
                                <TouchableOpacity 
                                    style={styles.audioIcon}
                                    onPress={() => playAudio(audioUrl)}
                                >
                                    <Ionicons name="volume-high" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            <View style={styles.posBadge}>
                                <Text style={styles.posText}>{partOfSpeech}</Text>
                            </View>
                        </View>

                        {/* Row 2: Pronunciation */}
                        {pronunciation ? (
                            <Text style={styles.pronunciation}>{pronunciation}</Text>
                        ) : null}

                        {/* Row 3: Meaning */}
                        <Text style={styles.meaning}>{meaning}</Text>
                        
                        {/* Status Label */}
                        <View style={styles.statusContainer}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.statusText}>Đã thuộc</Text>
                        </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Guest UI Styles
  guestContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  guestHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  guestHeaderTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  guestContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  guestCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  guestIconContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  guestImage: {
    width: scale(80),
    height: scale(80),
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    width: '100%',
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Logged in UI Styles
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14 * 1.5,
  },
  wordsList: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(16),
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // Green indicator for mastered
  },
  wordContent: {
    flex: 1,
  },
  wordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 8,
  },
  audioIcon: {
      padding: 4,
      marginRight: 8,
  },
  posBadge: {
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
  },
  posText: {
      fontSize: 12,
      color: colors.textLight,
      fontWeight: '600',
      fontStyle: 'italic',
  },
  pronunciation: {
      fontSize: 14,
      color: colors.textLight,
      fontFamily: 'monospace', // Monospace for phonetic
      marginBottom: 8,
  },
  meaning: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
  },
  statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#ECFDF5',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#10B981',
  },
  bottomSpacing: {
    height: verticalScale(80),
  },
});

export default GymScreen;