import { Router } from 'express';

import { ClientAuthController } from '../../controllers/client/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, changePasswordSchema } from '../../validations/auth.validation.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();
router.post('/register', validate(registerSchema), ClientAuthController.register);
router.post('/login', validate(loginSchema), ClientAuthController.login); 
router.post('/forgot-password', validate(forgotPasswordSchema), ClientAuthController.forgotPassword);
router.post('/change-password', verifyToken, validate(changePasswordSchema), ClientAuthController.changePassword);

export default router;