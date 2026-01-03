import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Pages
import LoadingPage from '../Pages/Loading';
import { LoginPage, RegisterPage, ForgotPasswordPage, OTPVerificationPage, ResetPasswordPage } from '../Pages/Auth';
import HomeScreen from '../Pages/Home/HomeScreen';
import OnionScreen from '../Pages/Onion/OnionScreen';
import ProScreen from '../Pages/Pro/ProScreen';
import GymScreen from '../Pages/Gym/GymScreen';
import ProfileScreen from '../Pages/Profile/ProfileScreen';
import VocabularyScreen from '../Pages/Vocabulary/VocabularyScreen';
import CourseDetailScreen from '../Pages/Course/CourseDetailScreen';
import SearchScreen from '../Pages/Search/SearchScreen';
import { LessonListScreen, LessonDetailScreen, ModuleLearningScreen, PronunciationDetailScreen } from '../Pages/Lesson';
import { PaymentScreen, PaymentSuccess, PaymentFailed, PaymentHistoryScreen } from '../Pages/Payment';
import NotificationScreen from '../Pages/Notification/NotificationScreen';
import FlashCardLearningScreen from '../Pages/FlashCard/FlashCardLearningScreen';
import FlashCardReviewSession from '../Pages/FlashCard/FlashCardReviewSession';
import TeacherHomeScreen from '../Pages/Teacher/TeacherHomeScreen';
import TeacherClassListScreen from '../Pages/Teacher/TeacherClassListScreen';
import CreateCourseScreen from '../Pages/Teacher/CreateCourseScreen';
import TeacherCourseDetailScreen from '../Pages/Teacher/TeacherCourseDetailScreen';
import TeacherLessonDetailScreen from '../Pages/Teacher/TeacherLessonDetailScreen';

// Theme
import colors from '../Theme/colors';
import { scale, SAFE_AREA_PADDING } from '../Theme/responsive';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon with Outline Icons
const TabIcon = ({ iconName, label, focused }) => {
  return (
    <View style={styles.tabItem}>
      <Ionicons 
        name={focused ? iconName : `${iconName}-outline`} 
        size={scale(24)} 
        color={focused ? colors.primary : colors.textLight}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
};

// Profile Stack Navigator - Nested stack cho Profile và ProScreen
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen 
        name="Pro" 
        component={ProScreen}
        options={{
          headerShown: true,
          headerTitle: 'Nâng cấp tài khoản',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
          },
          headerStyle: {
            backgroundColor: colors.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerBackTitleVisible: false,
          headerTintColor: colors.primary,
        }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator - 5 tabs
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" label="Trang chủ" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyCourses"
        component={OnionScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="library" label="Khóa học của tôi" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="document-text" label="Ôn tập từ vựng" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notebook"
        component={GymScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="book" label="Sổ tay từ vựng" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" label="Tài khoản" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Deep Linking Configuration
const linking = {
  prefixes: ['elearningenglish://', 'https://elearningenglish.com'], // Scheme và universal links
  config: {
    screens: {
      PaymentSuccess: {
        path: 'payment-success',
        parse: {
          paymentId: (paymentId) => paymentId,
          orderCode: (orderCode) => orderCode,
          courseId: (courseId) => courseId,
        },
      },
      PaymentFailed: {
        path: 'payment-failed',
        parse: {
          reason: (reason) => reason || 'Canceled',
          orderCode: (orderCode) => orderCode,
        },
      },
      // Các screens khác
      MainApp: '',
      Loading: '',
    },
  },
};

// App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Loading Screen - Màn đầu tiên */}
        <Stack.Screen name="Loading" component={LoadingPage} />
        
        {/* Main App - Sau khi loading xong */}
        <Stack.Screen name="MainApp" component={MainTabs} />
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Register" component={RegisterPage} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
        <Stack.Screen 
          name="OTPVerification" 
          component={OTPVerificationPage}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ResetPassword" 
          component={ResetPasswordPage}
          options={{
            headerShown: false,
          }}
        />
        
        {/* Detail Screens */}
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="LessonList"
          component={LessonListScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="LessonDetail"
          component={LessonDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{
            headerShown: false,
            presentation: 'modal', // Hiện dạng modal trượt từ dưới lên cho đẹp
          }}
        />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccess}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="PaymentFailed"
          component={PaymentFailed}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="PaymentHistory"
          component={PaymentHistoryScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="ModuleLearning"
          component={ModuleLearningScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="FlashCardLearning"
          component={FlashCardLearningScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="FlashCardReviewSession"
          component={FlashCardReviewSession}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="PronunciationDetail"
          component={PronunciationDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        
        {/* Teacher Screens */}
        <Stack.Screen
          name="TeacherHome"
          component={TeacherHomeScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="TeacherClasses"
          component={TeacherClassListScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="CreateCourse"
          component={CreateCourseScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="TeacherCourseDetail"
          component={TeacherCourseDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="TeacherLessonDetail"
          component={TeacherLessonDetailScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: scale(65) + (Platform.OS === 'ios' ? SAFE_AREA_PADDING.bottom : scale(8)),
    paddingBottom: Platform.OS === 'ios' ? SAFE_AREA_PADDING.bottom : scale(8),
    paddingTop: scale(8),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginBottom: scale(4),
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default AppNavigator;