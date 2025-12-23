# 📁 Assets Organization Guide

## Cấu trúc

```
assets/
├── fonts/          # Custom fonts (.ttf, .otf)
├── icons/          # Icons nhỏ cho UI (buttons, tabs, navigation)
└── images/         # Illustrations, photos, large images
```

## 🖼️ Phân biệt Icons vs Images

### **icons/** - Dùng cho:
- ✅ Icon navigation (home, profile, settings)
- ✅ Icon buttons (play, pause, favorite)
- ✅ UI elements nhỏ, đơn giản
- ✅ File kích thước < 50KB
- ✅ Thường là PNG với background trong suốt
- ✅ Có nhiều size (1x, 2x, 3x)

**Ví dụ:**
```
icons/
├── home.png
├── profile.png
├── heart.png
├── play.png
└── index.js
```

### **images/** - Dùng cho:
- ✅ Illustrations (như mochi-khoahoc, mochi-loading)
- ✅ Background images
- ✅ Character/mascot images (dainganha)
- ✅ Welcome/splash screens
- ✅ Course thumbnails, photos
- ✅ File kích thước > 50KB

**Ví dụ:**
```
images/
├── dainganha.jpg
├── mochi-khoahoc.jpg
├── mochi-loading.jpg
├── mochi-welcome.jpg
├── welcome.png
└── index.js
```

### **fonts/** - Dùng cho:
- ✅ Custom font files (.ttf, .otf, .woff)
- ✅ Brand fonts (Roboto, Montserrat, etc.)

**Ví dụ:**
```
fonts/
├── Roboto-Regular.ttf
├── Roboto-Bold.ttf
├── Montserrat-Regular.ttf
└── README.md
```

## 🎯 Cách sử dụng

### 1. Import Images
```javascript
// Cách 1: Import từ index.js
import { mochiWelcome, dainganha } from '../assets/images';

// Cách 2: Import trực tiếp
import mochiWelcome from '../assets/images/mochi-welcome.jpg';

// Sử dụng trong component
<Image source={mochiWelcome} style={styles.image} />
```

### 2. Import Icons
```javascript
import { homeIcon, profileIcon } from '../assets/icons';

<Image source={homeIcon} style={styles.icon} />
```

### 3. Sử dụng Fonts
```javascript
// Trong App.tsx
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
  'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
});

if (!fontsLoaded) {
  return <Loading />;
}

// Trong StyleSheet
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Roboto-Regular', // Sử dụng custom font
    fontSize: 16,
  }
});
```

## 📦 Export Pattern

### images/index.js
```javascript
export { default as dainganha } from "./dainganha.jpg";
export { default as mochiKhoaHoc } from "./mochi-khoahoc.jpg";
export { default as mochiLoading } from "./mochi-loading.jpg";
export { default as mochiWelcome } from "./mochi-welcome.jpg";
export { default as welcome } from "./welcome.png";
```

### icons/index.js
```javascript
export { default as homeIcon } from "./home.png";
export { default as profileIcon } from "./profile.png";
export { default as heartIcon } from "./heart.png";
```

## 🎨 Best Practices

1. **Naming Convention:**
   - Images: `camelCase` (mochiWelcome, dainganha)
   - Icons: `camelCase` + `Icon` suffix (homeIcon, profileIcon)
   - Fonts: `PascalCase-Weight` (Roboto-Regular, Montserrat-Bold)

2. **File Formats:**
   - Icons: PNG (transparent background)
   - Photos/Illustrations: JPG (smaller size) hoặc PNG (nếu cần transparency)
   - Fonts: TTF hoặc OTF

3. **File Size:**
   - Optimize images trước khi add vào project
   - Icons: < 10KB mỗi file
   - Images: < 500KB mỗi file
   - Fonts: Chỉ include fonts thật sự cần dùng

4. **Responsive Images:**
   ```javascript
   // Sử dụng resizeMode
   <Image 
     source={mochiWelcome} 
     style={styles.image}
     resizeMode="contain" // hoặc 'cover', 'stretch'
   />
   ```

## ✅ Checklist khi thêm asset mới

### Thêm Image:
- [ ] Đặt file vào `assets/images/`
- [ ] Export trong `assets/images/index.js`
- [ ] Sử dụng tên camelCase
- [ ] Optimize file size

### Thêm Icon:
- [ ] Đặt file vào `assets/icons/`
- [ ] Export trong `assets/icons/index.js`
- [ ] Thêm suffix `Icon` vào tên
- [ ] Tạo các size khác nhau nếu cần (@1x, @2x, @3x)

### Thêm Font:
- [ ] Đặt file .ttf/.otf vào `assets/fonts/`
- [ ] Load font trong App.tsx bằng useFonts
- [ ] Test font hiển thị đúng
- [ ] Update theme nếu cần

## 🔗 Assets hiện tại

✅ **Images (5 files):**
- dainganha.jpg - Avatar/profile image
- mochi-khoahoc.jpg - Course illustration
- mochi-loading.jpg - Loading illustration
- mochi-welcome.jpg - Welcome illustration
- welcome.png - Welcome image

⏳ **Icons:** Chưa có (thêm sau khi cần)

⏳ **Fonts:** Chưa có (dùng system fonts)
