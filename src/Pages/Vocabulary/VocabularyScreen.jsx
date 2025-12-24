import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import flashcardReviewService from '../../Services/flashcardReviewService';
import Toast from '../../Components/Common/Toast';

const VocabularyScreen = ({ navigation }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await flashcardReviewService.getStatistics();
      
      // Backend trả về ServiceResponse với Data = ReviewStatisticsDto
      let statsData = null;
      if (response && response.data) {
        statsData = response.data;
      } else if (response && (response.dueCount !== undefined || response.masteredCount !== undefined)) {
        statsData = response;
      }

      setStatistics(statsData);
    } catch (error) {
      console.error('Load statistics error:', error);
      // Fallback với giá trị mặc định
      setStatistics({
        dueCount: 0,
        masteredCount: 0,
        totalCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const handleStartReview = async () => {
    try {
      // Lấy danh sách từ cần ôn
      const response = await flashcardReviewService.getDueFlashCards();
      
      let dueCards = [];
      if (response && response.data) {
        dueCards = response.data.cards || response.data || [];
      } else if (Array.isArray(response)) {
        dueCards = response;
      }

      if (dueCards.length === 0) {
        setToast({
          visible: true,
          message: 'Không có từ nào cần ôn tập hôm nay!',
          type: 'info',
        });
        return;
      }

      // TODO: Navigate to review screen
      setToast({
        visible: true,
        message: 'Tính năng đang được phát triển',
        type: 'info',
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi tải từ cần ôn';
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const dueCount = statistics?.dueCount || statistics?.dueFlashCardsCount || 0;

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ôn tập từ vựng hôm nay</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Số từ cần ôn:</Text>
          <View style={styles.countContainer}>
            <Text style={styles.countNumber}>{dueCount}</Text>
            <Text style={styles.countLabel}>từ</Text>
          </View>

          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleStartReview}
            disabled={dueCount === 0}
          >
            <LinearGradient
              colors={['#3B82F6', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.reviewButtonGradient,
                dueCount === 0 && styles.reviewButtonDisabled,
              ]}
            >
              <Ionicons name="book" size={scale(20)} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>Ôn tập ngay</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.cardHint}>
            Hãy dành vài phút để củng cố lại kiến thức nhé!
          </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32 + SAFE_AREA_PADDING.top,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    padding: 32,
    marginHorizontal: 24,
    marginTop: 24,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 32,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 32,
  },
  countNumber: {
    fontSize: 32 * 1.5,
    fontWeight: '700',
    color: '#3B82F6',
    marginRight: 8,
  },
  countLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reviewButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
    width: '100%',
    marginBottom: 24,
  },
  reviewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  reviewButtonDisabled: {
    opacity: 0.5,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12 * 1.5,
  },
  bottomSpacing: {
    height: verticalScale(80),
  },
});

export default VocabularyScreen;

