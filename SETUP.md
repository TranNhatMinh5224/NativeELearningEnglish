# 🚀 Native E-Learning English App

## 📋 Yêu cầu hệ thống

- Node.js (v16 trở lên)
- npm hoặc yarn
- Expo CLI
- Backend API đang chạy

## ⚙️ Cài đặt

### 1️⃣ Clone repository

```bash
git clone <repository-url>
cd NativeELearningEnglish
```

### 2️⃣ Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### 3️⃣ Cấu hình API URL

**Tạo file `.env` từ template:**

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

**Chỉnh sửa file `.env`:**

```env
REACT_APP_API_BASE_URL=http://<IP_MÁY_TÍNH_CỦA_BẠN>:5029/api
```

#### 🔍 Cách lấy IP máy tính:

**Windows:**
```bash
ipconfig
# Tìm dòng "IPv4 Address" (ví dụ: 192.168.1.178)
```

**Mac:**
```bash
ifconfig | grep inet
# Hoặc: System Preferences > Network
```

**Linux:**
```bash
ip addr show
# Hoặc: ifconfig
```

#### 📱 Lưu ý về URL:

- **Emulator Android**: `http://10.0.2.2:5029/api`
- **Emulator iOS**: `http://localhost:5029/api`
- **Điện thoại thật**: `http://<IP_MÁY_TÍNH>:5029/api` (máy tính và điện thoại phải cùng mạng WiFi)

### 4️⃣ Chạy Backend API

Trước khi chạy app, đảm bảo Backend đang chạy:

```bash
cd ../BackendASP/LearningEnglish.API
dotnet run --urls "http://0.0.0.0:5029"
```

Backend sẽ chạy tại: `http://0.0.0.0:5029`

### 5️⃣ Chạy ứng dụng

```bash
npm start
# hoặc
expo start
```

Sau đó:
- Nhấn `i` để chạy trên iOS Simulator
- Nhấn `a` để chạy trên Android Emulator
- Quét QR code bằng Expo Go app (trên điện thoại thật)

## 🔥 Troubleshooting

### Lỗi "Network Error" khi đăng nhập:

1. ✅ Kiểm tra Backend đang chạy: Mở `http://<IP>:5029/swagger` trên trình duyệt
2. ✅ Kiểm tra file `.env` có đúng IP không
3. ✅ Máy tính và điện thoại phải **cùng mạng WiFi**
4. ✅ Tắt Firewall hoặc cho phép port 5029:
   ```bash
   # Windows (PowerShell với quyền Admin)
   New-NetFirewallRule -DisplayName "ASP.NET Core 5029" -Direction Inbound -LocalPort 5029 -Protocol TCP -Action Allow
   ```

### Lỗi không load được ảnh:

Reload Expo app (nhấn `r` trong terminal)

### Thay đổi file `.env`:

Sau khi thay đổi `.env`, cần:
1. Stop app (Ctrl+C)
2. Xóa cache: `expo start -c`
3. Reload app

## 📁 Cấu trúc thư mục

```
NativeELearningEnglish/
├── assets/           # Ảnh, fonts, icons
├── src/
│   ├── Components/   # Reusable components
│   ├── Pages/        # Màn hình chính
│   ├── Routes/       # Navigation
│   ├── Services/     # API services
│   ├── Theme/        # Colors, responsive, animations
│   └── Utils/        # Helper functions
├── .env             # Config API URL (không push lên git)
├── .env.example     # Template config
└── app.json         # Expo config
```

## 🌐 API Endpoints

- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Get Courses: `GET /api/courses`
- Get My Courses: `GET /api/courses/my-courses`

## 👥 Team

Developed by Catalunya English Team
