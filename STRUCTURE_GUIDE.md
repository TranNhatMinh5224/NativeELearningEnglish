# Cấu trúc mới cho NativeELearningEnglish

## 📁 Folder Structure

```
src/
├── Components/
│   ├── Loading/                    # Loading components
│   │   ├── LoadingScreen.jsx       # Main loading screen with animations
│   │   └── index.js                # Export barrel file
│   │
│   ├── Welcome/                    # Welcome page components
│   │   ├── WelcomeHeader.jsx       # Header with logo & auth buttons
│   │   ├── HeroSection.jsx         # Hero section with CTA
│   │   ├── FeatureSectionOne.jsx   # First feature section
│   │   ├── FeatureSectionTwo.jsx   # Second feature section  
│   │   ├── PricingSection.jsx      # Pricing cards
│   │   ├── WelcomeFooter.jsx       # Footer links
│   │   └── index.js                # Export barrel file
│   │
│   └── [Future components folders]
│
├── Pages/
│   ├── Welcome/                    # Welcome page container
│   │   ├── WelcomePage.jsx         # Main page logic & composition
│   │   └── index.js                # Export barrel file
│   │
│   └── [Future pages folders]
│
└── Theme/
    ├── colors.js                   # Color palette
    ├── responsive.js               # Responsive utilities & scaling
    └── animations/
        └── index.js                # Animation hooks & utilities

```

## 🎨 Các Tính Năng Đã Cải Thiện

### 1. **Loading Screen** ([LoadingScreen.jsx](NativeELearningEnglish/src/Components/Loading/LoadingScreen.jsx))
✅ **Animations:**
- Fade in cho tất cả elements
- Scale animation cho character
- Pulse animation cho character image
- Smooth progress bar với Animated.timing

✅ **Optimization:**
- React.memo để tránh re-render
- useRef cho animated values
- Proper cleanup trong useEffect
- Configurable duration prop

✅ **Responsive:**
- Sử dụng scale & verticalScale từ responsive.js
- Adaptive spacing & fontSize
- Works trên mọi screen sizes

---

### 2. **Welcome Page** ([WelcomePage.jsx](NativeELearningEnglish/src/Pages/Welcome/WelcomePage.jsx))

✅ **Component Tách Nhỏ:**
- `WelcomeHeader` - Header với logo & buttons
- `HeroSection` - Hero section với CTA
- `FeatureSectionOne` - Feature 1
- `FeatureSectionTwo` - Feature 2
- `PricingSection` - Pricing cards
- `WelcomeFooter` - Footer

✅ **Optimization:**
- Tất cả components dùng React.memo
- useCallback cho tất cả handlers
- Tránh inline object creation
- Optimized re-renders

✅ **Navigation Handlers:**
- `handleLogin()` - Đăng nhập
- `handleRegister()` - Đăng ký
- `handleGetStarted()` - Bắt đầu học
- `handleJoinGroup()` - Tham gia nhóm
- `handleLearnMore()` - Tìm hiểu thêm
- `handleSelectPlan(plan)` - Chọn gói Premium

*(Hiện tại show Alert, sẵn sàng thay bằng navigation.navigate())*

✅ **Animations:**
- Staggered animations (delay khác nhau cho mỗi section)
- Fade in + slide up cho smooth entrance
- All animations use native driver

✅ **Responsive:**
- Tất cả sử dụng responsive utilities
- Scale theo screen size
- Adaptive font sizes & spacing

---

### 3. **Theme System**

#### [animations/index.js](NativeELearningEnglish/src/Theme/animations/index.js)
Custom hooks để dùng lại:
- `useFadeIn(duration, delay)` - Fade in animation
- `useSlideIn(direction, duration, delay)` - Slide animation
- `useScale(duration, delay)` - Scale animation
- `usePulse()` - Pulse loop animation
- `useShimmer()` - Shimmer effect

#### [responsive.js](NativeELearningEnglish/src/Theme/responsive.js)
Responsive utilities:
- `scale(size)` - Horizontal scaling
- `verticalScale(size)` - Vertical scaling
- `moderateScale(size, factor)` - Balanced scaling
- `spacing` - Predefined spacing values
- `fontSize` - Predefined font sizes
- Device detection helpers

---

## 🚀 Cách Sử Dụng

### Import Components:
```javascript
// Old way (deprecated)
import Welcome from '../Pages/Welcome';

// New way
import WelcomePage from '../Pages/Welcome';
import LoadingScreen from '../Components/Loading';
```

### Import Sub-components:
```javascript
import { 
  WelcomeHeader, 
  HeroSection,
  PricingSection 
} from '../Components/Welcome';
```

### Sử dụng Animation Hooks:
```javascript
import { useFadeIn, useSlideIn } from '../Theme/animations';

const MyComponent = () => {
  const fadeIn = useFadeIn(800, 200);
  const slideUp = useSlideIn('up', 600);
  
  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
      {/* content */}
    </Animated.View>
  );
};
```

### Sử dụng Responsive:
```javascript
import { scale, fontSize, spacing } from '../Theme/responsive';

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,        // 24 (scaled)
    marginTop: spacing.xl,      // 32 (scaled)
  },
  title: {
    fontSize: fontSize.xxl,     // 24 (scaled)
  },
  image: {
    width: scale(200),          // Scaled width
    height: verticalScale(150), // Scaled height
  },
});
```

---

## 📝 TODO: Các Pages/Features Tiếp Theo

Khi làm các pages mới, tạo folder structure tương tự:

```
src/
├── Components/
│   ├── Teacher/              # Components cho giáo viên
│   │   ├── TeacherCard.jsx
│   │   ├── ClassList.jsx
│   │   └── index.js
│   │
│   ├── Student/              # Components cho học viên
│   │   ├── StudentProfile.jsx
│   │   ├── Progress.jsx
│   │   └── index.js
│   │
│   └── Course/               # Components cho khóa học
│       ├── CourseCard.jsx
│       ├── LessonItem.jsx
│       └── index.js
│
└── Pages/
    ├── Teacher/              # Pages của giáo viên
    │   ├── TeacherDashboard/
    │   ├── ClassManagement/
    │   └── StudentManagement/
    │
    ├── Student/              # Pages của học viên
    │   ├── Dashboard/
    │   ├── MyCourses/
    │   └── Profile/
    │
    └── Course/               # Pages của khóa học
        ├── CourseDetail/
        ├── LessonDetail/
        └── Quiz/
```

---

## ✨ Lợi Ích Của Cấu Trúc Mới

1. **Dễ tìm kiếm** - Mỗi feature có folder riêng
2. **Dễ bảo trì** - Components nhỏ, dễ sửa
3. **Tái sử dụng** - Components & hooks có thể dùng lại
4. **Performance** - Optimized với memo & callbacks
5. **Responsive** - Auto scale theo device
6. **Animations** - Smooth & professional
7. **Scalable** - Dễ mở rộng cho features mới

---

## 🔄 Migration Guide

Nếu có code cũ import từ:
```javascript
// OLD
import Welcome from '../Pages/Welcome.jsx';
import Loading from '../Components/Common/Loading';
```

Đổi thành:
```javascript
// NEW
import WelcomePage from '../Pages/Welcome';
import LoadingScreen from '../Components/Loading';
```

**Note:** File cũ vẫn còn, chưa xóa để tránh break code. Sau khi test kỹ, có thể xóa:
- `src/Pages/Welcome.jsx` (old)
- `src/Components/Common/Loading.jsx` (old)
