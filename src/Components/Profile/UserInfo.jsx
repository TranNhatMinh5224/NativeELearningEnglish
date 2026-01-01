import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const InfoRow = ({ icon, label, value }) => (
  <>
    <View style={styles.row}>
      <Ionicons name={icon} size={scale(20)} color={colors.primary} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'Chưa có thông tin'}</Text>
      </View>
    </View>
    <View style={styles.divider} />
  </>
);

const UserInfo = ({ user, onUpgradePro }) => (
  <View>
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.decorative}>
        {['book', 'school', 'trophy', 'star'].map((icon, i) => (
          <View key={i} style={styles.decorativeIcon}>
            <Ionicons name={icon} size={scale(30)} color="rgba(255,255,255,0.3)" />
          </View>
        ))}
      </View>
    </LinearGradient>

    <View style={styles.avatarSection}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)?.toUpperCase() || 
               user?.lastName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={scale(16)} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
      
      <TouchableOpacity style={styles.proButton} onPress={onUpgradePro}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.proGradient}
        >
          <Ionicons name="star" size={scale(16)} color="#FFF" />
          <Text style={styles.proText}>Nâng cấp lên Pro</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>

    <View style={styles.infoSection}>
      <Text style={styles.title}>Thông tin cá nhân</Text>
      <View style={styles.card}>
        <InfoRow
          icon="person-outline"
          label="Họ và tên"
          value={`${user?.lastName} ${user?.firstName}`}
        />
        <InfoRow icon="mail-outline" label="Email" value={user?.email} />
        <View style={styles.row}>
          <Ionicons name="call-outline" size={scale(20)} color={colors.primary} />
          <View style={styles.content}>
            <Text style={styles.label}>Số điện thoại</Text>
            <Text style={styles.value}>{user?.phoneNumber || user?.phone || 'Chưa có thông tin'}</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: { height: 120 },
  decorative: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
  },
  decorativeIcon: { padding: 10 },
  avatarSection: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 24,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(50),
  },
  avatarText: {
    fontSize: scale(36),
    fontWeight: 'bold',
    color: '#FFF',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: scale(15),
    width: scale(30),
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  userName: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  userEmail: {
    fontSize: scale(14),
    color: colors.textLight,
    marginTop: 4,
  },
  proButton: {
    marginTop: 16,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  proGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  proText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#FFF',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: scale(12),
    color: colors.textLight,
    marginBottom: 4,
  },
  value: {
    fontSize: scale(14),
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: scale(32),
  },
});

export default UserInfo;
