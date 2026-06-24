# W1 PORTING PLAN — CauLong ← QuanLySanCauLong

> **Tạo lúc:** 2026-06-24
> **Mục tiêu:** Audit, so sánh và lập kế hoạch port các chức năng W1 còn thiếu từ QuanLySanCauLong vào CauLong.
> **Trạng thái:** KẾ HOẠCH — CHƯA CODE, CHƯA COPY, CHƯA SỬA FILE

---

## 1. Tóm Tắt Mục Tiêu

| Hạng mục | Chi tiết |
|---|---|
| Repo nguồn | `D:\KTVTKPM\QuanLySanCauLong` (dùng cho môn KTVTKPM) |
| Repo đích | `D:\KTVTKPM\CauLong` (dùng cho môn Phát triển hướng dịch vụ) |
| Phạm vi | W1 — Core Booking (booking, pricing, payment, revenue, auth, facility, court) |
| Không đụng | `customer-app`, W2 (inventory/order/product), W3 (client routes) |

---

## 2. Cấu Trúc 2 Repo

### QuanLySanCauLong

```
backend/src/
  config/         cloudinary.config.ts, database.ts, redis.ts
  constants/
  controllers/admin/   13 file (incl. revenue, holiday, systemConfig, user, order, inventory, product)
  middlewares/         auth, role, validate, errorHandler
  models/              20 file (incl. Holiday, SystemConfig, Payment day du)
  patterns/
    strategies/pricing/   7 file (standard, weekend, vip, student, holiday, context, interface)
    strategies/payment/   3 file (cash, vnpay, interface)
    factories/            pricing-strategy.factory.ts, payment.factory.ts
    facades/              (rong)
  repositories/         17 file (tat ca entity)
  routes/admin/         13 file (incl. revenue, holiday, systemConfig, order, inventory, product, payment)
  scripts/              backfill-cash-payments.ts
  seeders/              init.seeder.ts
  services/             14 file (incl. holiday, revenue, systemConfig, inventory, order, product)
  types/
  utils/
  validations/          11 file (incl. revenue, holiday, systemConfig, inventory, product, user)

web-admin/src/features/
  auth, booking, court, facility, holiday, priceConfig, product, revenue, sale, staff, systemConfig
web-admin/src/routes/index.tsx  -- 11 routes, revenue la trang mac dinh "/"
docs/                   22 file (day du, bao gom 08-revenue-module-plan.md)
```

### CauLong

```
backend/src/
  config/         cloudinary.config.ts, database.ts   (THIEU redis.ts)
  constants/
  controllers/
    admin/        7 file (auth, booking, court, facility, payment, priceconfig, user)
    client/       (co -- khong dung)
  middlewares/    auth, role, validate, errorHandler
  models/         20 file (nhung THIEU Holiday, SystemConfig; CO them CartItem, Notification)
  routes/
    admin/        6 file (auth, booking, court, facility, price_config, user) -- THIEU nhieu
    client/       (co -- khong dung)
  services/       10 file (THIEU holiday, revenue, systemConfig, inventory, order)
  types/
  utils/
  validations/    5 file (auth, booking, court, facility, priceConfig) -- THIEU nhieu

web-admin/src/features/
  auth, booking, court, facility, priceConfig  (THIEU: holiday, systemConfig, revenue, staff, sale, product)
web-admin/src/routes/index.tsx  -- 5 routes, trang "/" la DashboardPage (mock placeholder)
docs/             12 file (bo cu, thieu 08-revenue-module-plan.md)
```

---

## 3. Bang Gap Analysis W1

### NHOM A — Co o QuanLySanCauLong, thieu o CauLong, NEN PORT

| STT | Chuc nang | QuanLySanCauLong co | CauLong co | CauLong dang thieu | Nen port | Uu tien | File nguon | File dich | Rui ro | Ghi chu |
|-----|-----------|---------------------|------------|---------------------|----------|---------|------------|-----------|--------|---------|
| A1 | **Revenue Backend API** | revenue.route.ts, revenue.controller.ts, revenue.service.ts, revenue.repository.ts, revenue.validation.ts — 4 endpoint: /summary /chart /breakdown /transactions | Khong co gi | Toan bo revenue backend | Co | **Cao** | routes/admin/revenue.route.ts, controllers/admin/revenue.controller.ts, services/revenue.service.ts, repositories/revenue.repository.ts | Tao moi tat ca file tren trong CauLong | Revenue service phu thuoc `repositories/` pattern — CauLong chua co | CauLong dung models.* truc tiep, can quyet dinh: port ca repository layer hay viet lai revenue service |
| A2 | **Revenue Frontend** | features/revenue/ day du: RevenuePage, RevenueChartContainer, RevenueSummaryCards, RevenueFilterBar, RevenueBreakdown, RevenueTable, revenue.service.ts | Khong co gi | Toan bo thu muc features/revenue/ | Co | **Cao** | web-admin/src/features/revenue/ (toan bo) | Tao moi web-admin/src/features/revenue/ | RevenuePage dang la trang "/" cua QuanLySanCauLong — can cau hinh lai route | CauLong hien co DashboardPage mock o "/" — can thay bang RevenuePage |
| A3 | **Holiday backend** | holiday.route.ts, holiday.controller.ts, holiday.service.ts, holiday.repository.ts, holiday.validation.ts, Holiday model | Khong co gi | Toan bo Holiday backend | Co | **Cao** | routes/admin/holiday.route.ts, controllers/admin/holiday.controller.ts, services/holiday.service.ts, models/holiday.model.ts | Tao moi cac file tren | Model Holiday can them vao models/index.ts CauLong va tao migration DB neu bang chua ton tai | Holiday anh huong toi PricingService: neu khong co holiday thi tinh gia sai cho ngay le |
| A4 | **Holiday Frontend** | features/holiday/ day du | Khong co gi | Toan bo features/holiday/ | Co | **Cao** | web-admin/src/features/holiday/ | Tao moi | Can them route /holidays vao web-admin/src/routes/index.tsx | — |
| A5 | **SystemConfig backend** | systemConfig.route.ts, systemConfig.controller.ts, systemConfig.service.ts, systemConfig.repository.ts, SystemConfig model | Khong co gi | Toan bo SystemConfig backend | Co | **Cao** | routes/admin/systemConfig.route.ts, models/system_config.model.ts | Tao moi | PricingService doc STUDENT_DISCOUNT_PERCENT va WEEKEND_SURCHARGE_PERCENT tu SystemConfig — neu khong co thi pricing fallback ve 0 | SystemConfig anh huong truc tiep den Strategy pricing |
| A6 | **SystemConfig Frontend** | features/systemConfig/ day du | Khong co gi | Toan bo features/systemConfig/ | Co | **Cao** | web-admin/src/features/systemConfig/ | Tao moi | Can them route /system-configs vao routes | — |
| A7 | **Pattern layer (Strategy + Factory)** | patterns/strategies/pricing/ (7 file: standard, weekend, vip, student, holiday, context, interface), patterns/strategies/payment/ (3 file), patterns/factories/ (2 file) | Khong co gi | Toan bo patterns/ | Co | **Cao** | backend/src/patterns/ (toan bo) | Tao moi backend/src/patterns/ | Strategy/Factory pricing không phụ thuộc Repository layer | **Quyết định:** Port Strategy & Factory cho Pricing, dùng Sequelize models trực tiếp/Redis để lấy dữ liệu config. |
| A8 | **Repository layer** | repositories/ (17 file) | Khong co gi | Toan bo repositories/ | **Không** | **Thấp** | backend/src/repositories/ (tối thiểu) | Chỉ tạo tối thiểu `revenue.repository.ts` nếu cần | Tránh ảnh hưởng diện rộng đến các service cũ của team | **Quyết định:** Không port toàn bộ Repository layer. Các service cũ (booking, court, facility) giữ nguyên models.* trực tiếp. |
| A9 | **Payment sync: VNPay IPN cap nhat payment_method** | booking.service.ts L225: payment_method: 'vnpay' duoc set khi VNPay thanh cong | payment.service.ts: KHONG set payment_method | VNPay IPN khong cap nhat booking.payment_method | Co | **Cao** | services/payment.service.ts L220-226 | backend/src/services/payment.service.ts (CauLong) | Booking model CauLong CHUA CO cot payment_method — phai them model truoc | **BUG NGHIEM TRONG**: booking.payment_method = null sau khi VNPay thanh cong |
| A10 | **Booking model: cot payment_method** | booking.model.ts: co payment_method: 'cash' or 'vnpay' voi default 'cash' | booking.model.ts: KHONG co cot payment_method | Thieu field payment_method trong model va DB | Co | **Cao** | models/booking.model.ts | backend/src/models/booking.model.ts | Can migration DB de them cot | **Database breaking change**: can them cot vao bang bookings truoc khi deploy |
| A11 | **Payment sync: cash tao payment record** | booking.service.ts L350-372: khi cap nhat payment_status='paid' voi payment_method='cash', tu dong tao Payment record provider='cash' | booking.service.ts: KHONG co logic nay | Thanh toan tien mat khong tao payment record — Revenue API khong dem duoc | Co | **Cao** | services/booking.service.ts L350-372 | backend/src/services/booking.service.ts | Phu thuoc A10 (can cot payment_method truoc) | Anh huong truc tiep den du lieu revenue |
| A12 | **Backfill script cash payments** | scripts/backfill-cash-payments.ts | Khong co | Script de fill du lieu cu | Co | **Trung binh** | backend/src/scripts/backfill-cash-payments.ts | Tao moi backend/src/scripts/ | Chi chay 1 lan — nhung can co cot payment_method truoc | Dung sau khi da them cot va deploy A10, A11 |
| A13 | **BookingSchedule: getDailyBooked API** | booking.route.ts: co GET /daily-booked-slots voi validation getDailyBookedSchema | booking.route.ts: KHONG co route nay | Thieu endpoint /admin/bookings/daily-booked-slots | Co | **Cao** | routes/admin/booking.route.ts L13, controllers/admin/booking.controller.ts getDailyBooked | backend/src/routes/admin/booking.route.ts, controllers/admin/booking.controller.ts | getDailyBookedSlots trong CauLong booking.service co, nhung route chua expose | QuanLySanCauLong da import getDailyBookedSchema trong route |
| A14 | **Auth: refresh-token & logout** | auth.routes.ts: co /refresh-token va /logout; auth.controller.ts: co refreshToken() va logout() dung cookie HttpOnly | auth.routes.ts: CHI co /login; auth.controller.ts: CHI co login() | Thieu refresh token rotation va logout | Co | **Cao** | routes/admin/auth.routes.ts, controllers/admin/auth.controller.ts, services/auth.service.ts | Cac file tuong ung trong CauLong | auth.service.ts CauLong can kiem tra co du refreshAccessToken() va logout() chua | Lien quan bao mat — nen port toan bo auth controller |
| A15 | **User model: membership_type** | user.model.ts: co membership_type: 'standard' / 'student' / 'vip' | user.model.ts: CO loyalty_points nhung KHONG co membership_type | Thieu membership_type — PricingService khong the ap dung Student/VIP discount | Co | **Cao** | models/user.model.ts | backend/src/models/user.model.ts | Can ALTER TABLE users them cot membership_type | Anh huong PricingStrategy va createBookingByHotline |
| A16 | **Booking hotline: membership_type field** | booking.validation.ts createBookingByHotlineSchema: co membership_type field | booking.validation.ts: KHONG co membership_type trong hotline schema | Staff khong the chi dinh loai thanh vien khi dat hotline | Co | **Trung binh** | validations/booking.validation.ts L57 | backend/src/validations/booking.validation.ts | Phu thuoc A15 | Can update ca controller logic |
| A17 | **PricingService: Strategy Pattern + Holiday/VIP/Student/Weekend** | pricing.service.ts: Dung PricingStrategyFactory, tich hop holiday check, membership, weekend surcharge tu SystemConfig | pricing.service.ts: Dung calculateFromConfigs() don gian, KHONG co Strategy Pattern, KHONG check holiday, KHONG check membership | Thieu toan bo logic pricing thong minh | Co | **Cao** | services/pricing.service.ts, patterns/ (toan bo) | backend/src/services/pricing.service.ts | PricingService phối hợp các strategy không qua repository | **Luồng hoạt động:** Lấy price_config từ Redis/DB -> Lấy holiday/system_config nếu cần -> Gọi PricingStrategyFactory -> Áp dụng strategies. |
| A18 | **Seeders** | seeders/init.seeder.ts (seed holiday, systemConfig, admin/staff accounts) | Khong co | Init seeder | Co | **Trung binh** | backend/src/seeders/init.seeder.ts | Tao moi backend/src/seeders/ | Chi chay 1 lan — dam bao idempotent | Can seed holiday va systemConfig de pricing hoat dong |
| A19 | **Docs W1 bo sung** | docs/08-revenue-module-plan.md, docs/03-backend-api.md (day du hon) | Thieu 08-revenue-module-plan.md, docs cu | Tai lieu revenue, database schema moi | Co | **Thap** | docs/08-revenue-module-plan.md | docs/ trong CauLong | Khong anh huong code | Chi can copy |

---

### NHOM B — Co o ca 2 repo nhung QuanLySanCauLong moi/tot hon

| STT | Chuc nang | QuanLySanCauLong | CauLong | Delta | Nen port | Uu tien | File nguon | File dich | Rui ro | Ghi chu |
|-----|-----------|------------------|---------|-------|----------|---------|------------|-----------|--------|---------|
| B1 | **Bug: Facility route RBAC** | facility.route.ts: Staff chi co quyen GET; POST/PUT/DELETE/restore yeu cau requireRoles(['admin']) rieng | facility.route.ts: Dung router.use(verifyToken, requireRoles(['admin', 'staff'])) o muc router — staff co toan quyen tao/sua/xoa co so | **Bug bao mat**: Staff CauLong co quyen tao/xoa facility | Co | **Cao** | routes/admin/facility.route.ts | backend/src/routes/admin/facility.route.ts | Thay doi security behavior — khong pha chuc nang nhung can test lai staff workflow | Port truc tiep logic per-route cua QuanLySanCauLong |
| B2 | **Bug: CourtService deleteCourt dung sai method** | court.service.ts: deleteCourt goi getCourtByIdByAdmin (all courts) | court.service.ts: deleteCourt goi getCourtById (chi active courts) | CauLong chi co the xoa san dang active, khong xoa duoc san da inactive | Can nhac | **Thap** | services/court.service.ts | backend/src/services/court.service.ts | Thay doi hanh vi delete | Kiem tra ky deleteCourt() |
| B3 | **Bug: WeekendPricingStrategy dung surchargePercent** | weekend-pricing.strategy.ts: dung surchargePercent de tang gia (1 + surcharge/100) — DUNG | (Khong co strategy nay) | N/A — CauLong khong co strategy | Chi can port A7 | — | patterns/strategies/pricing/weekend-pricing.strategy.ts | Tao moi (nam trong A7) | — | Bug nay chi relevant khi port A7 |
| B4 | **Auth service: refresh token + logout** | auth.service.ts: day du login(), refreshAccessToken(), logout(), dung cookie HttpOnly | auth.service.ts CauLong: can kiem tra — co the da co nhung controller chua expose | Can kiem tra lai auth.service.ts CauLong | Xem A14 | **Cao** | services/auth.service.ts | backend/src/services/auth.service.ts | — | AuthService CauLong can review day du |
| B5 | **BookingPage.tsx** | BookingPage.tsx (4941 bytes) | BookingPage.tsx (4904 bytes) — nho hon 37 bytes | Co su khac biet nho | Can nhac | **Thap** | web-admin/src/features/booking/components/BookingPage.tsx | Tuong ung CauLong | Can diff ky | Se lam sau |
| B6 | **CreateBookingModal.tsx** | 7346 bytes | 6648 bytes — nho hon 698 bytes | QuanLySanCauLong co them tinh nang (co the la membership_type selection) | Co | **Trung binh** | web-admin/src/features/booking/components/CreateBookingModal.tsx | Tuong ung CauLong | Can diff ky | Phu thuoc A15, A16 |
| B7 | **BookingSchedulePage.tsx** | 7147 bytes | 7112 bytes — nho hon 35 bytes | Khac biet nho | Can nhac | **Thap** | web-admin/src/features/booking/components/BookingSchedulePage.tsx | Tuong ung CauLong | Can diff ky | — |
| B8 | **UserService: membership + points + createStaff** | user.service.ts 182 lines: addPointsAndUpgrade(), createStaff(), createGuestUser(membershipType) | user.service.ts 27 lines: CHI co getUserByPhone(), createGuestUser() (khong co membership) | CauLong thieu nhieu logic user quan trong | Co | **Cao** | services/user.service.ts | backend/src/services/user.service.ts | createGuestUser CauLong khong co membership_type param — pha booking hotline neu controller truyen | Port toan bo UserService hoac merge vao |
| B9 | **Routes index backend: them admin routes** | routes/index.ts: 13 routes admin (incl. payment, systemConfig, holiday, product, inventory, order, revenue) | routes/index.ts: 6 routes admin (thieu 7 routes) | Thieu: /admin/payments, /admin/system-configs, /admin/holidays, /admin/products, /admin/inventory, /admin/orders, /admin/revenue | Co (chi port W1 routes) | **Cao** | routes/index.ts | backend/src/routes/index.ts | Chi them cac routes W1, khong port W2/W3 routes | **W1 routes can them:** payment, systemConfig, holiday, revenue |
| B10 | **Web-admin routes index** | routes/index.tsx: 11 routes, trang "/" = RevenuePage | routes/index.tsx: 5 routes, trang "/" = DashboardPage (mock) | Thieu: /holidays, /system-configs; revenue chua la trang default | Co (chi W1) | **Cao** | web-admin/src/routes/index.tsx | web-admin/src/routes/index.tsx | Them routes cho holiday, systemConfig, revenue — khong port sale (W2) | staff route trong CauLong hien la mock |

---

### NHOM C — Co o QuanLySanCauLong nhung KHONG NEN PORT

| STT | Chuc nang | Ly do khong port | Rui ro neu port |
|-----|-----------|-----------------|----------------|
| C1 | redis.ts config | Được phép dùng nếu phục vụ cache có mục đích rõ ràng | Tránh dùng Redis cho mọi thứ một cách mặc định | **Quyết định:** Cho phép dùng Redis để cache price_config, system_config, holiday. |
| C2 | Order/Inventory backend (W2) | Thuoc W2 — CauLong co rieng tu dong doi | Conflict voi code W2 hien co |
| C3 | Product backend (W2) | Thuoc W2 — CauLong co rieng | Conflict |
| C4 | features/sale/ (POS, OrderPage) | W2 — co the xung dot voi implementation CauLong | Conflict |
| C5 | features/product/ (ProductTable) | W2 — CauLong co phien ban rieng (mock) | — |
| C6 | patterns/facades/ | Thu muc rong trong QuanLySanCauLong | Khong co gi de port |
| C7 | features/staff/ (StaffPage) | CauLong co mock — chua ro team dang lam gi o day | Co the conflict voi work in progress |
| C8 | Client routes (W3) | routes/client/ thuoc mobile app — CauLong dang phat trien | Khong dung |
| C9 | models/cart_item.model.ts (CauLong) | CauLong CO THEM CartItem, Notification — QuanLySanCauLong khong co | Khong port nguoc lai |

---

### NHOM D — CauLong co rieng, KHONG duoc dung

| STT | Thanh phan | Ghi chu |
|-----|-----------|---------|
| D1 | customer-app/ toan bo | Mobile app — khong anh huong W1 |
| D2 | routes/client/ backend | API cho mobile app |
| D3 | controllers/client/ | Controller cho mobile |
| D4 | models/notification.model.ts | CauLong co rieng — QuanLySanCauLong khong co |
| D5 | models/cart_item.model.ts | CauLong co rieng |
| D6 | services/booking.service.ts logic client | Logic client booking trong CauLong (facilityId filter, etc.) |
| D7 | services/order.service.ts (CauLong version) | Khac hoan toan voi QuanLySanCauLong |
| D8 | Database connections rieng cua team | Khong merge .env |

---

## 4. Danh Sach Chuc Nang CauLong Dang Thieu (Uu tien cao)

1. **booking.model.ts**: Thieu cot `payment_method` (cash/vnpay) — chua co trong DB
2. **user.model.ts**: Thieu cot `membership_type` (standard/student/vip) — chua co trong DB
3. **Revenue backend**: Toan bo 4 API endpoints + service + repository + validation
4. **Revenue frontend**: Toan bo thu muc `features/revenue/`
5. **Holiday backend + frontend**: CRUD holidays — anh huong gia booking
6. **SystemConfig backend + frontend**: CRUD config — chua `STUDENT_DISCOUNT_PERCENT`, `WEEKEND_SURCHARGE_PERCENT`
7. **Strategy Pattern pricing**: Standard, Weekend, VIP, Student, Holiday strategies + Factory
8. **Auth: refresh-token, logout** endpoints
9. **Payment sync**: VNPay IPN khong update `payment_method`; cash khong tao Payment record
10. **Booking `/daily-booked-slots`** endpoint chua expose qua route
11. **Facility route RBAC bug**: staff co quyen tao/xoa facility (security bug)
12. **UserService**: thieu `addPointsAndUpgrade()`, `createStaff()`, membership trong `createGuestUser()`
13. **Admin routes index**: thieu 4 W1 routes (payment, systemConfig, holiday, revenue)
14. **Web-admin routes index**: thieu /holidays, /system-configs, revenue route, trang default

---

## 5. Danh Sach Chuc Nang Khong Nen Port

- Toan bo nhom C (xem Bang Gap Analysis Nhom C - ngoại trừ Redis được dùng có điều kiện cho caching)
- Không port toàn bộ Repository layer (A8) — Chỉ tạo repository tối thiểu cho các feature mới nếu thật sự cần (ví dụ: `revenue.repository.ts` cho Revenue query phức tạp). Các service cũ giữ nguyên Service layer hiện tại của CauLong.
- customer-app va client routes (Nhom D)

---

## 6. Danh Sach File Can So Sanh Ky Them (Chua Diff Toan Phan)

| File | Ly do can diff ky |
|------|------------------|
| web-admin/src/features/booking/components/BookingPage.tsx | Khac 37 bytes |
| web-admin/src/features/booking/components/CreateBookingModal.tsx | Khac 698 bytes — co the co membership_type |
| web-admin/src/features/booking/components/BookingSchedulePage.tsx | Khac 35 bytes |
| backend/src/services/auth.service.ts (CauLong) | Chua doc day du |
| backend/src/services/booking.service.ts (CauLong) | Rat lon, co nhieu logic rieng |
| backend/src/models/payment.model.ts | Can kiem tra field booking_id vs order_id |
| backend/src/config/database.ts | CauLong co them gi khong |

---

## 7. Ke Hoach Port Theo Task Nho

  T-W1-PORT-10 -> Holiday + SystemConfig frontend
  T-W1-PORT-11 -> Revenue frontend
  T-W1-PORT-12 -> Booking UI fixes

Giai doan 7 — Du lieu & Docs
  T-W1-PORT-13 -> Seeder + Backfill
  T-W1-PORT-14 -> Docs

Giai doan 8 — Kiem thu
  T-W1-PORT-15 -> Test build + regression
```

---

## 9. Checklist Test Backend

### Booking
- [ ] POST /api/v1/admin/bookings/hotline — tao booking moi voi customer phone
- [ ] GET /api/v1/admin/bookings/daily-booked-slots?facility_id=1&date=2026-06-24&court_type=standard
- [ ] PUT /api/v1/admin/bookings/:id/status {payment_status: "paid"} -> tao Payment record cash
- [ ] GET /api/v1/admin/bookings/:id/vnpay-url -> tra ve URL VNPay

### Auth
- [ ] POST /api/v1/admin/auth/login -> tra ve accessToken + set cookie refreshToken
- [ ] POST /api/v1/admin/auth/refresh-token -> tra ve accessToken moi
- [ ] POST /api/v1/admin/auth/logout -> xoa cookie

### Facility RBAC
- [ ] Staff token: GET /api/v1/admin/facilities -> 200
- [ ] Staff token: POST /api/v1/admin/facilities -> 403
- [ ] Admin token: POST /api/v1/admin/facilities -> 201

### Holiday
- [ ] GET /api/v1/admin/holidays -> 200
- [ ] POST /api/v1/admin/holidays -> 201
- [ ] DELETE /api/v1/admin/holidays/:id -> 200

### SystemConfig
- [ ] GET /api/v1/admin/system-configs -> 200
- [ ] PUT /api/v1/admin/system-configs/WEEKEND_SURCHARGE_PERCENT -> 200

### Revenue
- [ ] GET /api/v1/admin/revenue/summary?from=2026-01-01&to=2026-06-24 -> 200
- [ ] GET /api/v1/admin/revenue/chart?group_by=day -> 200
- [ ] GET /api/v1/admin/revenue/breakdown -> 200
- [ ] GET /api/v1/admin/revenue/transactions?page=1&limit=10 -> 200

### Payment VNPay IPN
- [ ] VNPay IPN voi vnp_ResponseCode=00 -> booking.payment_method = 'vnpay'

### Pricing Strategy
- [ ] Dat san ngay thuong -> gia standard
- [ ] Dat san ngay cuoi tuan -> gia tang theo surcharge
- [ ] Dat san ngay le -> gia tang theo holiday surcharge
- [ ] User membership='student' -> gia giam

---

## 10. Checklist Test Web-Admin

- [ ] Trang "/" -> RevenuePage load duoc (khong phai mock)
- [ ] /booking/schedule -> grid hien thi daily-booked slots
- [ ] /booking/list -> danh sach booking
- [ ] /facility/branches -> CRUD facility (admin duoc, staff chi xem)
- [ ] /pricing -> cau hinh bang gia
- [ ] /holidays -> CRUD holiday (trang moi)
- [ ] /system-configs -> CRUD system config (trang moi)
- [ ] Revenue page: filter theo date, theo facility
- [ ] Revenue page: chart hien thi dung du lieu

---

## 11. Rui Ro Khi Port

| Rui ro | Muc do | Cach giam thieu |
|--------|--------|----------------|
| Database breaking change (payment_method, membership_type) | **Cao** | Backup DB, chay ALTER TABLE can than |
| PricingService thay doi hoan toan -> gia tinh sai | **Cao** | Test pricing ky truoc va sau |
| Revenue service phu thuoc nhieu bang -> query fail | **Trung binh** | Test tung API, check join conditions |
| Port repository layer anh huong services CauLong | **Cao** | CHI tao repository moi, khong sua services cu |
| createGuestUser thay doi signature | **Trung binh** | Kiem tra tat ca noi goi ham truoc khi port |
| Holiday/SystemConfig model chua duoc sync vao DB | **Trung binh** | Chay migration SQL tuong minh |
| Port features/revenue nhung API chua co -> 500 error | **Thap** | Port backend truoc (T8) roi moi port frontend (T11) |
| Auth refresh token khong tuong thich voi frontend CauLong | **Trung binh** | Kiem tra frontend auth flow truoc khi port backend |

---

## 12. Cau Hoi Can Xac Nhan Truoc Khi Code

**Q1.** CauLong dang dung `sync({alter: true})` hay migration file de quan ly DB schema? Neu dung `sync`, viec them model Holiday, SystemConfig, va cot payment_method se tu dong tao/sua bang khi restart. Neu dung migration thu cong, can chuan bi SQL rieng.

**Q2.** Repo dich (CauLong) hien dang chia branch nhu the nao? Nen tao branch moi `feat/w1-port` truoc khi lam hay commit thang vao branch hien tai?

**Q3.** Khi port `pricing.service.ts` dung Strategy Pattern (T6), logic tinh gia se thay doi. Co booking cu nao can giu nguyen gia khong? Hay cho phep ap gia moi?

**Q4.** CauLong co bang `holidays` va `system_configs` trong DB chua? Neu chua, can chay CREATE TABLE — moi truong dev co the se khac voi staging.

**Q5.** `auth.service.ts` cua CauLong hien co `refreshAccessToken()` va `logout()` khong? (Neu da co thi T9 chi can port routes/controller).

**Q6.** [ĐÃ QUYẾT ĐỊNH] Không port toàn bộ Repository layer. Chỉ tạo tối thiểu `revenue.repository.ts` riêng nếu query doanh thu quá phức tạp. Các service cũ của booking/court/facility giữ nguyên cách dùng models.* hiện tại.

**Q7.** `features/staff/` trong CauLong hiện là mock div. Team đang phát triển ở đó không? Có thể thêm `StaffPage` component từ QuanLySanCauLong không?

**Q8.** `features/revenue/` trong QuanLySanCauLong dùng thư viện chart nào? (Cần kiểm tra package.json CauLong web-admin để xác nhận đã có thư viện đó chưa.)

**Q9.** Backfill script (T13) cần chạy trên DB nào? Dev local hay có DB shared của team?

**Q10.** [ĐÃ QUYẾT ĐỊNH] Redis được phép dùng phục vụ cache cho price_config, system_config, holiday. Không dùng Redis cho mọi thứ một cách mặc định.

---

## Xac Nhan

- Đã đọc cả 2 repo (backend và web-admin)
- Chưa sửa code
- Chưa copy file
- Chưa commit
- Chưa cài package
- Chưa chạy migration
