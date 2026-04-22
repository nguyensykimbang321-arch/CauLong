import { Router } from 'express';

import { ClientAuthController } from '../../controllers/client/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../../validations/auth.validation.js';
import { AdminAuthController } from '../../controllers/admin/auth.controller.js';

const router = Router();
router.post('/register', validate(registerSchema), ClientAuthController.register);
router.post('/login', validate(loginSchema), ClientAuthController.login); 


export default router;