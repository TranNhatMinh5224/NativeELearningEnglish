import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import teacherPackageService from '../../Services/teacherPackageService';
import { formatPrice } from '../../Utils/formatters';

const ProScreen = ({ navigation }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await teacherPackageService.getTeacherPackages();
      
      // Backend trả về ServiceResponse với Data là array
      let packagesData = [];
      if (response && response.data) {
        packagesData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        packagesData = response;
      }

      // Sắp xếp theo thứ tự: Basic, Standard, Premium
      const sortedPackages = packagesData.sort((a, b) => {
        const order = { 'Basic': 1, 'Standard': 2, 'Premium': 3 };
        const aLevel = a.packageLevel || a.name || '';
        const bLevel = b.packageLevel || b.name || '';
        return (order[aLevel] || 999) - (order[bLevel] || 999);
      });

      setPackages(sortedPackages);
    } catch (error) {
      console.error('Load packages error:', error);
      // Fallback: sử dụng mock data
      setPackages([
        {
          id: 1,
          name: 'Basic Teacher Package',
          packageLevel: 'Basic',
          description: 'Gói Basic Teacher Package Teacher Package',
          price: 299000,
        },
        {
          id: 2,
          name: 'Gói Giáo Viên Tiêu Chuẩn',
          packageLevel: 'Standard',
          description: 'Gói Gói Giáo Viên Tiêu Chuẩn Teacher Package',
          price: 499000,
        },
        {
          id: 3,
          name: 'Gói Giáo Viên Cao Cấp',
          packageLevel: 'Premium',
          description: 'Gói Gói Giáo Viên Cao Cấp Teacher Package',
          price: 799000,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (packageItem) => {
    // TODO: Navigate to payment screen
    console.log('Upgrade to package:', packageItem);
    // navigation.navigate('Payment', { packageId: packageItem.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Description Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerSubtitle}>
          Mở khoá toàn bộ tính năng, tham gia lớp học và đồng hành cùng học sinh tốt hơn
        </Text>
      </View>

      {/* Packages Grid */}
      <View style={styles.packagesContainer}>
        {packages.map((packageItem, index) => {
          // Xác định theme cho từng package
          let packageTheme = {
            icon: '📚',
            iconName: 'school-outline',
            gradientColors: ['#8B5CF6', '#6366F1'],
            cardGradient: ['#F5F3FF', '#FFFFFF'],
            accentColor: '#8B5CF6',
            badge: null,
          };
          
          if (packageItem.packageLevel === 'Basic' || packageItem.name?.includes('Basic')) {
            packageTheme = {
              icon: '⭐',
              iconName: 'star',
              gradientColors: ['#8B5CF6', '#6366F1'],
              cardGradient: ['#F5F3FF', '#FFFFFF'],
              accentColor: '#8B5CF6',
              badge: null,
            };
          } else if (packageItem.packageLevel === 'Standard' || packageItem.name?.includes('Tiêu Chuẩn')) {
            packageTheme = {
              icon: '🔥',
              iconName: 'flame',
              gradientColors: ['#F59E0B', '#EF4444'],
              cardGradient: ['#FEF3C7', '#FFFFFF'],
              accentColor: '#F59E0B',
              badge: 'Phổ biến',
            };
          } else if (packageItem.packageLevel === 'Premium' || packageItem.name?.includes('Cao Cấp')) {
            packageTheme = {
              icon: '👑',
              iconName: 'diamond',
              gradientColors: ['#F59E0B', '#EF4444'],
              cardGradient: ['#FEF3C7', '#FFFFFF'],
              accentColor: '#F59E0B',
              badge: 'Cao cấp',
            };
          }

          return (
            <View key={packageItem.id || index} style={styles.packageCardWrapper}>
              {packageTheme.badge && (
                <View style={[styles.badge, { backgroundColor: packageTheme.accentColor }]}>
                  <Ionicons name="star" size={scale(12)} color="#FFFFFF" />
                  <Text style={styles.badgeText}>{packageTheme.badge}</Text>
                </View>
              )}
              <LinearGradient
                colors={packageTheme.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.packageCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconContainer, { backgroundColor: `${packageTheme.accentColor}15` }]}>
                      <Ionicons name={packageTheme.iconName} size={scale(28)} color={packageTheme.accentColor} />
                    </View>
                    <View style={styles.titleContainer}>
                      <Text style={styles.packageTitle}>
                        {packageItem.name || packageItem.packageLevel || 'Gói Giáo Viên'}
                      </Text>
                      {packageItem.packageLevel === 'Premium' && (
                        <View style={styles.crownContainer}>
                          <Ionicons name="diamond" size={scale(16)} color="#F59E0B" />
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: `${packageTheme.accentColor}20` }]} />

                <View style={styles.cardBody}>
                  <Text style={styles.packageDescription}>
                    {packageItem.description || `Gói ${packageItem.name || packageItem.packageLevel} Teacher Package`}
                  </Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={packageTheme.accentColor} />
                      <Text style={styles.featureText}>Truy cập đầy đủ tính năng</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={packageTheme.accentColor} />
                      <Text style={styles.featureText}>Hỗ trợ 24/7</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={packageTheme.accentColor} />
                      <Text style={styles.featureText}>Cập nhật miễn phí</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: `${packageTheme.accentColor}20` }]} />

                <View style={styles.cardFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.packagePrice, { color: packageTheme.accentColor }]}>
                      {formatPrice(packageItem.price || 0)}đ
                    </Text>
                    <Text style={styles.priceUnit}>/tháng</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => handleUpgrade(packageItem)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={packageTheme.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.upgradeButtonGradient}
                    >
                      <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.upgradeButtonText}>Nâng cấp</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 14 * 1.5,
  },
  packagesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  packageCardWrapper: {
    marginBottom: 32,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: scale(-8),
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: scale(20),
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    gap: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  packageCard: {
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  cardHeader: {
    padding: 24,
    paddingTop: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  crownContainer: {
    marginLeft: 4,
  },
  cardDivider: {
    height: 1,
    marginHorizontal: 24,
  },
  cardBody: {
    padding: 24,
  },
  packageDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 14 * 1.5,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  cardFooter: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  priceContainer: {
    flex: 1,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  upgradeButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: scale(120),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: verticalScale(20),
  },
});

export default ProScreen;
