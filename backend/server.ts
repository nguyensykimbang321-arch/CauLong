import dotenv from 'dotenv';
dotenv.config();

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandlingMiddleware from './src/middlewares/errorHandler.middleware.js';
import { testConnection } from './src/config/database.js';
import rootRouter from './src/routes/index.js';
import http from 'http';
import { initSocket } from './src/config/socket.js';
import { initCronJobs } from './src/jobs/cron.js';
import { PaymentService } from './src/services/payment.service.js';


const app: Express = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================
app.use(helmet()); // Bảo mật HTTP headers

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.ADMIN_URL,
].filter((origin): origin is string => !!origin);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use((req, res, next) => {
    const rawCookies = req.headers.cookie;
    req.cookies = {};
    if (rawCookies) {
        rawCookies.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            const rawName = parts[0];
            if (rawName !== undefined) {
                const name = rawName.trim();
                const value = parts.slice(1).join('=');
                if (req.cookies) {
                    req.cookies[name] = decodeURIComponent(value);
                }
            }
        });
    }
    next();
});

app.use(express.json()); // Parse body dạng JSON
app.use(express.urlencoded({ extended: true })); // Parse body dạng form-data
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Log request ra terminal
}

// ==========================================
// 2. ROUTES (Sau này import từ src/routes)
// ==========================================
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Hệ thống đang hoạt động tốt!' });
});

app.use('/api/v1', rootRouter);

// ==========================================
// 3. ERROR HANDLING MIDDLEWARE (Luôn để cuối cùng)
// ==========================================
app.use(errorHandlingMiddleware);

// ==========================================
// 4. KHỞI CHẠY SERVER & DATABASE
// ==========================================
const startServer = async () => {
    // Test kết nối DB trước
    await testConnection();

    // Khởi tạo các tác vụ nền định kỳ (Cron jobs)
    initCronJobs();

    // Lắng nghe port
    server.listen(PORT, () => {
        console.log(`🚀 Server (kèm Socket.io) đang chạy tại http://localhost:${PORT}`);
    });

    // Tự động quét và xử lý đặt sân / đơn hàng VNPay quá hạn 30 phút (chạy mỗi 1 phút)
    setInterval(async () => {
        try {
            await PaymentService.checkExpiredPayments();
        } catch (e) {
            console.error("Lỗi chạy quét giao dịch hết hạn:", e);
        }
    }, 60000);
};

startServer();