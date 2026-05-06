import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const memoryStorage = {};

/**
 * Một wrapper cực kỳ an toàn cho AsyncStorage để tránh lỗi "Native module is null" 
 * trên Web hoặc khi môi trường Native chưa được cấu hình đúng.
 */
const storage = {
  async getItem(key) {
    try {
      // 1. Ưu tiên LocalStorage trên Web
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      // 2. Thử dùng AsyncStorage trên Native
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const value = await AsyncStorage.getItem(key);
        return value;
      }
      // 3. Fallback sang localStorage nếu đang ở môi trường có window (ví dụ web-view)
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      // 4. Cuối cùng dùng bộ nhớ tạm
      return memoryStorage[key] || null;
    } catch (error) {
      return memoryStorage[key] || null;
    }
  },

  async setItem(key, value) {
    try {
      memoryStorage[key] = value;
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      // Silently fail or use memoryStorage only
    }
  },

  async removeItem(key) {
    try {
      delete memoryStorage[key];
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      // Silently fail
    }
  },

  async clear() {
    try {
      Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]);
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return;
      }
      if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
        await AsyncStorage.clear();
        return;
      }
    } catch (error) {
      console.error('Storage Error (clear):', error);
    }
  }
};

export default storage;
