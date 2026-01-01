import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import colors from '../../Theme/colors';
import { scale, verticalScale } from '../../Theme/responsive';

const StreakModal = ({ visible, onClose, streakCount, isActiveToday }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          {/* Header với nút đóng */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textLight} />
          </TouchableOpacity>

          {/* Lửa lớn */}
          <View style={styles.fireContainer}>
            <Ionicons 
                name="flame" 
                size={scale(80)} 
                color={isActiveToday ? "#FF9F0A" : "#CBD5E1"} 
            />
          </View>

          {/* Nội dung giống Web */}
          <View style={styles.textContent}>
            <Text style={styles.mainText}>
              Số ngày hoàn thành liên tục của bạn là <Text style={styles.highlightText}>{streakCount}</Text>
            </Text>
            
            {isActiveToday ? (
              <Text style={styles.successText}>
                Bạn đã hoàn thành streak hôm nay rồi! 🎉
              </Text>
            ) : (
              <Text style={styles.encourageText}>
                Hãy học để tăng thêm streak của ngày hôm nay nhé
              </Text>
            )}
          </View>

          {/* Nút OK */}
          <TouchableOpacity style={styles.okButton} onPress={onClose}>
            <Text style={styles.okButtonText}>Tuyệt vời</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: 32,
    width: '100%',
    maxWidth: scale(340),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  fireContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  highlightText: {
    fontWeight: '800',
    color: '#FF9F0A',
  },
  successText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  encourageText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  okButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: scale(12),
    width: '100%',
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  }
});

export default StreakModal;
