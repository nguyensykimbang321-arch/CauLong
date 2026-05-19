import { Router } from 'express';
import { InventoryController } from '../../controllers/admin/inventory.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
    adjustInventorySchema, 
    transferStockSchema, 
    syncStockSchema, 
    getInventoryLogsSchema 
} from '../../validations/inventory.validation.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.post('/adjust', requireRoles(['admin', 'staff']), validate(adjustInventorySchema), InventoryController.adjust);

router.get('/facility/:facilityId', requireRoles(['admin', 'staff']), InventoryController.getByFacility);

router.post('/transfer', validate(transferStockSchema), InventoryController.transfer);
router.post('/sync', validate(syncStockSchema), InventoryController.sync);
router.get('/movements', validate(getInventoryLogsSchema), InventoryController.getLogs);
router.get('/low-stock', InventoryController.getLowStock);

export default router;