# Native E-Learning English - React Native App

Mobile application học tiếng Anh, được xây dựng với React Native và Expo, theo cấu trúc tương tự Web App.

## 📁 Cấu trúc Project

```
src/
├── Components/          # Các component UI tái sử dụng
│   ├── Common/         # Components chung (Logo, Toast...)
│   ├── Courses/        # Components hiển thị khóa học
│   ├── Home/           # Components cho Home screen
│   └── Loading/        # Loading screen components
│
├── Pages/              # Màn hình chính của app
│   ├── Auth/           # Các màn hình authentication
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── ForgotPW/
│   │   ├── OTPVerification/
│   │   └── ResetPassword/
│   ├── Course/         # Course detail screen
│   ├── Gym/            # Notebook screen (Sổ tay từ vựng)
│   ├── Home/           # Home screen
│   ├── Loading/        # Loading screen
│   ├── Onion/          # My Courses screen
│   ├── Pro/            # Premium upgrade screen
│   ├── Profile/        # Profile screen
│   ├── Search/         # Search screen
│   └── Vocabulary/     # Vocabulary review screen
│
├── Routes/             # Navigation configuration
│   └── index.jsx       # Main navigator with Tab & Stack
│
├── Services/           # API services
│   ├── axiosClient.js         # Axios setup với interceptors
│   ├── BaseURL.jsx            # Base URL config
│   ├── apiConfig.js           # API endpoints
│   ├── authService.js         # Auth APIs
│   ├── courseService.js       # Course APIs
│   ├── enrollmentService.js
│   ├── lessonService.js
│   ├── lectureService.js
│   ├── quizService.js
│   ├── flashcardService.js
│   ├── essayService.js
│   └── ... (các services khác)
│
├── Theme/              # Theme configuration
│   └── colors.js      # Color constants
│
└── Utils/              # Utility functions
    └── index.js       # Helper functions
```

## 🚀 Cài đặt

### Prerequisites
- Node.js >= 18
- npm hoặc yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app trên điện thoại (để test)

### Bước 1: Install dependencies
```bash
cd NativeELearningEnglish
npm install
```

### Bước 2: Cấu hình API
Mở file `src/Services/BaseURL.jsx` và cập nhật URL:
- **Android Emulator**: `http://10.0.2.2:5029/api`
- **iOS Simulator**: `http://localhost:5029/api`
- **Device thật**: Sử dụng IP máy tính (VD: `http://192.168.1.100:5029/api`)

### Bước 3: Chạy app
```bash
# Khởi động Metro bundler
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios
```

## 📱 Cấu trúc theo Web App

Project này được tổ chức **giống y hệt Web App** để:
- ✅ Dễ dàng tìm kiếm và sửa code
- ✅ Maintain đồng bộ giữa Web và Mobile
- ✅ Team dễ hiểu và phối hợp
- ✅ Tái sử dụng logic giữa các platform

## 🔧 Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: AsyncStorage

## 📝 Quy trình phát triển

### Implement một màn hình mới:
1. Tạo Service trong `Services/` nếu cần
2. Tạo Components trong `Components/[TênMàn]/`
3. Tạo Page trong `Pages/`
4. Thêm route vào `Routes/Paths.jsx`
5. Thêm screen vào `Routes/index.jsx`

### Ví dụ: Tạo màn Quiz
```
1. Services/quizService.js (đã có)
2. Components/Quiz/QuizCard.jsx (implement UI)
3. Pages/QuizDetail.jsx (implement màn hình)
4. Routes/Paths.jsx (thêm QUIZ_DETAIL)
5. Routes/index.jsx (thêm <Stack.Screen name={PATHS.QUIZ_DETAIL} />)
```

## 🎨 Implement UI

Hiện tại các file đã có **cấu trúc sẵn**, bạn chỉ cần:
1. Vào từng Page/Component
2. Implement giao diện theo design
3. Kết nối với Services đã có sẵn

**Ví dụ Login Page:**
```jsx
// src/Pages/Login.jsx
import { useAuth } from '../Context/AuthContext';
import authService from '../Services/authService';

const LoginPage = () => {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    await login({ email, password });
  };
  
  // Implement UI ở đây
};
```

## 🔑 Features đã setup

✅ Authentication Context (login, register, logout)  
✅ Notification Context  
✅ Streak Context  
✅ API Services (19 services hoàn chỉnh)  
✅ Axios client với auto token refresh  
✅ Navigation structure  
✅ Common components (Button, Input, Card, Loading)  

## 📚 API Services có sẵn

- authService - Login, Register, Profile
- courseService - Khóa học
- enrollmentService - Đăng ký khóa học
- lessonService - Bài học
- lectureService - Bài giảng
- quizService - Quiz
- flashcardService - Flashcard
- essayService - Bài luận
- assessmentService - Đánh giá
- pronunciationService - Phát âm
- notificationService - Thông báo
- streakService - Chuỗi học tập
- paymentService - Thanh toán

## 🎯 Next Steps

1. Implement UI cho các Pages (Login, Register, Home...)
2. Implement UI cho các Components
3. Test kết nối với Backend
4. Thêm các màn hình còn lại
5. Polish UI/UX

## 📞 Support

Cấu trúc này giúp bạn dễ dàng maintain và phát triển. Mọi thắc mắc về cấu trúc hoặc implementation, hãy tham khảo Web App để đồng bộ!

## Features

- 🔐 **Authentication**: Login, Register, Password Recovery
- 📚 **Course Management**: Browse, Enroll, Track Progress
- 📖 **Learning Modules**: Lessons, Lectures, Quizzes, Flashcards, Essays
- 🎯 **Progress Tracking**: Streak system, Course completion
- 👤 **User Profile**: Personal information, Learning stats
- 🔔 **Notifications**: Stay updated with learning activities

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **State Management**: React Query, Context API
- **Navigation**: React Navigation (Stack + Tab)
- **UI Components**: React Native Paper
- **Form Handling**: React Hook Form + Zod
- **API Client**: Axios with interceptors
- **Storage**: AsyncStorage

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your mobile device (for testing)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint:
   - Open `src/config/api.config.ts`
   - Update `BASE_URL` with your backend API URL
   - For Android Emulator: `http://10.0.2.2:5029/api`
   - For iOS Simulator: `http://localhost:5029/api`
   - For Physical Device: Use your computer's IP address

## Running the App

### Development Mode

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Scan QR Code
1. Run `npm start`
2. Open Expo Go app on your device
3. Scan the QR code displayed in terminal

## Project Structure

```
src/
├── api/              # API client and endpoints
│   ├── apiClient.ts  # Axios setup with interceptors
│   ├── auth.api.ts   # Authentication APIs
│   └── course.api.ts # Course APIs
├── components/       # Reusable components
│   ├── CourseCard.tsx
│   └── EmptyState.tsx
├── config/          # Configuration files
│   └── api.config.ts # API endpoints config
├── context/         # React Context providers
│   └── AuthContext.tsx
├── hooks/           # Custom hooks
│   └── useCourses.ts
├── navigation/      # Navigation setup
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── screens/         # Screen components
│   ├── auth/        # Auth screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── main/        # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── MyCoursesScreen.tsx
│   │   ├── ExploreScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── course/      # Course related screens
│       └── CourseDetailScreen.tsx
├── theme/           # Theme configuration
│   └── index.ts     # Colors, spacing, fonts
├── types/           # TypeScript interfaces
│   └── index.ts     # Type definitions
└── utils/           # Utility functions
    ├── validation.ts
    └── formatters.ts
```

## Key Features Implementation

### Authentication Flow
- JWT token-based authentication
- Automatic token refresh
- Secure token storage using AsyncStorage
- Protected routes with AuthContext

### API Integration
- Centralized API client with Axios
- Request/Response interceptors
- Automatic token injection
- Error handling

### State Management
- React Query for server state
- Context API for global state
- Optimistic updates for better UX

### Navigation
- Stack Navigator for auth flow
- Tab Navigator for main app
- Deep linking support ready

## Environment Configuration

Create `.env` file (optional):
```env
API_BASE_URL=http://your-api-url.com/api
```

## Backend Integration

This app connects to the ASP.NET Core backend. Ensure:
1. Backend is running and accessible
2. CORS is configured to allow mobile app origin
3. API endpoints match the configuration

## Common Issues & Solutions

### Cannot connect to API
- **Android Emulator**: Use `10.0.2.2` instead of `localhost`
- **iOS Simulator**: `localhost` should work
- **Physical Device**: Use computer's IP address on same network

### Metro Bundler Issues
```bash
# Clear cache and restart
expo start -c
```

### Package Installation Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

To extend this application:
1. Add Lesson/Module screens
2. Implement Quiz functionality
3. Add Flashcard review system
4. Integrate pronunciation assessment
5. Add offline support
6. Implement push notifications