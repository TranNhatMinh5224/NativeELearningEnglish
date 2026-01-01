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

  // Reload khi màn hình được focus
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
        await loadData();
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [statsRes, masteredRes] = await Promise.all([
        flashcardReviewService.getStatistics().catch(() => ({ data: null })),
        flashcardReviewService.getMasteredFlashCards().catch(() => ({ data: null })),
      ]);

      let statsData = null;
      if (statsRes && statsRes.data) {
        statsData = statsRes.data;
      } else if (statsRes && (statsRes.masteredCount !== undefined)) {
        statsData = statsRes;
      }

      let masteredData = [];
      if (masteredRes && masteredRes.data) {
        const data = masteredRes.data;
        masteredData = data.cards || data.flashCards || (Array.isArray(data) ? data : []);
      } else if (Array.isArray(masteredRes)) {
        masteredData = masteredRes;
      }

      setStatistics(statsData);
      setMasteredWords(masteredData);
    } catch (error) {
      console.error('Load data error:', error);
      setStatistics({
        masteredCount: 0,
        totalCount: 0,
      });
      setMasteredWords([]);
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

  // Nếu chưa đăng nhập
  if (!isLoggedIn) {
    return renderGuestUI();
  }

  const masteredCount = statistics?.masteredCount || masteredWords.length || 0;

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
                const flashcard = item.flashCard || item;
                return (
                  <View key={item.id || item.flashCardId || index} style={styles.wordCard}>
                    <View style={styles.wordContent}>
                      <Text style={styles.wordText}>
                        {flashcard.word || flashcard.term || 'N/A'}
                      </Text>
                      {flashcard.definition && (
                        <Text style={styles.wordDefinition} numberOfLines={2}>
                          {flashcard.definition}
                        </Text>
                      )}
                    </View>
                    <View style={styles.masteredBadge}>
                      <Text style={styles.masteredBadgeText}>✓</Text>
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    gap: 16,
  },
  wordCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wordContent: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  wordDefinition: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 12 * 1.4,
  },
  masteredBadge: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  masteredBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: verticalScale(80),
  },
});

export default GymScreen;
