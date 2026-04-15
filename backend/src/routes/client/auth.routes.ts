import { Router } from 'express';

import { ClientAuthController } from '../../controllers/client/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../../validations/auth.validation.js';

const clientAuthRouter = Router();

clientAuthRouter.post('/register', validate(registerSchema), ClientAuthController.register);
clientAuthRouter.post('/login', validate(loginSchema), ClientAuthController.login); 

export default clientAuthRouter;