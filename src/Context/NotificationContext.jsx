import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService from '../Services/notificationService';
import authService from '../Services/authService';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const loggedIn = await authService.isLoggedIn();
      if (!loggedIn) {
        setUnreadCount(0);
        return;
      }

      const response = await notificationService.getUnreadCount();
      // Backend trả về ServiceResponse<int>
      setUnreadCount(response?.data || response || 0);
    } catch (error) {
   
      if (error?.response?.status === 401 || error?.status === 401) {
        setUnreadCount(0);
        return;
      }
      // Chỉ log error cho các lỗi khác
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  // Hàm để các màn hình khác gọi khi muốn cập nhật lại chuông
  const refresh = async () => {
    await fetchUnreadCount();
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Bạn có thể thêm setInterval ở đây nếu muốn real-time polling
    // const interval = setInterval(fetchUnreadCount, 30000); // 30s check 1 lần
    // return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};
