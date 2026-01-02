import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const PronunciationProgress = ({ score, showScore, feedback }) => {
  // Normalize score: ensure it's a number between 0 and 100
  const scoreNum = typeof score === 'number' ? score : parseFloat(score) || 0;
  const normalizedScore = Math.min(Math.max(scoreNum, 0), 100);
  
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  // Show score if showScore is true (even if score is 0)
  const displayScore = showScore;

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        <Svg width={140} height={140}>
          <Circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={8}
          />
          {displayScore && (
            <Circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke="#41D6E3"
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
          )}
        </Svg>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreNumber}>
            {displayScore ? Math.round(normalizedScore) : 0}
          </Text>
        </View>
      </View>
      {feedback && (
        <View style={styles.feedbackWrapper}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: scale(20),
  },
  circleWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scoreContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: scale(32),
    fontWeight: '700',
    color: colors.primary,
  },
  feedbackWrapper: {
    marginTop: scale(12),
    paddingHorizontal: scale(20),
  },
  feedbackText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PronunciationProgress;

