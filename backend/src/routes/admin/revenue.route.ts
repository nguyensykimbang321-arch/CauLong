import { Router } from 'express';
import { RevenueController } from '../../controllers/admin/revenue.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getRevenueCommonSchema,
  getRevenueChartSchema,
  getRevenueTransactionsSchema
} from '../../validations/revenue.validation.js';

const router = Router();

router.use(verifyToken);
router.use(requireRoles(['admin']));

router.get('/summary', validate(getRevenueCommonSchema), RevenueController.getSummary);
router.get('/chart', validate(getRevenueChartSchema), RevenueController.getChart);
router.get('/breakdown', validate(getRevenueCommonSchema), RevenueController.getBreakdown);
router.get('/transactions', validate(getRevenueTransactionsSchema), RevenueController.getTransactions);

export default router;
