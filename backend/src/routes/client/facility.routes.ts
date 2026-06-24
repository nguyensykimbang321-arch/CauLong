import { Router } from 'express';
import { ClientFacilityController } from '../../controllers/client/facility.controller.js';

const router = Router();

router.get('/', ClientFacilityController.getAll);
router.get('/:id', ClientFacilityController.getById);
router.get('/:id/court-types', ClientFacilityController.getCourtTypes);

export default router;
