import { Router } from 'express';
import { PaymentController } from '../../controllers/admin/payment.controller.js';

const router = Router();

router.get('/vnpay-ipn', PaymentController.vnpayIpn);
router.get('/vnpay-return', PaymentController.vnpayReturn);

export default router;