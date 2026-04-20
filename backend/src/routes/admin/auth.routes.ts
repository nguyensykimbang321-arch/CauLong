import { Router } from 'express';
import { AdminAuthController } from '../../controllers/admin/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema } from '../../validations/auth.validation.js';

const adminAuthRouter = Router();

adminAuthRouter.post('/login', validate(loginSchema), AdminAuthController.login);

export default adminAuthRouter;