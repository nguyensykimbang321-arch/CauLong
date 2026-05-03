import axios from 'axios';

// Thay đổi IP này thành IP máy tính của bạn nếu chạy trên thiết bị thật
// Android Emulator thường dùng 10.0.2.2 để truy cập localhost máy host
const baseURL = 'http://10.50.1.20:5000/api/v1'; 

const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để thêm Token vào header nếu có
api.interceptors.request.use(async (config) => {
    // Tương lai có thể thêm logic lấy token từ storage ở đây
    // const token = await AsyncStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const fetchFacilities = async () => {
    const response = await api.get('/app/facilities');
    return response.data.data;
};

export const fetchFacilityDetail = async (id) => {
    const response = await api.get(`/app/facilities/${id}`);
    return response.data.data;
};

export const fetchAvailability = async (id, date, courtTypeId) => {
    const response = await api.get(`/app/facilities/${id}/availability`, {
        params: { date, courtTypeId }
    });
    return response.data.data;
};

export const fetchProducts = async () => {
    const response = await api.get('/app/products');
    return response.data.data;
};

export const login = async (email, password) => {
    const response = await api.post('/app/auth/login', { email, password });
    return response.data.data;
};

export const createBooking = async (bookingData) => {
    const response = await api.post('/app/bookings', bookingData);
    return response.data.data;
};

export const fetchMyBookings = async () => {
    const response = await api.get('/app/bookings/my');
    return response.data.data;
};

export const createOrder = async (orderData) => {
    const response = await api.post('/app/orders', orderData);
    return response.data.data;
};

export default api;
