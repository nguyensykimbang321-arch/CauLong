import { Router } from 'express';
import { ClientOrderController } from '../../controllers/client/order.controller.js';
import { verifyToken, optionalToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu đăng nhập để xem đơn hàng của tôi
router.get('/my', verifyToken, ClientOrderController.getMyOrders);

// Tạo đơn hàng (Cho phép cả khách và user đã log in, nhưng controller sẽ ưu tiên lấy req.user)
router.post('/', optionalToken, ClientOrderController.createOrder);

router.patch('/:id/cancel', verifyToken, ClientOrderController.cancelOrder);

export default router;
