import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { scale, verticalScale, SAFE_AREA_PADDING } from '../../Theme/responsive';
import colors from '../../Theme/colors';
import lessonService from '../../Services/lessonService';
import Toast from '../../Components/Common/Toast';
import { LectureContent } from '../../Components/Lesson';

const { width, height } = Dimensions.get('window');

const ModuleLearningScreen = ({ route, navigation }) => {
  const { moduleId, moduleName, lessonId, lessonTitle, courseId, courseTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [module, setModule] = useState(null);
  const [moduleProgress, setModuleProgress] = useState(0); // Progress từ backend API
  const [lectureTree, setLectureTree] = useState([]);
  const [lectures, setLectures] = useState([]); // Flattened lectures for navigation
  const [lecturesDetail, setLecturesDetail] = useState({}); // Lưu lecture detail đầy đủ
  const [loadingLecturesDetail, setLoadingLecturesDetail] = useState({}); // Track loading state
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const indicatorScrollRef = useRef(null);
  const lectureScrollRef = useRef(null);
  const moduleStartedRef = useRef(new Set());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (moduleId) {
      loadModuleContent();
      // Gọi startModule khi vào màn hình (giống web app)
      startModuleOnEnter();
    }
  }, [moduleId]);

  // Refresh progress khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      if (moduleId) {
        refreshModuleProgress();
      }
    }, [moduleId])
  );

  useEffect(() => {
    animateProgress();
  }, [moduleProgress]);

  // Sync scroll position when currentLectureIndex changes (from buttons)
  useEffect(() => {
    if (lectureScrollRef.current && lectures.length > 0) {
      // Clear any pending scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Mark as scrolling
      isScrollingRef.current = true;
      
      // Scroll immediately without animation for fast button presses
      lectureScrollRef.current.scrollTo({
        x: currentLectureIndex * width,
        animated: false, // No animation for instant response
      });
      
      // Reset scrolling flag after a short delay
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentLectureIndex]);

  // Auto-expand items that contain the current lecture (giống web app)
  useEffect(() => {
    if (lectures.length > 0 && currentLectureIndex >= 0 && lectureTree.length > 0) {
      const currentLecture = lectures[currentLectureIndex];
      const currentLectureId = currentLecture?.LectureId || currentLecture?.lectureId;
      
      if (currentLectureId) {
        const findParentIds = (items, targetId, parentIds = []) => {
          for (const item of items) {
            const itemId = item.lectureId || item.LectureId;
            const children = item.children || item.Children || [];
            
            if (itemId === targetId) {
              return parentIds;
            }
            
            if (children.length > 0) {
              const result = findParentIds(children, targetId, [...parentIds, itemId]);
              if (result !== null) {
                return result;
              }
            }
          }
          return null;
        };

        const parentIds = findParentIds(lectureTree, currentLectureId);
        if (parentIds && parentIds.length > 0) {
          setExpandedItems(new Set(parentIds));
        }
      }
    }
  }, [currentLectureIndex, lectures, lectureTree]);

  // Auto-scroll indicator to active dot
  useEffect(() => {
    if (indicatorScrollRef.current && lectures.length > 0 && currentLectureIndex >= 0) {
      setTimeout(() => {
        if (indicatorScrollRef.current) {
          const dotWidth = scale(6) + scale(5); // dot width + gap
          const scrollPosition = Math.max(0, (currentLectureIndex * dotWidth) - (width * 0.3));
          
          indicatorScrollRef.current.scrollTo({
            x: scrollPosition,
            animated: true,
          });
        }
      }, 100);
    }
  }, [currentLectureIndex, lectures.length]);

  // Fetch lecture detail khi currentLectureIndex thay đổi (lazy loading + pre-fetch)
  useEffect(() => {
    if (lectures.length > 0 && currentLectureIndex >= 0 && currentLectureIndex < lectures.length) {
      // Fetch current lecture
      const currentLecture = lectures[currentLectureIndex];
      const currentLectureId = currentLecture?.LectureId || currentLecture?.lectureId;
      
      if (currentLectureId && !lecturesDetail[currentLectureId] && !loadingLecturesDetail[currentLectureId]) {
        fetchLectureDetail(currentLectureId);
      }

      // Pre-fetch lecture trước (nếu có) - để swipe về không phải chờ
      if (currentLectureIndex > 0) {
        const prevLecture = lectures[currentLectureIndex - 1];
        const prevLectureId = prevLecture?.LectureId || prevLecture?.lectureId;
        if (prevLectureId && !lecturesDetail[prevLectureId] && !loadingLecturesDetail[prevLectureId]) {
          fetchLectureDetail(prevLectureId);
        }
      }

      // Pre-fetch lecture sau (nếu có) - để swipe tiếp không phải chờ
      if (currentLectureIndex < lectures.length - 1) {
        const nextLecture = lectures[currentLectureIndex + 1];
        const nextLectureId = nextLecture?.LectureId || nextLecture?.lectureId;
        if (nextLectureId && !lecturesDetail[nextLectureId] && !loadingLecturesDetail[nextLectureId]) {
          fetchLectureDetail(nextLectureId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLectureIndex, lectures.length]);

  
  const fetchLectureDetail = async (lectureId) => {
    const parsedLectureId = typeof lectureId === 'string' ? parseInt(lectureId) : lectureId;
    if (!parsedLectureId || isNaN(parsedLectureId)) {
      return;
    }

    // Mark as loading
    setLoadingLecturesDetail(prev => ({
      ...prev,
      [parsedLectureId]: true,
    }));

    try {
      const response = await lessonService.getLectureById(parsedLectureId);
      let lectureData = null;
      
      if (response?.data?.success && response?.data?.data) {
        lectureData = response.data.data;
      } else if (response?.data) {
        lectureData = response.data;
      }

      if (lectureData) {
        setLecturesDetail(prev => ({
          ...prev,
          [parsedLectureId]: lectureData,
        }));
      }
    } catch (error) {
      console.error(`Error fetching lecture detail ${parsedLectureId}:`, error);
    } finally {
      // Remove loading state
      setLoadingLecturesDetail(prev => {
        const newState = { ...prev };
        delete newState[parsedLectureId];
        return newState;
      });
    }
  };

  // Gọi startModule khi vào màn hình (giống web app - LectureDetail.jsx line 66-85)
  const startModuleOnEnter = async () => {
    const parsedModuleId = typeof moduleId === 'string' ? parseInt(moduleId) : moduleId;
    if (parsedModuleId && !isNaN(parsedModuleId) && !moduleStartedRef.current.has(parsedModuleId)) {
      try {
        console.log(`Starting module ${parsedModuleId}...`);
        const response = await lessonService.startModule(parsedModuleId);
        moduleStartedRef.current.add(parsedModuleId);
        console.log(`Module ${parsedModuleId} started successfully:`, response);
        
      } catch (err) {
        console.error(`Error starting module ${parsedModuleId}:`, err);
        console.error('Error details:', err.response?.data || err.message);
        // Tiếp tục load dữ liệu dù API có lỗi
      }
    } else {
      if (moduleStartedRef.current.has(parsedModuleId)) {
        console.log(`Module ${parsedModuleId} already started, skipping API call`);
      } else {
        console.warn(`Invalid moduleId: ${moduleId} (parsed: ${parsedModuleId})`);
      }
    }
  };

  const loadModuleContent = async () => {
    try {
      setLoading(true);
      
      // Fetch module info with progress from backend API
      try {
        const moduleResponse = await lessonService.getModuleById(moduleId);
        let moduleData = null;
        if (moduleResponse?.data?.success && moduleResponse?.data?.data) {
          moduleData = moduleResponse.data.data;
        } else if (moduleResponse?.data) {
          moduleData = moduleResponse.data;
        }
        
        if (moduleData) {
          setModule(moduleData);
          // Lấy ProgressPercentage từ backend API
          const progress = moduleData.ProgressPercentage || moduleData.progressPercentage || 0;
          setModuleProgress(Number(progress));
        }
      } catch (moduleError) {
        console.error('Error loading module info:', moduleError);
        // Tiếp tục load lectures dù có lỗi
      }
      
      // Try to get lecture tree first (like web app)
      try {
        const treeResponse = await lessonService.getLectureTreeByModuleId(moduleId);
        
        // Handle ServiceResponse format: { success, data, message, statusCode }
        let treeData = null;
        if (treeResponse?.data?.success && treeResponse?.data?.data) {
          treeData = treeResponse.data.data;
        } else if (treeResponse?.data) {
          treeData = Array.isArray(treeResponse.data) ? treeResponse.data : null;
        } else if (Array.isArray(treeResponse)) {
          treeData = treeResponse;
        }
        
        if (treeData && Array.isArray(treeData) && treeData.length > 0) {
          // Store tree structure for sidebar
          setLectureTree(treeData);
          
          // Flatten tree structure to get all lectures (only leaf nodes) for navigation
          const flattenLectures = (lectures, result = []) => {
            lectures.forEach(lecture => {
              const children = lecture.Children || lecture.children || [];
              if (children.length === 0) {
                // Only add leaf nodes (lectures without children)
                result.push(lecture);
              } else {
                // Recursively flatten children
                flattenLectures(children, result);
              }
            });
            return result;
          };
          
          const allLectures = flattenLectures(treeData);
          
          // Sort by OrderIndex
          const sortedLectures = allLectures.sort((a, b) => {
            const aOrder = a.OrderIndex || a.orderIndex || 0;
            const bOrder = b.OrderIndex || b.orderIndex || 0;
            return aOrder - bOrder;
          });
          
          if (sortedLectures.length > 0) {
            setLectures(sortedLectures);
            setLoading(false);
            return;
          }
        }
      } catch (treeError) {
        console.error('Error loading lecture tree:', treeError);
        // Lecture tree not available, try regular lectures API
      }
      
      // Fallback: Load lectures directly
      const response = await lessonService.getLecturesByModuleId(moduleId);
      
      // Handle ServiceResponse format
      let lecturesData = [];
      if (response?.data?.success && response?.data?.data) {
        lecturesData = response.data.data;
      } else if (response?.data) {
        lecturesData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        lecturesData = response;
      }
      
      // Sort lectures by OrderIndex
      const sortedLectures = lecturesData.sort((a, b) => {
        const aOrder = a.OrderIndex || a.orderIndex || 0;
        const bOrder = b.OrderIndex || b.orderIndex || 0;
        return aOrder - bOrder;
      });
      
      // For flat list, treat as tree with no children
      setLectureTree(sortedLectures);
      setLectures(sortedLectures);
    } catch (error) {
      console.error('❌ Error loading module:', error);
      setToast({
        visible: true,
        message: error?.response?.data?.message || error?.message || 'Không thể tải nội dung học',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const animateProgress = () => {
    // Sử dụng progress từ backend API (0-100) chuyển sang 0-1
    const progress = moduleProgress / 100;
    
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  // Handle swipe gesture to change lecture
  const handleScrollEnd = (event) => {
    // Only update if not scrolling from button press
    if (isScrollingRef.current) {
      return;
    }
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    
    if (newIndex >= 0 && newIndex < lectures.length && newIndex !== currentLectureIndex) {
      setCurrentLectureIndex(newIndex);
    }
  };
  
  // Handle scroll begin to track user-initiated scrolling
  const handleScrollBegin = () => {
    isScrollingRef.current = false; // User is scrolling, not button press
  };

  const handleNext = () => {
    if (currentLectureIndex < lectures.length - 1) {
      const newIndex = currentLectureIndex + 1;
      // Update index immediately
      setCurrentLectureIndex(newIndex);
      // Scroll immediately without waiting for useEffect
      if (lectureScrollRef.current) {
        isScrollingRef.current = true;
        lectureScrollRef.current.scrollTo({
          x: newIndex * width,
          animated: false, // Instant scroll for fast button presses
        });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 100);
      }
    } else {
      handleCompleteModule();
    }
  };

  const handlePrevious = () => {
    if (currentLectureIndex > 0) {
      const newIndex = currentLectureIndex - 1;
      // Update index immediately
      setCurrentLectureIndex(newIndex);
      // Scroll immediately without waiting for useEffect
      if (lectureScrollRef.current) {
        isScrollingRef.current = true;
        lectureScrollRef.current.scrollTo({
          x: newIndex * width,
          animated: false, // Instant scroll for fast button presses
        });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 100);
      }
    }
  };

  // Refresh module progress from backend
  const refreshModuleProgress = async () => {
    try {
      const moduleResponse = await lessonService.getModuleById(moduleId);
      let moduleData = null;
      if (moduleResponse?.data?.success && moduleResponse?.data?.data) {
        moduleData = moduleResponse.data.data;
      } else if (moduleResponse?.data) {
        moduleData = moduleResponse.data;
      }
      
      if (moduleData) {
        setModule(moduleData);
        const progress = moduleData.ProgressPercentage || moduleData.progressPercentage || 0;
        setModuleProgress(Number(progress));
      }
    } catch (error) {
      console.error('Error refreshing module progress:', error);
    }
  };

  const handleCompleteModule = async () => {
    try {
      setCompleting(true);
      // KHÔNG gọi startModule ở đây vì:
      // 1. Đã gọi khi vào màn hình (startModuleOnEnter)
      // 2. Backend tự động complete cho Lecture/FlashCard modules khi start
      // 3. Module đã được auto-complete khi vào màn hình
      
      // Refresh progress từ backend trước khi navigate
      await refreshModuleProgress();
      
      setToast({
        visible: true,
        message: '🎉 Hoàn thành module!',
        type: 'success',
      });
      
      // Navigate back after 1.5 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error completing module:', error);
      setToast({
        visible: true,
        message: error?.response?.data?.message || error?.message || 'Không thể hoàn thành module',
        type: 'error',
      });
      setCompleting(false);
    }
  };

  const handleLectureComplete = () => {
    // Auto move to next lecture
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  // Toggle expand/collapse for tree items
  const toggleExpand = (lectureId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(lectureId)) {
      newExpanded.delete(lectureId);
    } else {
      newExpanded.add(lectureId);
    }
    setExpandedItems(newExpanded);
  };

  // Find lecture index in flattened list by lectureId
  const findLectureIndex = (lectureId) => {
    return lectures.findIndex(l => 
      String(l?.LectureId || l?.lectureId) === String(lectureId)
    );
  };

  // Render tree structure item (giống web app - LectureSidebar.jsx)
  const renderLectureTreeItem = (lecture, level = 0) => {
    const itemId = lecture.lectureId || lecture.LectureId;
    const title = lecture.title || lecture.Title || '';
    const numberingLabel = lecture.numberingLabel || lecture.NumberingLabel || '';
    const children = lecture.children || lecture.Children || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedItems.has(itemId);
    
    // Check if this lecture is active (find in flattened list)
    const lectureIndex = findLectureIndex(itemId);
    const isActive = lectureIndex === currentLectureIndex;

    const displayLabel = numberingLabel || `${lecture.orderIndex || lecture.OrderIndex || ''}`;

    const handleItemPress = () => {
      if (hasChildren) {
        // Toggle expand/collapse for parent nodes
        toggleExpand(itemId);
      } else {
        // Navigate to lecture for leaf nodes
        if (lectureIndex >= 0) {
          setCurrentLectureIndex(lectureIndex);
          setShowSidebar(false);
        }
      }
    };

    return (
      <View key={itemId}>
        <TouchableOpacity
          style={[
            styles.sidebarItem,
            isActive && styles.sidebarItemActive,
            { paddingLeft: scale(16 + level * 20) },
          ]}
          onPress={handleItemPress}
          activeOpacity={0.7}
        >
          <View style={styles.sidebarItemLeft}>
            {hasChildren ? (
              <TouchableOpacity
                onPress={() => toggleExpand(itemId)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={scale(18)}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.expandPlaceholder} />
            )}
            
            <View style={[
              styles.sidebarItemIcon,
              isActive && styles.sidebarItemIconActive,
            ]}>
              {isActive ? (
                <Ionicons name="play-circle" size={scale(18)} color="#FFFFFF" />
              ) : (
                <Text style={styles.sidebarItemNumber}>{displayLabel}</Text>
              )}
            </View>
            
            <View style={styles.sidebarItemContent}>
              <Text
                style={[
                  styles.sidebarItemText,
                  isActive && styles.sidebarItemTextActive,
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
              {isActive && (
                <View style={styles.sidebarItemBadge}>
                  <Text style={styles.sidebarItemBadgeText}>Đang học</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {hasChildren && isExpanded && (
          <View style={styles.sidebarChildren}>
            {children.map((child) => renderLectureTreeItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải nội dung...</Text>
      </View>
    );
  }

  if (lectures.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={scale(64)} color={colors.error} />
        <Text style={styles.errorTitle}>Không có nội dung</Text>
        <Text style={styles.errorText}>Module này chưa có bài giảng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentLecture = lectures[currentLectureIndex];
  // Sử dụng progress từ backend API thay vì tự tính
  const progressPercentage = moduleProgress;
  const isLastLecture = currentLectureIndex === lectures.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />

      {/* Header with Progress */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {moduleName || 'Module'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Bài {currentLectureIndex + 1}/{lectures.length}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerMenuButton}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={scale(20)} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content with Swipe */}
      <View style={styles.contentContainer}>
        <ScrollView
          ref={lectureScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="start"
        >
          {lectures.map((lecture, index) => {
            const lectureId = lecture?.LectureId || lecture?.lectureId;
            const parsedLectureId = typeof lectureId === 'string' ? parseInt(lectureId) : lectureId;
            // Sử dụng lecture detail nếu có, nếu không thì dùng lecture từ tree/list
            const lectureDetail = parsedLectureId && lecturesDetail[parsedLectureId] 
              ? lecturesDetail[parsedLectureId] 
              : lecture;
            const isLoadingDetail = parsedLectureId && loadingLecturesDetail[parsedLectureId];

            return (
              <View key={lectureId || index} style={styles.lecturePage}>
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {isLoadingDetail && !lecturesDetail[parsedLectureId] ? (
                    <View style={styles.loadingLectureContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.loadingLectureText}>Đang tải nội dung...</Text>
                    </View>
                  ) : (
                    <LectureContent
                      lecture={lectureDetail}
                      onComplete={handleLectureComplete}
                    />
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Navigation Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + verticalScale(10) }]}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentLectureIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={currentLectureIndex === 0}
          >
            <Ionicons
              name="arrow-back"
              size={scale(20)}
              color={currentLectureIndex === 0 ? colors.textLight : colors.primary}
            />
            <Text
              style={[
                styles.navButtonText,
                currentLectureIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              Trước
            </Text>
          </TouchableOpacity>

          <View style={styles.lectureIndicatorContainer}>
            <ScrollView
              ref={indicatorScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lectureIndicator}
              style={styles.lectureIndicatorScroll}
              scrollEnabled={lectures.length > 15}
            >
              {lectures.map((_, index) => {
                const isActive = index === currentLectureIndex;
                return (
                  <View
                    key={index}
                    style={[
                      styles.indicatorDot,
                      isActive && styles.indicatorDotActive,
                    ]}
                  />
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonNext]}
            onPress={handleNext}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.navButtonNextText}>
                  {isLastLecture ? 'Hoàn thành' : 'Tiếp'}
                </Text>
                <Ionicons name="arrow-forward" size={scale(20)} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sidebar Modal */}
      <Modal
        visible={showSidebar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSidebar(false)}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.sidebarBackdrop} 
            activeOpacity={1}
            onPress={() => setShowSidebar(false)}
          />
          <View style={[styles.sidebar, { paddingTop: insets.top }]}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sidebarHeader}
            >
              <View style={styles.sidebarHeaderContent}>
                <View style={styles.sidebarHeaderLeft}>
                  <Ionicons name="list" size={scale(24)} color="#FFFFFF" />
                  <Text style={styles.sidebarTitle}>Mục lục bài giảng</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowSidebar(false)}
                  style={styles.sidebarCloseButton}
                >
                  <Ionicons name="close-circle" size={scale(32)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <View style={styles.sidebarProgress}>
              <Text style={styles.sidebarProgressText}>
                Tiến độ: {currentLectureIndex + 1}/{lectures.length}
              </Text>
            </View>
            
            <ScrollView
              style={styles.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              {lectureTree.length > 0 ? (
                lectureTree.map((lecture) => renderLectureTreeItem(lecture, 0))
              ) : (
                <View style={styles.noLectures}>
                  <Ionicons name="document-outline" size={scale(48)} color={colors.textLight} />
                  <Text style={styles.noLecturesText}>Chưa có bài giảng nào</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: scale(8),
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingBottom: verticalScale(12),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: scale(8),
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerMenuButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: scale(16),
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  lecturePage: {
    width: width,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    gap: scale(12),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: scale(8),
    backgroundColor: colors.backgroundLight,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textLight,
  },
  navButtonNext: {
    backgroundColor: colors.primary,
  },
  navButtonNextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lectureIndicatorContainer: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: scale(8),
    justifyContent: 'center',
  },
  lectureIndicatorScroll: {
    flexGrow: 0,
  },
  lectureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
    gap: scale(5),
    minWidth: '100%',
  },
  indicatorDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#E5E7EB',
    minWidth: scale(6),
  },
  indicatorDotActive: {
    width: scale(24),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
  },
  sidebar: {
    width: width * 0.85,
    backgroundColor: '#F9FAFB',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sidebarHeader: {
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(16),
  },
  sidebarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  sidebarTitle: {
    fontSize: scale(20),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  sidebarCloseButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarProgress: {
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarProgressText: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(8),
    marginVertical: scale(4),
    borderRadius: scale(12),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sidebarItemActive: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: scale(4),
    borderLeftColor: colors.primary,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  sidebarItemIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarItemIconActive: {
    backgroundColor: colors.primary,
  },
  sidebarItemNumber: {
    fontSize: scale(14),
    fontFamily: 'Quicksand-Bold',
    color: colors.textSecondary,
  },
  sidebarItemContent: {
    flex: 1,
  },
  sidebarItemText: {
    fontSize: scale(15),
    fontFamily: 'Quicksand-SemiBold',
    color: colors.text,
    lineHeight: scale(20),
  },
  sidebarItemTextActive: {
    color: colors.primary,
    fontFamily: 'Quicksand-Bold',
  },
  sidebarItemBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginTop: verticalScale(4),
    alignSelf: 'flex-start',
  },
  sidebarItemBadgeText: {
    fontSize: scale(11),
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  sidebarSeparator: {
    height: 0,
  },
  expandButton: {
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(4),
  },
  expandPlaceholder: {
    width: scale(24),
    marginRight: scale(4),
  },
  sidebarChildren: {
    backgroundColor: '#F9FAFB',
  },
  noLectures: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  noLecturesText: {
    marginTop: verticalScale(16),
    fontSize: scale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingLectureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  loadingLectureText: {
    marginTop: verticalScale(16),
    fontSize: scale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ModuleLearningScreen;
