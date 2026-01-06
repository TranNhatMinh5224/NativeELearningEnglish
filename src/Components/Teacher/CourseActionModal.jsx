import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../Theme/colors';
import { scale } from '../../Theme/responsive';

const CourseActionModal = ({ visible, onClose, onManageCourse, onManageSubmissions, courseTitle }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.modalTitle}>{courseTitle || 'Chọn hành động'}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => {
                    onManageCourse();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="school" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.optionTitle}>Quản lý khóa học</Text>
                  <Text style={styles.optionDesc}>Xem và chỉnh sửa thông tin khóa học</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => {
                    onManageSubmissions();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="document-text" size={28} color="#F59E0B" />
                  </View>
                  <Text style={styles.optionTitle}>Quản lý bài nộp</Text>
                  <Text style={styles.optionDesc}>Xem và chấm bài nộp của học sinh</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: scale(20),
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: scale(13),
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default CourseActionModal;


