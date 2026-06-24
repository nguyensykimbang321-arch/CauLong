import { Router } from "express";

// --- CLIENT IMPORTS ---
import clientAuthRouter from "./client/auth.routes.js";
import clientFacilityRouter from "./client/facility.routes.js";
import clientProductRouter from "./client/product.routes.js";
import clientOrderRouter from "./client/order.routes.js";    
import clientBookingRouter from './client/booking.route.js'; 

// --- ADMIN IMPORTS ---
import adminAuthRouter from "./admin/auth.routes.js";
import adminFacilityRouter from "./admin/facility.route.js";
import adminCourtRouter from "./admin/court.route.js";
import adminBookingRouter from './admin/booking.route.js';
import adminProductRouter from './admin/product.route.js';
import adminInventoryRouter from './admin/inventory.route.js';
import priceConfigRouter from './admin/price_config.route.js';
import clientPaymentRouter from './client/payment.route.js';
import adminUserRouter from './admin/user.route.js';
import adminOrderRouter from './admin/order.routes.js';
import uploadRouter from './upload.routes.js';
import adminHolidayRouter from './admin/holiday.route.js';
import adminSystemConfigRouter from './admin/systemConfig.route.js';


const rootRouter = Router();

// ==========================================
// 1. LUỒNG DÀNH CHO KHÁCH HÀNG (MOBILE APP)
// Endpoint: /api/v1/app/...
// ==========================================
rootRouter.use('/app/auth', clientAuthRouter);
rootRouter.use('/app/payments', clientPaymentRouter);


rootRouter.use('/app/bookings', clientBookingRouter);

// Tích hợp thêm các route mới của đồng đội
rootRouter.use('/app/facilities', clientFacilityRouter);
rootRouter.use('/app/products', clientProductRouter);
rootRouter.use('/app/orders', clientOrderRouter);


// ==========================================
// 2. LUỒNG DÀNH CHO QUẢN TRỊ (WEB ADMIN)
// Endpoint: /api/v1/admin/...
// ==========================================
rootRouter.use('/admin/auth', adminAuthRouter);
rootRouter.use('/admin/facilities', adminFacilityRouter);
rootRouter.use('/admin/courts', adminCourtRouter);
rootRouter.use('/admin/bookings', adminBookingRouter);
rootRouter.use('/admin/price-configs', priceConfigRouter);
rootRouter.use('/admin/users', adminUserRouter);
rootRouter.use('/admin/products', adminProductRouter);
rootRouter.use('/admin/inventory', adminInventoryRouter);
rootRouter.use('/admin/orders', adminOrderRouter);
rootRouter.use('/admin/holidays', adminHolidayRouter);
rootRouter.use('/admin/system-configs', adminSystemConfigRouter);
rootRouter.use('/upload', uploadRouter);

export default rootRouter;