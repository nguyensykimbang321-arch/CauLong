import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
let redisClient: ReturnType<typeof createClient> | null = null;
let isCacheEnabled = false;

if (redisUrl) {
    redisClient = createClient({
        url: redisUrl
    });

    redisClient.on('error', (err) => {
        console.warn('[Redis Error] Cảnh báo lỗi Redis client:', err.message || err);
    });

    redisClient.on('connect', () => {
        console.log('✅ Đã kết nối thành công tới Redis!');
        isCacheEnabled = true;
    });

    redisClient.on('end', () => {
        console.warn('[Redis Connection End] Kết nối Redis đã đóng.');
        isCacheEnabled = false;
    });

    // Khởi chạy kết nối không chặn (non-blocking) và bắt lỗi để tránh crash
    redisClient.connect().catch((err) => {
        console.warn('[Redis Init Connection Error] Không thể kết nối tới server Redis:', err.message || err);
        isCacheEnabled = false;
    });
} else {
    console.log('[Redis Cache] REDIS_URL không được cấu hình. Sử dụng chế độ DB trực tiếp (cache disabled).');
}

export { redisClient, isCacheEnabled };
