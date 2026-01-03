import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/Routes';
import { NotificationProvider } from './src/Context/NotificationContext';
import { ToastContainer } from './src/Components/Common/Toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AppNavigator />
        <ToastContainer />
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
