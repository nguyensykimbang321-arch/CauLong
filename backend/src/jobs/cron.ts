import cron from 'node-cron';
import { OrderService } from '../services/order.service.js';

export const initCronJobs = () => {
    // Chạy mỗi 1 phút để kiểm tra và hủy các đơn hàng quá 24h chưa thanh toán
    cron.schedule('* * * * *', async () => {
        try {
            await OrderService.cancelExpiredOrders();
        } catch (error) {
            console.error('[CRON ERROR] Lỗi khi hủy đơn hàng quá hạn:', error);
        }
    });

    console.log('[CRON] Đã khởi tạo các tác vụ nền thành công');
};
