import { Router } from 'express';
import { AdminUserController } from '../../controllers/admin/user.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { createStaffSchema, toggleUserStatusSchema } from '../../validations/user.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', requireRoles(['admin']), AdminUserController.getAll);

router.patch('/:id/status-lock', requireRoles(['admin']), validate(toggleUserStatusSchema), AdminUserController.toggleUserStatus);

router.post('/staff', requireRoles(['admin']), validate(createStaffSchema), AdminUserController.createStaff);

export default router;