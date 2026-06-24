import { Router } from 'express';
import { FacilityController } from '../../controllers/admin/facility.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { createFacilitySchema, updateFacilitySchema } from '../../validations/facility.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', requireRoles(['admin', 'staff']), FacilityController.getAll);
router.get('/trash', requireRoles(['admin', 'staff']), FacilityController.getTrash); 
router.post('/:id/restore', requireRoles(['admin']), FacilityController.restore);
router.get('/:id', requireRoles(['admin', 'staff']), FacilityController.getById);
router.get('/:id/courts', requireRoles(['admin', 'staff']), FacilityController.getFacilityWithCourts);
router.post('/', requireRoles(['admin']), validate(createFacilitySchema), FacilityController.create);
router.put('/:id', requireRoles(['admin']), validate(updateFacilitySchema), FacilityController.update);
router.delete('/:id', requireRoles(['admin']), FacilityController.delete);

export default router;