import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { CourtController } from "../../controllers/admin/court.controller.js";
import { createCourtSchema, updateCourtSchema } from "../../validations/court.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.use(verifyToken, requireRoles(['admin']));

router.get('/', CourtController.getAll);
router.get('/:id', CourtController.getById);
router.post('/', validate(createCourtSchema), CourtController.create);
router.put('/:id', validate(updateCourtSchema), CourtController.update);
router.delete('/:id', CourtController.delete);

export default router;