import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const axiosClient = axios.create({
  // Chú ý: Khi chạy máy ảo Android, localhost của máy tính phải đổi thành IP máy tính (VD: 192.168.1.x)
  // Tạm thời để IP máy em, sau này các bạn đổi thành IP mạng WiFi nhà các bạn ấy
  baseURL: 'http://192.168.x.x:5000/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// REQUEST INTERCEPTOR
axiosClient.interceptors.request.use(
  async (config) => {
    // Phải dùng await với AsyncStorage
    const token = await AsyncStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      
      // Đá văng ra màn hình đăng nhập của Expo Router
      router.replace('/(auth)/login'); 
    }
    
    const errorMessage = error.response?.data || error;
    return Promise.reject(errorMessage);
  }
);

export default axiosClient;