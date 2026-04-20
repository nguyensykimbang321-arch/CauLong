import { Router } from "express";

// Import các nhánh Route
import clientAuthRouter from "./client/auth.routes.js";
import adminAuthRouter from "./client/auth.routes.js";


const rootRouter = Router();

// ==========================================
// 1. LUỒNG DÀNH CHO KHÁCH HÀNG (MOBILE APP)
// Endpoint: /api/v1/app/...
// ==========================================
rootRouter.use('/app/auth', clientAuthRouter);
// Sau này có: rootRouter.use('/app/bookings', verifyToken, requireRoles(['customer']), clientBookingRouter);


// ==========================================
// 2. LUỒNG DÀNH CHO QUẢN TRỊ (WEB ADMIN)
// Endpoint: /api/v1/admin/...
// ==========================================
rootRouter.use('/admin/auth', adminAuthRouter);
// Sau này có: rootRouter.use('/admin/facilities', verifyToken, requireRoles(['admin']), adminFacilityRouter);

export default rootRouter;