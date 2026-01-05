import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';
import flashcardReviewService from '../../Services/flashcardReviewService';
import FlashCardItem from '../../Components/FlashCard/FlashCardItem';
import { getResponseData } from '../../Utils/apiHelper';

const { width } = Dimensions.get('window');

const FlashCardReviewSession = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    mastered: 0,
    reviewing: 0,
    total: 0
  });

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const response = await flashcardReviewService.getDueFlashCards();
      
      const payload = getResponseData(response);
      let list = [];

      if (payload) {
          if (Array.isArray(payload)) {
              list = payload;
          } else if (payload.flashCards) {
              list = payload.flashCards;
          } else if (payload.cards) {
              list = payload.cards;
          } else if (payload.data && Array.isArray(payload.data)) {
              list = payload.data;
          }
      }
      
      setCards(list);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách ôn tập.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletionStats = async () => {
      try {
          setLoadingStats(true);
          const [statsResponse, masteredResponse] = await Promise.all([
              flashcardReviewService.getStatistics(),
              flashcardReviewService.getMasteredFlashCards()
          ]);

          const stats = getResponseData(statsResponse) || {};
          const mastered = getResponseData(masteredResponse) || {};
          
          const total = stats.totalCards || stats.TotalCards || 0;
          const masteredCount = mastered.reviewCards || mastered.ReviewCards || mastered.totalCount || 0;
          const reviewingCount = (total - masteredCount) > 0 ? (total - masteredCount) : 0;

          setSessionStats({
              total: total,
              mastered: masteredCount,
              reviewing: reviewingCount
          });
      } catch (error) {
      } finally {
          setLoadingStats(false);
          setIsFinished(true);
      }
  };

  const handleReview = async (quality) => {
    if (submitting) return;
    
    const currentCard = cards[currentIndex];
    const cardId = currentCard.flashCardId || currentCard.id;

    try {
      setSubmitting(true);
      await flashcardReviewService.reviewFlashCard(cardId, quality);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await fetchCompletionStats();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu kết quả ôn tập.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (loading || loadingStats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
            {loading ? 'Đang tải từ vựng cần ôn...' : 'Đang tổng hợp kết quả...'}
        </Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle-outline" size={80} color={colors.success} />
        <Text style={styles.emptyTitle}>Tuyệt vời!</Text>
        <Text style={styles.emptyText}>Bạn đã hoàn thành bài ôn tập hôm nay.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={styles.center}>
        <View style={styles.finishCard}>
            <Ionicons name="trophy" size={80} color="#F59E0B" />
            <Text style={styles.finishTitle}>Hoàn thành xuất sắc!</Text>
            
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{sessionStats.total}</Text>
                    <Text style={styles.statLabel}>Tổng số từ</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#10B981' }]}>{sessionStats.mastered}</Text>
                    <Text style={styles.statLabel}>Đã thuộc</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{sessionStats.reviewing}</Text>
                    <Text style={styles.statLabel}>Cần ôn lại</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                <Text style={styles.finishButtonText}>Tiếp tục học</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.homeButtonText}>Về trang chủ</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / cards.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{cards.length}
        </Text>
      </View>

      <Text style={styles.sessionTitle}>Ôn tập</Text>

      {/* Card Display */}
      <View style={styles.cardWrapper}>
        <FlashCardItem 
            key={currentCard.flashCardId || currentIndex} 
            card={currentCard} 
            active={true} 
        />
      </View>

      {/* Review Actions Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerHint}>Bạn nhớ từ này thế nào?</Text>
        
        <View style={styles.buttonsRow}>
            {/* 1: Quên */}
            <TouchableOpacity 
                style={[styles.reviewButton, styles.btnLevel1]}
                onPress={() => handleReview(1)}
                disabled={submitting}
            >
                <Text style={styles.btnLabel}>Quên</Text>
            </TouchableOpacity>

            {/* 2: Hơi nhớ */}
            <TouchableOpacity 
                style={[styles.reviewButton, styles.btnLevel2]}
                onPress={() => handleReview(2)}
                disabled={submitting}
            >
                <Text style={styles.btnLabel}>Hơi nhớ</Text>
            </TouchableOpacity>

            {/* 3: Nhớ */}
            <TouchableOpacity 
                style={[styles.reviewButton, styles.btnLevel3]}
                onPress={() => handleReview(3)}
                disabled={submitting}
            >
                <Text style={styles.btnLabel}>Nhớ</Text>
            </TouchableOpacity>

            {/* 4: Khá nhớ */}
            <TouchableOpacity 
                style={[styles.reviewButton, styles.btnLevel4]}
                onPress={() => handleReview(4)}
                disabled={submitting}
            >
                <Text style={styles.btnLabel}>Khá nhớ</Text>
            </TouchableOpacity>

            {/* 5: Đã thuộc */}
            <TouchableOpacity 
                style={[styles.reviewButton, styles.btnLevel5]}
                onPress={() => handleReview(5)}
                disabled={submitting}
            >
                <Text style={styles.btnLabel}>Thuộc</Text>
            </TouchableOpacity>
        </View>
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
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  closeButton: {
    padding: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  footerHint: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 16,
    fontSize: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  reviewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
  },
  btnLevel1: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }, // Red
  btnLevel2: { backgroundColor: '#FFEDD5', borderColor: '#F97316' }, // Orange
  btnLevel3: { backgroundColor: '#FEF9C3', borderColor: '#EAB308' }, // Yellow
  btnLevel4: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' }, // Green
  btnLevel5: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }, // Blue
  
  btnLabel: {
    fontWeight: '700',
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  finishCard: {
      backgroundColor: '#FFF',
      padding: 32,
      borderRadius: 24,
      alignItems: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
  },
  finishTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
  },
  finishText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  finishButton: {
      backgroundColor: colors.primary,
      width: '100%',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
  },
  finishButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
  homeButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  homeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FlashCardReviewSession;