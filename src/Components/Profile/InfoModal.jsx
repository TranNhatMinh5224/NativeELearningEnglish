import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const InfoModal = ({ 
  visible, 
  onClose, 
  infoData, 
  setInfoData, 
  errors,
  setErrors,
  onSave, 
  saving 
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Chỉnh sửa thông tin</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tên:</Text>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="Nhập tên"
            placeholderTextColor={colors.textLight}
            value={infoData.firstName}
            onChangeText={(text) => {
              setInfoData({ ...infoData, firstName: text });
              setErrors({ ...errors, firstName: null });
            }}
          />
          {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Họ:</Text>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            placeholder="Nhập họ"
            placeholderTextColor={colors.textLight}
            value={infoData.lastName}
            onChangeText={(text) => {
              setInfoData({ ...infoData, lastName: text });
              setErrors({ ...errors, lastName: null });
            }}
          />
          {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={infoData.email}
            editable={false}
          />
          <Text style={styles.disabledNote}>Email không thể thay đổi</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Số điện thoại:</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={colors.textLight}
            value={infoData.phone}
            onChangeText={(text) => {
              setInfoData({ ...infoData, phone: text });
              setErrors({ ...errors, phone: null });
            }}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.saveBtn]} 
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: colors.text,
  },
  closeBtn: { padding: 4 },
  field: { marginBottom: 20 },
  label: {
    fontSize: scale(14),
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: scale(10),
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: scale(14),
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.error },
  inputDisabled: {
    backgroundColor: colors.disabled,
    color: colors.textLight,
  },
  disabledNote: {
    fontSize: scale(11),
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  error: {
    fontSize: scale(12),
    color: colors.error,
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: scale(10),
    minWidth: scale(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { backgroundColor: colors.border },
  cancelText: {
    color: colors.text,
    fontSize: scale(14),
    fontWeight: '600',
  },
  saveBtn: { backgroundColor: colors.primary },
  saveText: {
    color: '#FFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
});

export default InfoModal;
