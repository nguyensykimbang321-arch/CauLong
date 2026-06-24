import { Router } from 'express';
import { SystemConfigController } from '../../controllers/admin/systemConfig.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createSystemConfigSchema, updateSystemConfigSchema } from '../../validations/systemConfig.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', requireRoles(['admin', 'staff']), SystemConfigController.getAll);
router.get('/key/:key', requireRoles(['admin', 'staff']), SystemConfigController.getByKey);
router.get('/:id', requireRoles(['admin', 'staff']), SystemConfigController.getById);
router.post('/', requireRoles(['admin']), validate(createSystemConfigSchema), SystemConfigController.create);
router.put('/:id', requireRoles(['admin']), validate(updateSystemConfigSchema), SystemConfigController.update);
router.delete('/:id', requireRoles(['admin']), SystemConfigController.remove);
router.post('/:id/restore', requireRoles(['admin']), SystemConfigController.restore);

export default router;
