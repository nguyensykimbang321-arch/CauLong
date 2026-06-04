import { Router } from 'express';
import { AdminOrderController } from '../../controllers/admin/order.controller.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);
router.use(requireRoles(['staff']));

router.get(
  '/',
  AdminOrderController.getAll
);

router.get(
  '/pending-pickup',
  AdminOrderController.getPendingPickupOrders
);

router.get(
  '/:id',
  AdminOrderController.getById
);

router.patch(
  '/:id/confirm',
  AdminOrderController.confirmOrder
);

router.patch(
  '/:id/complete',
  AdminOrderController.completeOrder
);

router.get(
  '/pending-payment',
  AdminOrderController.getPendingPaymentOrders
);

router.patch(
  '/:id/pay-cash',
  AdminOrderController.payCash
);

export default router;