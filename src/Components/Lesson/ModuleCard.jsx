import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const ModuleCard = ({ module, onPress, index }) => {
  const moduleId = module?.ModuleId || module?.moduleId;
  const moduleName = module?.Name || module?.name || `Module ${index + 1}`;
  const moduleDescription = module?.Description || module?.description || '';
  const lectures = module?.Lectures || module?.lectures || [];
  const contentType = module?.ContentType || module?.contentType || 1;
  const isCompleted = module?.IsCompleted || module?.isCompleted || false;

  const getModuleConfig = (type) => {
    // Backend enum: 1=Lecture, 2=Quiz, 3=Assignment, 4=FlashCard, 5=Video, 6=Reading
    switch (type) {
      case 1: // Lecture
        return {
          icon: 'book',
          color: '#6366F1',
          gradient: ['#6366F1', '#4F46E5'],
          label: 'Bài giảng',
        };
      case 2: // Quiz
        return {
          icon: 'help-circle',
          color: '#EF4444',
          gradient: ['#EF4444', '#DC2626'],
          label: 'Quiz',
        };
      case 3: // Assignment
        return {
          icon: 'document-text',
          color: '#8B5CF6',
          gradient: ['#8B5CF6', '#7C3AED'],
          label: 'Bài tập',
        };
      case 4: // FlashCard
        return {
          icon: 'albums',
          color: '#F59E0B',
          gradient: ['#F59E0B', '#D97706'],
          label: 'Flashcard',
        };
      case 5: // Video
        return {
          icon: 'play-circle',
          color: '#EC4899',
          gradient: ['#EC4899', '#DB2777'],
          label: 'Video',
        };
      case 6: // Reading
        return {
          icon: 'newspaper',
          color: '#10B981',
          gradient: ['#10B981', '#059669'],
          label: 'Đọc hiểu',
        };
      default:
        return {
          icon: 'document-text',
          color: colors.primary,
          gradient: [colors.primary, '#4F46E5'],
          label: 'Nội dung',
        };
    }
  };

  const config = getModuleConfig(contentType);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons name={config.icon} size={scale(24)} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.moduleName} numberOfLines={2}>
                {moduleName}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={[styles.typeText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
            </View>
          </View>
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={scale(24)} color="#10B981" />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={scale(22)} color={colors.textLight} />
          )}
        </View>

        {/* Description */}
        {moduleDescription ? (
          <Text style={styles.description} numberOfLines={2}>
            {moduleDescription}
          </Text>
        ) : null}

        {/* Footer Meta */}
        <View style={styles.footer}>
          {lectures.length > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="play-circle-outline" size={scale(16)} color={config.color} />
              <Text style={styles.metaText}>
                {lectures.length} {lectures.length === 1 ? 'bài giảng' : 'bài giảng'}
              </Text>
            </View>
          )}
          {!isCompleted && (
            <View style={[styles.startButton, { backgroundColor: `${config.color}15` }]}>
              <Text style={[styles.startButtonText, { color: config.color }]}>
                Bắt đầu học
              </Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedLabel}>
              <Ionicons name="checkmark" size={scale(14)} color="#10B981" />
              <Text style={styles.completedText}>Đã hoàn thành</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: scale(16),
    padding: scale(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.backgroundLight,
    borderRadius: scale(6),
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  completedBadge: {
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: scale(8),
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default ModuleCard;
