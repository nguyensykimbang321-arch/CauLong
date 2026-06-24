import { Router } from 'express';
import { AdminAuthController } from '../../controllers/admin/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema } from '../../validations/auth.validation.js';

const router = Router();

router.post('/login', validate(loginSchema), AdminAuthController.login);
router.post('/refresh-token', AdminAuthController.refreshToken);
router.post('/logout', AdminAuthController.logout);

export default router;