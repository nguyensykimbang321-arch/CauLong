import axios, { type InternalAxiosRequestConfig } from 'axios';
// Chúng ta không import toast ở đây để giữ code sạch

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 giây
  withCredentials: true,
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

let isRefreshing = false;
interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}
// Hàng đợi chứa các request bị kẹt lại chờ refresh xong
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- RESPONSE INTERCEPTOR ---
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về data luôn, bỏ qua cái wrapper { status: 200, data: ... } của axios
    return response.data; 
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Xử lý lỗi 401 (Unauthorized) - Hết hạn Token hoặc chưa đăng nhập
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Tránh lặp vô hạn nếu chính request refresh-token bị 401
      if (originalRequest.url?.includes('/admin/auth/refresh-token')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Đánh dấu request này đã thử retry rồi, tránh vòng lặp vô hạn
      originalRequest._retry = true;

      // 1. Nếu đang có một tiến trình refresh chạy rồi, ta nhét các request khác vào hàng đợi
      if (isRefreshing) {
        return new Promise<string | null>(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = 'Bearer ' + token;
          }
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // 2. Bắt đầu quá trình Refresh Token
      isRefreshing = true;
      try {
        // 🔥 GỌI API (Không cần truyền refreshToken trong body vì nó đã nằm trong Cookie)
        const refreshResponse = await axios.post<{ data: { token: string } }>(
          `${axiosClient.defaults.baseURL}/admin/auth/refresh-token`,
          {},
          { withCredentials: true } // Phải có cái này để gửi Cookie
        );

        // Lấy Access Token mới từ Backend trả về
        const newAccessToken = refreshResponse.data.data.token;

        // Cập nhật lại LocalStorage
        localStorage.setItem('accessToken', newAccessToken);

        // Gắn token mới cho Axios mặc định
        if (axiosClient.defaults.headers.common) {
          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        }
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Chạy lại hàng đợi các request bị kẹt
        processQueue(null, newAccessToken);

        // Gọi lại cái request bị xịt lúc nãy
        return axiosClient(originalRequest);

      } catch (refreshError) {
        // Nếu API refresh-token cũng xịt (Token bị ban, hết hạn 7 ngày...)
        processQueue(refreshError, null);

        // ĐÁ VĂNG USER RA KHỎI APP
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu có lỗi khác, ném ra để Component tự hiển thị Toast
    const errorMessage = error.response?.data || error;
    return Promise.reject(errorMessage);
  }
);

export default axiosClient;