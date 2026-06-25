import axios from 'axios';

// Thay đổi IP này thành IP máy tính của bạn nếu chạy trên thiết bị thật
// Android Emulator thường dùng 10.0.2.2 để truy cập localhost máy host
const baseURL = 'http://192.168.1.230:5000/api/v1';

export { baseURL };
export const serverOrigin = baseURL.replace(/\/api\/v1\/?$/, '');

const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

import storage from '../utils/storage';

// Interceptor để thêm Token vào header nếu có
api.interceptors.request.use(async (config) => {
    try {
        const token = await storage.getItem('token');
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} | Token: ${token ? token.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.error("Lỗi lấy token từ storage:", e);
    }
    return config;
});

// Interceptor xử lý response lỗi
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error(`[API 401] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Message: ${error.response?.data?.message}`);
        }
        return Promise.reject(error);
    }
);

export const fetchFacilities = async () => {
    const response = await api.get('/app/facilities');
    return response.data.data;
};

export const fetchFacilityDetail = async (id) => {
    const response = await api.get(`/app/facilities/${id}`);
    return response.data.data;
};

export const fetchCourtTypes = async (facilityId) => {
    const response = await api.get(`/app/facilities/${facilityId}/court-types`);
    return response.data.data;
};

export const fetchAvailability = async (facility_id, date, court_type) => {
    const response = await api.get('/app/bookings/booked-slots', {
        params: {
            facility_id,
            date,
            court_type
        }
    });
    return response.data.data;
};

export const fetchCheckAvailability = async ({ facility_id, date, start_time, end_time, court_type }) => {
    const response = await api.get('/app/bookings/availability', {
        params: {
            facility_id,
            date,
            start_time,
            end_time,
            court_type
        }
    });
    return response.data.data;
};

export const fetchProducts = async (facilityId) => {
    const response = await api.get('/app/products', {
        params: { facility_id: facilityId }
    });
    return response.data.data;
};

export const login = async (email, password) => {
    const response = await api.post('/app/auth/login', { email, password });
    return response.data.data;
};

export const register = async (userData) => {
    const response = await api.post('/app/auth/register', userData);
    return response.data.data;
};

export const createBooking = async (bookingData) => {
    const response = await api.post('/app/bookings', bookingData);
    return response.data.data;
};

export const createBatchBooking = async (bookings) => {
    const response = await api.post('/app/bookings/batch', { bookings });
    return response.data.data;
};

export const fetchMyBookings = async () => {
    const response = await api.get('/app/bookings');
    return response.data.data;
};

export const createOrder = async (orderData) => {
    const response = await api.post('/app/orders', orderData);
    return response.data.data;
};

export const fetchMyOrders = async () => {
    const response = await api.get('/app/orders');
    return response.data.data;
};

export const cancelOrder = async (orderId) => {
    const response = await api.patch(`/app/orders/${orderId}`, { status: 'cancelled' });
    return response.data.data;
};

export const cancelBooking = async (bookingId) => {
    const response = await api.patch(`/app/bookings/${bookingId}`, { status: 'cancelled' });
    return response.data.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/app/auth/forgot-password', { email });
    return response.data.data;
};

export const changePassword = async (passwordData) => {
    const response = await api.post('/app/auth/change-password', passwordData);
    return response.data.data;
};

export const previewPrice = async ({ facility_id, date, start_time, end_time, court_type }) => {
    const response = await api.post('/app/bookings/price-preview', {
        facility_id,
        date,
        start_time,
        end_time,
        court_type
    });
    return response.data.data;
};

export default api;

