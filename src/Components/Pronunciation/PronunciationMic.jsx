import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const PronunciationMic = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.micButton,
          isRecording && styles.micButtonRecording,
          isProcessing && styles.micButtonProcessing,
        ]}
        onPress={isRecording ? onStopRecording : onStartRecording}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : isRecording ? (
          <Ionicons name="stop" size={scale(32)} color="#FFFFFF" />
        ) : (
          <Ionicons name="mic" size={scale(32)} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#41D6E3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#41D6E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micButtonProcessing: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
});

export default PronunciationMic;





