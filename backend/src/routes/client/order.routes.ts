import { Router } from 'express';
import { ClientOrderController } from '../../controllers/client/order.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Tạm thời chưa bắt verifyToken để test nhanh cho user, 
// nhưng trong thực tế nên có verifyToken
router.post('/', ClientOrderController.createOrder);

export default router;
