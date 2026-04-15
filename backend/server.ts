import express, { type Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandlingMiddleware from './src/middlewares/errorHandler.middleware.js';
import { testConnection } from './src/config/database.js';
import models from './src/models/index.js'
import rootRouter from './src/routes/index.js';


dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors()); // Cho phép Frontend gọi API
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

    // Lắng nghe port
    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
};

startServer();