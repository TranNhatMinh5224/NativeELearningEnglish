import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const PasswordModal = ({ 
  visible, 
  onClose, 
  passwordData, 
  setPasswordData, 
  showPasswords, 
  setShowPasswords,
  errors,
  setErrors,
  onSave, 
  saving 
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Thay đổi mật khẩu</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu hiện tại:</Text>
          <View style={[styles.inputContainer, errors.currentPassword && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor={colors.textLight}
              value={passwordData.currentPassword}
              onChangeText={(text) => {
                setPasswordData({ ...passwordData, currentPassword: text });
                setErrors({ ...errors, currentPassword: null });
              }}
              secureTextEntry={!showPasswords.current}
            />
            <TouchableOpacity
              onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPasswords.current ? 'eye-outline' : 'eye-off-outline'}
                size={scale(20)}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
          {errors.currentPassword && <Text style={styles.error}>{errors.currentPassword}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu mới:</Text>
          <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={colors.textLight}
              value={passwordData.newPassword}
              onChangeText={(text) => {
                setPasswordData({ ...passwordData, newPassword: text });
                setErrors({ ...errors, newPassword: null });
              }}
              secureTextEntry={!showPasswords.new}
            />
            <TouchableOpacity
              onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPasswords.new ? 'eye-outline' : 'eye-off-outline'}
                size={scale(20)}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword && <Text style={styles.error}>{errors.newPassword}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Xác nhận mật khẩu:</Text>
          <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={colors.textLight}
              value={passwordData.confirmPassword}
              onChangeText={(text) => {
                setPasswordData({ ...passwordData, confirmPassword: text });
                setErrors({ ...errors, confirmPassword: null });
              }}
              secureTextEntry={!showPasswords.confirm}
            />
            <TouchableOpacity
              onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPasswords.confirm ? 'eye-outline' : 'eye-off-outline'}
                size={scale(20)}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: scale(14),
    color: colors.text,
    paddingVertical: 14,
  },
  eyeBtn: { padding: 4, marginLeft: 4 },
  inputError: { borderColor: colors.error },
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

export default PasswordModal;
