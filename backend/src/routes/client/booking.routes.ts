import { Router } from 'express';
import { ClientBookingController } from '../../controllers/client/booking.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/my', verifyToken, ClientBookingController.getMyBookings);
router.post('/', verifyToken, ClientBookingController.createBooking);

export default router;
