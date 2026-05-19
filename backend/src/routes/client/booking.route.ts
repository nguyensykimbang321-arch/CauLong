import { Router } from 'express';
import { ClientBookingController } from '../../controllers/client/booking.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { checkAvailabilitySchema, createBookingSchema, getDailyBookedSchema, previewPriceSchema } from '../../validations/booking.validation.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';

const router = Router();

router.get('/my', verifyToken, ClientBookingController.getMyBookings);
router.get('/availability', validate(checkAvailabilitySchema), ClientBookingController.checkAvailability);
router.get('/daily-booked-slots', validate(getDailyBookedSchema), ClientBookingController.getDailyBooked);
router.post('/preview-price', validate(previewPriceSchema), ClientBookingController.previewPrice);

router.post(
    '/', 
    verifyToken, 
    requireRoles(['customer']), 
    validate(createBookingSchema), 
    ClientBookingController.createBooking
);

export default router;