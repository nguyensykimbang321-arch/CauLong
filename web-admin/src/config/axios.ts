import axios from 'axios';
// Chúng ta không import toast ở đây để giữ code sạch

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1', // Dùng biến môi trường của Vite
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 giây
});

// --- REQUEST INTERCEPTOR ---
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về data luôn, bỏ qua cái wrapper { status: 200, data: ... } của axios
    return response.data; 
  },
  async (error) => {
    // const originalRequest = error.config;

    // Xử lý lỗi 401 (Unauthorized) - Hết hạn Token hoặc chưa đăng nhập
    if (error.response?.status === 401) {
      // Vì Backend hiện tại chưa làm Refresh Token, nên ta Logout luôn
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Chuyển hướng về trang login (Dùng window.location là cách an toàn nhất ở layer này)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Nếu có lỗi, ném ra để Component tự hiển thị Toast (Sẽ linh hoạt hơn)
    const errorMessage = error.response?.data || error;
    return Promise.reject(errorMessage);
  }
);

export default axiosClient;