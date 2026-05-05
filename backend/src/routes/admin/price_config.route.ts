import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { AdminPriceConfigController } from '../../controllers/admin/priceconfig.controller.js';
import { createPriceConfigSchema, updatePriceConfigSchema } from '../../validations/priceConfig.validation.js';

const router = Router();

router.use(verifyToken, requireRoles(['admin']));

router.get('/', AdminPriceConfigController.getAll);
router.post('/', validate(createPriceConfigSchema), AdminPriceConfigController.create);
router.put('/:id', validate(updatePriceConfigSchema), AdminPriceConfigController.update);
router.delete('/:id', AdminPriceConfigController.delete);

export default router;