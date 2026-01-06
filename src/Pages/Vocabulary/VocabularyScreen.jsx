import React, { useState, useCallback } from 'react';
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
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import flashcardReviewService from '../../Services/flashcardReviewService';
import authService from '../../Services/authService';
import Toast from '../../Components/Common/Toast';
import { mochiWelcome } from '../../../assets/images';
import { getResponseData } from '../../Utils/apiHelper';

const VocabularyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [statistics, setStatistics] = useState(null);
  const [dueCards, setDueCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useFocusEffect(
    useCallback(() => {
      checkLoginAndLoadData();
    }, [])
  );

  const checkLoginAndLoadData = async () => {
    try {
      setLoading(true);
      const loggedIn = await authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        await Promise.all([
            loadStatistics(),
            loadDueCardsList()
        ]);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const loadDueCardsList = async () => {
      try {
          const response = await flashcardReviewService.getDueFlashCards();
          const res = getResponseData(response);
          const payload = res?.data || res;
          
          let cards = [];
          if (payload) {
              if (Array.isArray(payload)) {
                  cards = payload;
              } else if (payload.flashCards) {
                  cards = payload.flashCards;
              } else if (payload.cards) {
                  cards = payload.cards;
              }
          }
          setDueCards(cards);
      } catch (error) {
          setDueCards([]);
      }
  }

  const loadStatistics = async () => {
    try {
      const response = await flashcardReviewService.getStatistics();
      const res = getResponseData(response);
      const statsData = res?.data || res;
      setStatistics(statsData);
    } catch (error) {
      setStatistics({ dueToday: 0 });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkLoginAndLoadData();
    setRefreshing(false);
  };

  const handleStartReview = async () => {
    try {
      setLoading(true);
      const response = await flashcardReviewService.getDueFlashCards();
      const res = getResponseData(response);
      const payload = res?.data || res;
      
      let cardsList = [];
      if (payload) {
          cardsList = payload.flashCards || payload.cards || (Array.isArray(payload) ? payload : []);
      }

      if (cardsList.length === 0) {
        setToast({
          visible: true,
          message: 'Không có từ nào cần ôn tập hôm nay!',
          type: 'info',
        });
        return;
      }

      navigation.navigate('FlashCardReviewSession');
    } catch (error) {
      setToast({
        visible: true,
        message: 'Có lỗi xảy ra khi bắt đầu ôn tập',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGuestUI = () => (
    <View style={styles.guestContainer}>
      <View style={[styles.guestHeader, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.guestHeaderTitle}>Ôn tập từ vựng</Text>
      </View>
      <View style={styles.guestContent}>
        <View style={styles.guestCard}>
          <Image source={mochiWelcome} style={styles.guestImage} resizeMode="contain" />
          <Text style={styles.guestTitle}>Đăng nhập để ôn tập</Text>
          <Text style={styles.guestMessage}>
            Bạn cần đăng nhập để sử dụng tính năng ôn tập từ vựng theo phương pháp Spaced Repetition.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (!isLoggedIn) return renderGuestUI();

  const dueCount = dueCards.length > 0 ? dueCards.length : (
      statistics?.dueToday || statistics?.DueToday ||
      statistics?.dueFlashCardsCount || statistics?.DueFlashCardsCount ||
      statistics?.dueCount || 0
  );

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible} message={toast.message} type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <ScrollView
        style={styles.scrollView} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
          <Text style={styles.headerTitle}>Ôn tập từ vựng</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.mainCard}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <Text style={styles.cardTitle}>Số từ cần ôn hôm nay</Text>
              <Text style={styles.wordCount}>{dueCount}</Text>
              <Text style={styles.cardSubtitle}>từ vựng</Text>
              
              <TouchableOpacity
                style={[styles.startButton, dueCount === 0 && styles.startButtonDisabled]}
                onPress={handleStartReview}
                disabled={dueCount === 0}
              >
                <Text style={[styles.startButtonText, dueCount === 0 && styles.startButtonTextDisabled]}>
                  Ôn tập ngay
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: colors.textSecondary },
  guestContainer: { flex: 1, backgroundColor: colors.background },
  guestHeader: { paddingHorizontal: 24, paddingBottom: 16 },
  guestHeaderTitle: { fontSize: 32, fontWeight: '700', color: colors.text, textAlign: 'center' },
  guestContent: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  guestCard: { backgroundColor: colors.surface, borderRadius: scale(20), padding: 32, alignItems: 'center', elevation: 4 },
  guestImage: { width: scale(120), height: scale(120), marginBottom: 24 },
  guestTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
  guestMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  loginButton: { borderRadius: scale(12), overflow: 'hidden', width: '100%' },
  loginButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '700', color: colors.text, textAlign: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  mainCard: { borderRadius: scale(24), overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12 },
  cardGradient: { padding: 32, alignItems: 'center' },
  cardTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  wordCount: { color: '#FFFFFF', fontSize: 64, fontWeight: '800' },
  cardSubtitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 24 },
  startButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 32 },
  startButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.5)' },
  startButtonText: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  startButtonTextDisabled: { color: 'rgba(0,0,0,0.3)' },
  statsGrid: { flexDirection: 'row', gap: 16, marginTop: 24 },
  statBox: { flex: 1, backgroundColor: colors.surface, padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  bottomSpacing: { height: verticalScale(100) },
});

export default VocabularyScreen;