import { Router } from 'express';
import { AdminBookingController } from '../../controllers/admin/booking.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { createBookingByHotlineSchema, updateBookingStatusSchema } from '../../validations/booking.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', requireRoles(['admin', 'staff']), AdminBookingController.getAll);
router.get('/:booking_id', requireRoles(['admin', 'staff']), AdminBookingController.getById);

router.post(
    '/hotline',
    requireRoles(['admin', 'staff']), 
    validate(createBookingByHotlineSchema), 
    AdminBookingController.createByHotline
);

router.put('/:id/status', requireRoles(['admin', 'staff']), validate(updateBookingStatusSchema), AdminBookingController.updateStatus);
router.get('/:booking_id/vnpay-url', requireRoles(['admin', 'staff']), AdminBookingController.getVNPayUrl);

export default router;