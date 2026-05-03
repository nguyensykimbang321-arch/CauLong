import { Router } from "express";
import clientAuthRouter from "./client/auth.routes.js";
import clientFacilityRouter from "./client/facility.routes.js";
import clientProductRouter from "./client/product.routes.js";
import clientBookingRouter from "./client/booking.routes.js";
import clientOrderRouter from "./client/order.routes.js";
import adminAuthRouter from "./admin/auth.routes.js";
import adminFacilityRouter from "./admin/facility.route.js";
import adminCourtRouter from "./admin/court.route.js";


const rootRouter = Router();

// ==========================================
// 1. LUỒNG DÀNH CHO KHÁCH HÀNG (MOBILE APP)
// Endpoint: /api/v1/app/...
// ==========================================
rootRouter.use('/app/auth', clientAuthRouter);
rootRouter.use('/app/facilities', clientFacilityRouter);
rootRouter.use('/app/products', clientProductRouter);
rootRouter.use('/app/bookings', clientBookingRouter);
rootRouter.use('/app/orders', clientOrderRouter);
// Sau này có: rootRouter.use('/app/bookings', verifyToken, requireRoles(['customer']), clientBookingRouter);


// ==========================================
// 2. LUỒNG DÀNH CHO QUẢN TRỊ (WEB ADMIN)
// Endpoint: /api/v1/admin/...
// ==========================================
rootRouter.use('/admin/auth', adminAuthRouter);
rootRouter.use('/admin/facilities', adminFacilityRouter);
rootRouter.use('/admin/courts', adminCourtRouter);

export default rootRouter;