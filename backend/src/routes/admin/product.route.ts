import { Router } from 'express';
import { AdminProductController } from '../../controllers/admin/product.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { createProductSchema, updateProductSchema, addVariantsSchema, updateVariantSchema } from '../../validations/product.validation.js';

const router = Router();
router.use(verifyToken);

router.get('/', AdminProductController.getAll);
router.get('/:id', AdminProductController.getById);
router.get('/', requireRoles(['admin']), AdminProductController.getAllForAdmin);
router.post('/', requireRoles(['admin']), validate(createProductSchema), AdminProductController.create);
router.put('/:id', requireRoles(['admin']), validate(updateProductSchema), AdminProductController.update);
router.patch('/:id/toggle-delete', requireRoles(['admin']), AdminProductController.toggleDelete);

router.get('/:id/variants', AdminProductController.getVariants);
router.post('/:id/variants', requireRoles(['admin']), validate(addVariantsSchema), AdminProductController.addVariants);
router.put('/:id/variants/:variantId', requireRoles(['admin']), validate(updateVariantSchema), AdminProductController.updateVariant);
router.patch('/:id/variants/:variantId/toggle-delete', requireRoles(['admin']), AdminProductController.toggleDeleteVariant);

export default router;