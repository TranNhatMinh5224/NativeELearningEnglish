# 🎯 Cấu trúc App - React Native Standard

## 📁 Cấu trúc đầy đủ (Standard React Native)

```
src/
├── Components/
│   ├── Common/
│   │   └── Loading.jsx          ✅ Đang dùng
│   ├── Auth/                    📁 Sẵn sàng (thêm khi làm Login)
│   ├── Home/                    📁 Sẵn sàng (thêm khi làm Home)
│   ├── Courses/                 📁 Sẵn sàng (thêm khi làm Courses)
│   ├── Quiz/                    📁 Sẵn sàng (thêm khi làm Quiz)
│   └── FlashCard/               📁 Sẵn sàng (thêm khi làm FlashCard)
│
├── Pages/
│   └── Welcome.jsx              ✅ Đang dùng (Giao diện đã implement)
│
├── Routes/
│   └── index.jsx                ✅ Đang dùng (Navigator)
│
├── Services/                    📁 Sẵn sàng (thêm API services)
├── Context/                     📁 Sẵn sàng (thêm global state)
├── hooks/                       📁 Sẵn sàng (thêm custom hooks)
├── Utils/                       📁 Sẵn sàng (thêm helper functions)
└── Theme/
    └── colors.js                ✅ Đang dùng
```

## ✅ Đã implement

### 1. Welcome Page - `src/Pages/Welcome.jsx`

**Giao diện:**
- ✅ Hiển thị ảnh mochi-welcome.jpg
- ✅ Title "E-Learning English" (màu primary)
- ✅ Subtitle "Learn English Everyday"
- ✅ Loading spinner ở dưới
- ✅ Auto navigate sau 3s (đã comment để dùng sau)

**Code:**
```jsx
import { mochiWelcome } from '../../assets/images';
import Loading from '../Components/Common/Loading';
import colors from '../Theme/colors';

// Image responsive với width * 0.7, height * 0.4
// Title fontSize: 32, color: primary
// Subtitle fontSize: 18, color: textSecondary
// Loading position: absolute bottom 60
```

### 2. Loading Component - `src/Components/Common/Loading.jsx`

**Props linh hoạt:**
- `size`: 'small' | 'large' (default: 'large')
- `color`: màu spinner (default: colors.primary)
- `fullScreen`: true/false (default: true)
- `text`: text dưới spinner (optional)

**Cách dùng:**
```jsx
<Loading />                                    // Full screen
<Loading size="small" fullScreen={false} />    // Inline nhỏ
<Loading text="Đang tải dữ liệu..." />        // Có text
<Loading size="small" color="#FF0000" />       // Custom color
```

### 3. Theme Colors - `src/Theme/colors.js`

Palette màu sắc app:
```javascript
primary: '#6366F1',        // Indigo
secondary: '#8B5CF6',      // Purple
accent: '#EC4899',         // Pink
background: '#F8FAFC',     // Light gray
text: '#1E293B',
textSecondary: '#64748B',
error: '#EF4444',
success: '#10B981',
warning: '#F59E0B',
```

### 4. Navigator - `src/Routes/index.jsx`

Simple navigator hiện tại chỉ có Welcome:
```jsx
<Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="Welcome" component={WelcomePage} />
</Stack.Navigator>
```

### 5. App.tsx

```jsx
<SafeAreaProvider>
  <AppNavigator />
</SafeAreaProvider>
```

## 📁 Folders sẵn sàng cho tương lai

Mỗi folder có README.md hướng dẫn:

### Services/ - API Calls
Thêm khi cần gọi API:
- authService.js - Login, Register
- courseService.js - Get courses
- lessonService.js - Get lessons
- ...

### Context/ - Global State
Thêm khi cần state management:
- AuthContext.jsx - User, login/logout
- NotificationContext.jsx - Notifications
- ...

### hooks/ - Custom Hooks
Thêm custom hooks:
- useAuth.js
- useGoogleLogin.js
- ...

### Utils/ - Helper Functions
Thêm helper functions:
- formatDate()
- validateEmail()
- ...

### Components/ - UI Components
Mỗi folder sẵn sàng nhận components:
- Auth/ - Login/Register forms
- Home/ - Home screen components
- Courses/ - Course cards, lists
- Quiz/ - Quiz components
- FlashCard/ - FlashCard components

## 🚀 Chạy app

```bash
npm start
```

Scan QR code để xem Welcome screen!

## 📱 App hiện tại

**Màn hình:** Chỉ Welcome (với Loading)
**Giao diện:** Đã hoàn thiện đẹp
**Cấu trúc:** Đầy đủ folders chuẩn React Native

## 📝 Làm tiếp theo

1. **Thêm màn Login:**
   - Tạo Pages/Login.jsx
   - Tạo Components/Auth/LoginForm.jsx
   - Tạo Services/authService.js
   - Tạo Context/AuthContext.jsx

2. **Thêm màn Home:**
   - Tạo Pages/Home.jsx
   - Tạo Components/Home/CourseList.jsx
   - Dùng Services/courseService.js

3. **Cứ làm từng màn một, thêm file khi cần!**

**Cấu trúc đầy đủ, implement từng bước!** 🎉
