import { Router } from 'express';
import { HolidayController } from '../../controllers/admin/holiday.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createHolidaySchema, updateHolidaySchema } from '../../validations/holiday.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', requireRoles(['admin', 'staff']), HolidayController.getAllHolidays);
router.get('/:id', requireRoles(['admin', 'staff']), HolidayController.getHolidayById);
router.post('/', requireRoles(['admin']), validate(createHolidaySchema), HolidayController.createHoliday);
router.put('/:id', requireRoles(['admin']), validate(updateHolidaySchema), HolidayController.updateHoliday);
router.delete('/:id', requireRoles(['admin']), HolidayController.deleteHoliday);
router.post('/:id/restore', requireRoles(['admin']), HolidayController.restoreHoliday);

export default router;
