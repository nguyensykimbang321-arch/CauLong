import { Router } from 'express';
import { FacilityController } from '../../controllers/admin/facility.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { createFacilitySchema, updateFacilitySchema } from '../../validations/facility.validation.js';

const router = Router();

router.use(verifyToken, requireRoles(['admin']));

router.get('/', FacilityController.getAll);
router.get('/:id', FacilityController.getById);
router.post('/', validate(createFacilitySchema), FacilityController.create);
router.put('/:id', validate(updateFacilitySchema), FacilityController.update);
router.delete('/:id', FacilityController.delete);

export default router;