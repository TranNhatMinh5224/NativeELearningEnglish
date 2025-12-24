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
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import flashcardReviewService from '../../Services/flashcardReviewService';
import Toast from '../../Components/Common/Toast';

const GymScreen = ({ navigation }) => {
  const [statistics, setStatistics] = useState(null);
  const [masteredWords, setMasteredWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load statistics và mastered words in parallel
      const [statsRes, masteredRes] = await Promise.all([
        flashcardReviewService.getStatistics().catch(() => ({ data: null })),
        flashcardReviewService.getMasteredFlashCards().catch(() => ({ data: null })),
      ]);

      // Parse statistics
      let statsData = null;
      if (statsRes && statsRes.data) {
        statsData = statsRes.data;
      } else if (statsRes && (statsRes.masteredCount !== undefined)) {
        statsData = statsRes;
      }

      // Parse mastered words
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
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
        <View style={styles.header}>
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
