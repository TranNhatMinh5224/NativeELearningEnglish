import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import teacherPackageService from '../../Services/teacherPackageService';
import authService from '../../Services/authService';
import userService from '../../Services/userService';
import { formatPrice } from '../../Utils/formatters';

const ProScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user and packages in parallel
      const [packagesRes, currentUser] = await Promise.all([
        teacherPackageService.getTeacherPackages(),
        authService.getCurrentUser()
      ]);
      
      setUser(currentUser);
      
      // Backend trả về ServiceResponse với Data là array
      let packagesData = [];
      if (packagesRes && packagesRes.data) {
        packagesData = Array.isArray(packagesRes.data) ? packagesRes.data : [packagesRes.data];
      } else if (Array.isArray(packagesRes)) {
        packagesData = packagesRes;
      }

      // Sắp xếp theo thứ tự: Basic, Standard, Premium, Professional
      const sortedPackages = packagesData.sort((a, b) => {
        const getLevelValue = (pkg) => {
          const level = pkg.Level || pkg.level;
          if (typeof level === 'number') {
            return level; // 1, 2, 3, 4
          }
          const order = { 'Basic': 1, 'Standard': 2, 'Premium': 3, 'Professional': 4 };
          return order[level] || 999;
        };
        return getLevelValue(a) - getLevelValue(b);
      });

      setPackages(sortedPackages);
    } catch (error) {
      console.error('Load data error:', error);
      // Fallback: sử dụng mock data nếu lỗi
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

    const handleUpgrade = async (packageItem) => {
      // Tránh double click
      if (upgrading) return;
      
      const packageId = packageItem.teacherPackageId || packageItem.TeacherPackageId || packageItem.id;
      
      try {
        setUpgrading(true);
        
        // Bước 1: Kiểm tra trạng thái gói hiện tại của user
        const userResponse = await userService.getProfile();
        const currentUser = userResponse?.data?.data || userResponse?.data || userResponse;
        const subscription = currentUser?.TeacherSubscription || currentUser?.teacherSubscription;
        
        // Debug: Log để kiểm tra cấu trúc dữ liệu
        console.log('=== DEBUG SUBSCRIPTION CHECK ===');
        console.log('Current User:', JSON.stringify(currentUser, null, 2));
        console.log('Subscription:', JSON.stringify(subscription, null, 2));
        
        // Kiểm tra xem user đã có gói giáo viên đang hoạt động chưa
        // UserTeacherSubscriptionDto chỉ có IsTeacher và PackageLevel
        // IsTeacher = true nghĩa là có subscription đang active (Status == Active)
        if (subscription) {
          const isTeacher = subscription?.isTeacher === true || subscription?.IsTeacher === true;
          
          console.log('=== DEBUG SUBSCRIPTION CHECK ===');
          console.log('Subscription:', JSON.stringify(subscription, null, 2));
          console.log('isTeacher:', isTeacher);
          console.log('packageId (target):', packageId);
          
          // Nếu IsTeacher = true, nghĩa là đã có gói giáo viên đang hoạt động
          if (isTeacher) {
            console.log('BLOCK: User has active subscription');
            Alert.alert(
              'Thông báo',
              'Bạn đã có gói giáo viên đang hoạt động. Vui lòng đợi gói hiện tại hết hạn trước khi nâng cấp.',
              [{ text: 'OK' }]
            );
            return;
          }
        } else {
          console.log('No subscription found');
        }
        
        console.log('ALLOW: Proceeding to payment');
        
        // Bước 2: Nếu chưa có gói đang hoạt động, mới navigate đến PaymentScreen để tạo link thanh toán
        const desc = `Tạo tối đa ${packageItem.maxCourses} khóa học, ${packageItem.maxLessons} bài học và hỗ trợ ${packageItem.maxStudents} học viên.`;
        navigation.navigate('Payment', { 
          packageId: packageId,
          packageName: packageItem.packageName || packageItem.PackageName || packageItem.name || 'Gói Giáo Viên',
          packageDescription: packageItem.description || packageItem.Description || desc,
          price: packageItem.price || packageItem.Price
        });
      } catch (error) {
        // Nếu không lấy được user info, vẫn tiếp tục (backend sẽ check)
        const desc = `Tạo tối đa ${packageItem.maxCourses} khóa học, ${packageItem.maxLessons} bài học và hỗ trợ ${packageItem.maxStudents} học viên.`;
        navigation.navigate('Payment', { 
          packageId: packageId,
          packageName: packageItem.packageName || packageItem.PackageName || packageItem.name || 'Gói Giáo Viên',
          packageDescription: packageItem.description || packageItem.Description || desc,
          price: packageItem.price || packageItem.Price
        });
      } finally {
        setUpgrading(false);
      }
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
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Description Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerSubtitle}>
          Mở khoá toàn bộ tính năng, tham gia lớp học và đồng hành cùng học sinh tốt hơn
        </Text>
      </View>

      {/* Packages Grid */}
      <View style={styles.packagesContainer}>
        {packages.map((packageItem, index) => {
          // Xử lý cả PascalCase và camelCase, enum Level (1,2,3,4) sang string
          const getLevelString = (level) => {
            if (typeof level === 'number') {
              const map = { 1: 'Basic', 2: 'Standard', 3: 'Premium', 4: 'Professional' };
              return map[level] || 'Basic';
            }
            return level || 'Basic';
          };

          const rawLevel = packageItem.Level || packageItem.level;
          const packageLevel = getLevelString(rawLevel);
          
          // Lấy các field với cả PascalCase và camelCase
          const packageName = packageItem.PackageName || packageItem.packageName || packageItem.name || 'Gói Giáo Viên';
          const packageId = packageItem.TeacherPackageId || packageItem.teacherPackageId || packageItem.id;
          const maxCourses = packageItem.MaxCourses || packageItem.maxCourses || 0;
          const maxLessons = packageItem.MaxLessons || packageItem.maxLessons || 0;
          const maxStudents = packageItem.MaxStudents || packageItem.maxStudents || 0;
          const packagePrice = packageItem.Price || packageItem.price || 0;

          // Xác định theme cho từng package
          let packageTheme = {
            icon: '📚',
            iconName: 'school-outline',
            gradientColors: ['#8B5CF6', '#6366F1'],
            cardGradient: ['#F5F3FF', '#FFFFFF'],
            accentColor: '#8B5CF6',
            badge: null,
          };
          
          if (packageLevel === 'Basic') {
            packageTheme = {
              icon: '⭐',
              iconName: 'star',
              gradientColors: ['#8B5CF6', '#6366F1'],
              cardGradient: ['#F5F3FF', '#FFFFFF'],
              accentColor: '#8B5CF6',
              badge: null,
            };
          } else if (packageLevel === 'Standard') {
            packageTheme = {
              icon: '🔥',
              iconName: 'flame',
              gradientColors: ['#F59E0B', '#EF4444'],
              cardGradient: ['#FEF3C7', '#FFFFFF'],
              accentColor: '#F59E0B',
              badge: 'Phổ biến',
            };
          } else if (packageLevel === 'Premium' || packageLevel === 'Professional') {
            packageTheme = {
              icon: '👑',
              iconName: 'diamond',
              gradientColors: ['#F59E0B', '#EF4444'],
              cardGradient: ['#FEF3C7', '#FFFFFF'],
              accentColor: '#F59E0B',
              badge: 'Cao cấp',
            };
          }

          // Generate description from package details
          const generatedDesc = `Tạo tối đa ${maxCourses} khóa học, ${maxLessons} bài học và hỗ trợ ${maxStudents} học viên.`;
          const displayDesc = packageItem.Description || packageItem.description || generatedDesc;

          // Check current package (xử lý cả PascalCase và camelCase)
          const subscription = user?.TeacherSubscription || user?.teacherSubscription;
          const currentPackageId = subscription?.TeacherPackageId || subscription?.teacherPackageId;
          const isCurrentPackage = currentPackageId && parseInt(currentPackageId) === parseInt(packageId);

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
                style={[
                    styles.packageCard, 
                    isCurrentPackage && { borderColor: colors.success, borderWidth: 2 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconContainer, { backgroundColor: `${packageTheme.accentColor}15` }]}>
                      <Ionicons name={packageTheme.iconName} size={scale(28)} color={packageTheme.accentColor} />
                    </View>
                    <View style={styles.titleContainer}>
                      <Text style={styles.packageTitle}>
                        {packageName}
                      </Text>
                      {(packageLevel === 'Premium' || packageLevel === 'Professional') && (
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
                    {displayDesc}
                  </Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={packageTheme.accentColor} />
                      <Text style={styles.featureText}>Tối đa {maxCourses} khóa học</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={packageTheme.accentColor} />
                      <Text style={styles.featureText}>Tối đa {maxLessons} bài học</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={packageTheme.accentColor} />
                      <Text style={styles.featureText}>Tối đa {maxStudents} học viên</Text>
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
                      {formatPrice(packagePrice)}
                    </Text>
                    <Text style={styles.priceUnit}>/tháng</Text>
                  </View>
                  
                  {isCurrentPackage ? (
                      <View style={[styles.upgradeButton, { backgroundColor: colors.success }]}>
                        <View style={styles.upgradeButtonGradient}>
                            <Ionicons name="checkmark-circle" size={scale(18)} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.upgradeButtonText}>Đang sử dụng</Text>
                        </View>
                      </View>
                  ) : (
                      <TouchableOpacity
                        style={[styles.upgradeButton, upgrading && styles.upgradeButtonDisabled]}
                        onPress={() => {
                          if (upgrading) return;
                          // Tạo object đã normalize đầy đủ để truyền vào handleUpgrade
                          const normalizedPackage = {
                            ...packageItem,
                            teacherPackageId: packageId,
                            TeacherPackageId: packageId,
                            id: packageId,
                            name: packageName,
                            packageName: packageName,
                            PackageName: packageName,
                            description: displayDesc,
                            Description: displayDesc,
                            price: packagePrice,
                            Price: packagePrice
                          };
                          handleUpgrade(normalizedPackage);
                        }}
                        activeOpacity={0.8}
                        disabled={upgrading}
                      >
                        <LinearGradient
                          colors={packageTheme.gradientColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.upgradeButtonGradient}
                        >
                          {upgrading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" style={styles.buttonIcon} />
                              <Text style={styles.upgradeButtonText}>Nâng cấp</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                  )}
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
  upgradeButtonDisabled: {
    opacity: 0.6,
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