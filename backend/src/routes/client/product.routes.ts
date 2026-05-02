import { Router } from 'express';
import { ClientProductController } from '../../controllers/client/product.controller.js';

const router = Router();

router.get('/', ClientProductController.getAll);

export default router;
