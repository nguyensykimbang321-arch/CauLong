# NỘI DUNG SLIDE — BÀI THUYẾT TRÌNH
## Hệ thống Quản lý & Đặt sân Cầu lông (Badminton Court Management System)

> **Môn học:** Phát triển phần mềm hướng dịch vụ (SOA)  
> **Nhóm:** Nhóm 21  
> **Ghi chú:** Copy từng block `--- SLIDE X ---` sang PowerPoint/Google Slides. Nội dung dưới đây được rà soát theo **code thực tế** trong repo (`backend/`, `web-admin/`, `customer-app/`).

---

## --- SLIDE 1: MỞ ĐẦU ---

### Tiêu đề đề tài
**HỆ THỐNG QUẢN LÝ & ĐẶT SÂN CẦU LÔNG**  
*Badminton Court Management System — Web Admin + Mobile App + Backend API tập trung*

### Thông tin môn học
- **Môn học:** Phát triển phần mềm hướng dịch vụ (SOA)
- **Giảng viên hướng dẫn:** [Điền tên GV]

### Danh sách thành viên & phân công

| STT | Họ tên | MSSV | Vai trò / Phân hệ phụ trách | Tỷ lệ đóng góp |
|-----|--------|------|-----------------------------|----------------|
| 1 | Trương Anh Tùng | N22DCCN195 | Web Admin: quản lý sân, sa bàn lịch đặt; Backend: Facility, Booking, Price Config | 25% |
| 2 | Nguyễn Đức Chính | N22DCCN110 | Web Admin: POS bán hàng, kho, báo cáo doanh thu; Backend: Product, Inventory, Order, Revenue | 25% |
| 3 | Nguyễn Sỹ Kim Bằng | N22DCCN106 | Mobile App: đặt sân, tài khoản; Backend: Auth, User, API client | 25% |
| 4 | Nguyễn Hữu Ngọc Hoàng | N22DCCN129 | Mobile App: cửa hàng, thanh toán; Backend: Payment (VNPay), Order client | 25% |

**Tổng quan phân chia:** 2 thành viên tập trung **Web + vận hành nội bộ**, 2 thành viên tập trung **Mobile + trải nghiệm khách hàng & thanh toán**.

---

## --- SLIDE 2: BỐI CẢNH & BÀI TOÁN ---

### Bối cảnh thực tế
- Phong trào cầu lông phát triển mạnh → nhiều cụm sân, nhà thi đấu mở ra.
- Đa số cơ sở vẫn quản lý bằng **sổ sách, Excel, Zalo/Facebook** → thiếu đồng bộ, khó mở rộng.

### Bài toán cần giải quyết (Business Requirements)

| Vấn đề hiện tại | Hệ thống giải quyết |
|-----------------|---------------------|
| Trùng lịch khi nhiều kênh đặt | Lịch sân tập trung, kiểm tra chồng chéo `booking_slots` trong transaction |
| Khách phải gọi điện / nhắn tin đặt sân | Đặt sân online qua Mobile App, timeline trống theo ngày (ô 30 phút) |
| Nhân viên khó nắm tổng quan lịch | Web Admin: sa bàn lịch, duyệt/hủy booking, đặt qua hotline |
| Bán phụ kiện rời rạc | Shop trên app + POS tại quầy trên web |
| Thanh toán & đối soát thủ công | VNPay (WebView/QR), tự hủy giao dịch quá hạn |
| Thiếu báo cáo doanh thu | Báo cáo doanh thu đặt sân + bán lẻ theo ngày/tháng |

### Đối tượng sử dụng
- **Khách hàng (Customer):** Đặt sân, mua hàng, thanh toán, xem lịch cá nhân.
- **Nhân viên / Lễ tân (Staff):** POS, xử lý đơn, xem lịch sân.
- **Quản trị viên (Admin):** Cấu hình giá, sân, nhân sự, báo cáo.

---

## --- SLIDE 3: KIẾN TRÚC HƯỚNG DỊCH VỤ (SOA) — CÁCH HIỂU TRONG ĐỒ ÁN ---

### Đồ án **không** triển khai microservices

Hệ thống là **một backend Node.js duy nhất** (monolithic API), chạy trong **một process**, dùng **một database MySQL**.  
Không có API Gateway riêng, không có message broker, không tách container theo từng nghiệp vụ.

### Vậy SOA thể hiện ở đâu?

SOA trong đồ án được hiểu theo **tầng thiết kế phần mềm**, không phải triển khai nhiều server:

1. **Tách miền nghiệp vụ** trong `backend/src/services/` — mỗi file service đảm nhiệm một domain (Booking, Payment, Order…).
2. **Hai client độc lập** (Web Admin + Mobile App) chỉ giao tiếp qua **REST API contract** chung `/api/v1`.
3. **Hai namespace API** tách luồng người dùng:
   - `/api/v1/app/*` — khách hàng (mobile)
   - `/api/v1/admin/*` — quản trị / nhân viên (web)
4. **Luồng xử lý thống nhất:** `Route → Controller → Service → Model (Sequelize) → MySQL`.

### Các miền nghiệp vụ trong backend (lớp service, không phải microservice)

| Miền nghiệp vụ | File service chính | Mô tả ngắn |
|----------------|-------------------|------------|
| Auth & User | `auth.service.ts`, `user.service.ts` | JWT, đăng ký/đăng nhập, phân quyền |
| Facility & Court | `facility.service.ts`, `court.service.ts` | Cơ sở, loại sân, sân cụ thể |
| Booking | `booking.service.ts` | Lịch trống, đặt/hủy sân, chống trùng slot |
| Pricing | `pricing.service.ts` + Strategy Pattern | Tính giá theo khung giờ, cuối tuần, ngày lễ, VIP |
| Payment | `payment.service.ts` | VNPay, cash, quét giao dịch hết hạn |
| Product & Inventory | `product.service.ts`, `inventory.service.ts` | Sản phẩm, biến thể, tồn kho |
| Order | `order.service.ts` | Đơn online + POS, trừ kho |
| Revenue | `revenue.service.ts` | Báo cáo doanh thu |
| System | `holiday.service.ts`, `systemConfig.service.ts`, `priceConfig.service.ts` | Ngày lễ, cấu hình, bảng giá |

> **Khi vấn đáp:** Nhóm áp dụng **kiến trúc hướng dịch vụ ở mức thiết kế** (service layer, API contract, loose coupling giữa client và server), **không** triển khai microservices hay service mesh.

---

## --- SLIDE 4: KIẾN TRÚC TỔNG THỂ (THỰC TẾ) ---

### [GỢI Ý HÌNH] Sơ đồ kiến trúc

```
┌─────────────────────────┐       ┌──────────────────────────┐
│      Web Admin          │       │     Mobile App           │
│  React 19 + Vite 8      │       │  React Native + Expo 54  │
│  Ant Design + Tailwind  │       │  React Navigation        │
│  Axios + Socket.io      │       │  Axios + WebView (VNPay) │
│  localhost:5173         │       │  EXPO_PUBLIC_API_URL     │
└────────────┬────────────┘       └────────────┬─────────────┘
             │  HTTPS / REST JSON              │
             │  JWT Bearer Token               │
             └──────────────┬──────────────────┘
                            ▼
              ┌─────────────────────────────┐
              │   Backend API (Monolith)    │
              │   Node.js + Express 5       │
              │   TypeScript — PORT 3000    │
              │                             │
              │   /api/v1/app/*   (mobile)  │
              │   /api/v1/admin/* (web)     │
              │   /api/v1/upload/image      │
              │   Socket.io (staff_room)    │
              │                             │
              │   routes/ → controllers/    │
              │          → services/        │
              │          → models/          │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌──────────────────┐         ┌─────────────────┐
    │  MySQL (Aiven)   │         │   Cloudinary    │
    │  Sequelize ORM   │         │  (ảnh sản phẩm) │
    │  ACID Transaction│         └─────────────────┘
    └──────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌──────────────────┐         ┌─────────────────┐
    │ Redis (tùy chọn) │         │  VNPay Sandbox  │
    │ cache đọc cấu hình│         │  IPN + Return   │
    │ KHÔNG dùng cho   │         └─────────────────┘
    │ booking lock     │
    └──────────────────┘
```

### Điểm nhấn khi trình bày
- **Một codebase backend** phục vụ cả web và mobile — đúng mô hình monolith có tổ chức tốt.
- **Không có** RabbitMQ, Kafka, API Gateway riêng, hay database-per-service.
- **Docker Compose** (`docker-compose.yml`) chỉ chạy `backend` + `web-admin`; MySQL nằm trên Aiven Cloud.

---

## --- SLIDE 5: API & PHÂN HỆ ỨNG DỤNG ---

### Backend — nhóm endpoint chính (`backend/src/routes/index.ts`)

| Nhóm | Prefix | Ví dụ chức năng |
|------|--------|-----------------|
| Auth (app) | `/api/v1/app/auth` | Đăng ký, đăng nhập khách |
| Auth (admin) | `/api/v1/admin/auth` | Đăng nhập admin/staff, refresh token (cookie) |
| Booking (app) | `/api/v1/app/bookings` | Lịch trống, đặt sân, hủy, batch |
| Booking (admin) | `/api/v1/admin/bookings` | Sa bàn, đặt hotline, cập nhật trạng thái |
| Facility / Court | `/app/facilities`, `/admin/facilities`, `/admin/courts` | Cơ sở, sân |
| Product / Order | `/app/products`, `/app/orders`, `/admin/orders` | Shop + POS |
| Inventory | `/api/v1/admin/inventory` | Tồn kho, nhập/xuất |
| Payment | `/api/v1/app/payments` | VNPay create, IPN, return URL |
| Revenue | `/api/v1/admin/revenue` | Báo cáo doanh thu |
| Cấu hình | `/admin/price-configs`, `/admin/holidays`, `/admin/system-configs` | Giá, ngày lễ, hệ thống |
| Upload | `/api/v1/upload/image` | Ảnh lên Cloudinary |

### Hai client

| Client | Thư mục | Công nghệ | Chức năng chính |
|--------|---------|-----------|-----------------|
| **Web Admin** | `web-admin/` | React 19, Vite 8, Ant Design 6, Zustand, Axios | Sa bàn lịch, POS, kho, báo cáo, CRUD |
| **Mobile App** | `customer-app/` | React Native, Expo 54, React Navigation, Axios | Đặt sân timeline, shop, VNPay WebView |

### Kết nối API (đồng bộ cổng 3000)

| Ứng dụng | Cấu hình | URL mặc định |
|----------|----------|--------------|
| Backend | `PORT` trong `.env` | `http://localhost:3000` |
| Web Admin | `VITE_API_URL` trong `web-admin/.env` | `http://localhost:3000/api/v1` |
| Mobile App | `EXPO_PUBLIC_API_URL` trong `customer-app/.env` | `http://localhost:3000/api/v1` (máy thật dùng IP LAN) |

---

## --- SLIDE 6: CƠ SỞ DỮ LIỆU ---

### Một MySQL, nhiều miền dữ liệu (logical separation)

ORM: **Sequelize 6** — models trong `backend/src/models/`, quan hệ khai báo tại `models/index.ts`.

| Miền | Bảng chính | Ghi chú |
|------|-----------|---------|
| User & Auth | `users`, `refresh_tokens`, `staff_profiles` | Role: `admin`, `staff`, `customer` |
| Facility & Court | `facilities`, `courts`, `court_types`, `price_configs`, `holidays` | Soft delete trên một số bảng |
| Booking | `bookings`, `booking_slots` | Chống trùng bằng query overlap + transaction |
| Commerce | `products`, `product_variants`, `orders`, `order_items` | POS + đơn online |
| Inventory | `inventory_levels`, `inventory_movements` | Trừ kho khi bán |
| Payment | `payments` | Gắn booking hoặc order |
| Khác | `system_configs`, `notifications`, `audit_logs`, `cart_items` | Model có; API cart/notification chưa đầy đủ |

### Đảm bảo toàn vẹn dữ liệu
- **Sequelize Transaction:** Tạo booking + slot, tạo order + trừ kho, xử lý IPN VNPay.
- **Chống double booking:** `booking.service.ts` kiểm tra overlap thời gian trên cùng `court_id` trước khi commit — **không** dùng Redis lock.
- **Redis (nếu cấu hình `REDIS_URL`):** Chỉ cache đọc cho price config, holiday, system config — có thể tắt hoàn toàn.

---

## --- SLIDE 7: GIAO TIẾP ĐỒNG BỘ (REST API) ---

### Luồng HTTP chính

| Luồng | Phương thức | Endpoint |
|-------|-------------|----------|
| Đăng nhập app | `POST` | `/api/v1/app/auth/login` |
| Xem lịch trống | `GET` | `/api/v1/app/bookings/booked-slots?facility_id&date&court_type` |
| Kiểm tra sân trống + giá | `GET` | `/api/v1/app/bookings/availability`, `/price-preview` |
| Tạo booking | `POST` | `/api/v1/app/bookings` hoặc `/bookings/batch` |
| Thanh toán VNPay | `POST` | `/api/v1/app/payments/vnpay/create` |
| Admin sa bàn | `GET` | `/api/v1/admin/bookings/daily-slots` |
| POS tạo đơn | `POST` | `/api/v1/admin/orders` |

### Bảo mật & validate
- **JWT Bearer** — Mobile lưu token AsyncStorage; Web Admin lưu access token + refresh cookie httpOnly.
- **Role middleware** — Phân quyền theo `admin` / `staff` / `customer`.
- **Zod validation** — `backend/src/validations/` trước khi vào service.
- **Helmet + CORS** — `server.ts` cho phép web-admin và Expo dev.

### [GỢI Ý HÌNH] Luồng đặt sân

```
Mobile App  --GET booked-slots-->  BookingController  -->  BookingService  -->  MySQL
Mobile App  --POST bookings---->  BookingService (transaction)  -->  bookings + booking_slots
                                      │ emit Socket 'booking' → staff_room
Mobile App  --WebView VNPay---->  PaymentService  -->  URL VNPay
VNPay       --IPN callback---->  PaymentService  -->  cập nhật payment + booking status
                                      │ emit Socket 'booking_changed' → staff_room
Web Admin   <--Socket.IO---------  Sa bàn / Dashboard / Danh sách tự refresh
```

Xem sơ đồ chi tiết: `docs/LUONG_DAT_SAN_BOOKING.puml`.

---

## --- SLIDE 8: REAL-TIME & TÁC VỤ NỀN ---

### Socket.io — Web Admin (staff)

- Server: `backend/src/config/socket.ts` — staff join phòng `staff_room`.
- **Đơn hàng (shop):** `order` / `order_changed` từ `order.service.ts`, `payment.service.ts`.
- **Đặt sân (booking):** `booking` / `booking_changed` từ `booking.service.ts`, `payment.service.ts` (IPN VNPay, cron hết hạn 30 phút).
- Web Admin lắng nghe qua `useStaffRealtime` — popup toàn cục, Trung tâm vận hành, sa bàn lịch, danh sách đặt sân tự refresh.

```
Mobile App  --POST /app/bookings-->  BookingService
                                        │ emit('booking')
                                        ▼
Mobile App  --VNPay IPN------------>  PaymentService
                                        │ emit('booking_changed')
                                        ▼
                                Socket.io Server (staff_room)
                                        ▼
                    Web Admin: dashboard / sa bàn / danh sách / thông báo
```

Chi tiết luồng đặt sân: `docs/LUONG_DAT_SAN_BOOKING.md` và `docs/LUONG_DAT_SAN_BOOKING.puml`.

### Tác vụ nền — không dùng Message Broker

| Tác vụ | Cơ chế | Tần suất |
|--------|--------|----------|
| Hủy đơn hàng chưa thanh toán | `node-cron` (`jobs/cron.ts`) | Mỗi 1 phút |
| Hủy VNPay pending quá hạn | `setInterval` trong `server.ts` | Mỗi 1 phút |

### Email (Nodemailer)
- Gửi email quên mật khẩu qua SMTP — không chặn luồng đăng nhập chính.

---

## --- SLIDE 9: TÍCH HỢP BÊN THỨ BA ---

### 9.1 VNPay

```
Mobile / Web  --POST create-->  PaymentService  --URL-->  VNPay Sandbox
       │                                                    │
       │ WebView / QR Modal                                 │ IPN (server-to-server)
       ▼                                                    ▼
  Hiển thị kết quả                              Verify HMAC → cập nhật DB
```

- Ký **HMAC-SHA512** (`backend/src/utils/vnpay.ts`).
- Phân biệt `TxnRef`: Booking `{id}_{timestamp}` vs Order `ORDER_{id}_{timestamp}`.
- Tự hủy giao dịch pending sau **30 phút**.

### 9.2 Cloudinary
- Upload ảnh sản phẩm / cơ sở: Multer + Cloudinary → `POST /api/v1/upload/image`.

### 9.3 MySQL Aiven Cloud
- Kết nối từ `backend/src/config/database.ts` — database hosted, không chạy MySQL local trong Docker Compose.

---

## --- SLIDE 10: DESIGN PATTERN NỔI BẬT ---

| Pattern | Vị trí trong code | Lợi ích |
|---------|-------------------|---------|
| **Strategy Pattern** | `backend/src/patterns/strategies/pricing/` | Thêm loại giá (weekend, holiday, VIP…) không sửa core |
| **Service Layer** | `backend/src/services/*.ts` | Tách nghiệp vụ khỏi HTTP controller |
| **Repository (ORM)** | Sequelize Models | Trừu tượng hóa truy vấn MySQL |
| **Middleware Chain** | auth, role, validate, errorHandler | Xử lý cross-cutting concerns |
| **API Facade (mobile)** | `customer-app/src/data/mockStore.js` | Gom gọi API cho màn hình (tên file legacy, thực tế gọi backend) |

---

## --- SLIDE 11: DEMO SẢN PHẨM (5–10 PHÚT) ---

### Kịch bản demo đề xuất

#### Phần 1 — Mobile App (3–4 phút)
1. **Đăng nhập** → nhận JWT.
2. Chọn **cơ sở → bộ môn → ngày** → timeline lịch trống (ô 30 phút).
3. Chọn khung giờ (có thể chọn cùng ô → đặt 30 phút) → xem giá → thêm danh sách.
4. **Xác nhận đặt sân** → booking pending → tạo URL VNPay.
5. Thanh toán sandbox → IPN cập nhật → xem **Lịch sử đặt sân**.

#### Phần 2 — Web Admin (2–3 phút)
1. Đăng nhập Admin → **Sa bàn lịch đặt** → thấy slot vừa đặt.
2. Demo **đặt sân hotline** (staff tạo booking thay khách).
3. (Tuỳ chọn) Khách đặt hàng app → staff nhận Socket.io trên POS.

#### Phần 3 — POS & Kho (2 phút)
1. Staff bán tại quầy → tạo đơn → trừ tồn kho.
2. Xem **Báo cáo doanh thu**.

### Checklist trước khi demo
- [ ] Backend: `cd backend && pnpm dev` → cổng **3000**
- [ ] Web Admin: `cd web-admin && pnpm dev` → cổng **5173**, `VITE_API_URL=http://localhost:3000/api/v1`
- [ ] Mobile: `cd customer-app && npx expo start` — cấu hình `EXPO_PUBLIC_API_URL` (máy thật: `http://<IP-LAN>:3000/api/v1`)
- [ ] Điện thoại và máy dev cùng WiFi

---

## --- SLIDE 12: CÔNG NGHỆ ĐÃ SỬ DỤNG ---

### Backend (`backend/package.json`)
| Công nghệ | Phiên bản / Ghi chú |
|-----------|---------------------|
| Node.js + Express | Express 5.2, TypeScript |
| Sequelize ORM | MySQL qua mysql2 — Aiven Cloud |
| JWT + bcryptjs | Xác thực, phân quyền |
| Socket.io 4 | Thông báo đơn hàng cho staff |
| node-cron | Hủy đơn quá hạn |
| Zod 4 | Validate input |
| VNPay (custom utils) | Thanh toán online |
| Nodemailer | Email quên mật khẩu |
| Cloudinary + Multer | Upload ảnh |
| Redis 6 | **Tùy chọn** — cache đọc cấu hình |

### Web Admin (`web-admin/package.json`)
| Công nghệ | Ghi chú |
|-----------|---------|
| React 19 + Vite 8 | SPA quản trị |
| Ant Design 6 + Tailwind 4 | UI |
| Zustand 5 | Auth store, POS state |
| Axios + Socket.io-client | API + real-time |
| React Router 7 | Điều hướng |

### Mobile App (`customer-app/package.json`)
| Công nghệ | Ghi chú |
|-----------|---------|
| React Native 0.81 + Expo 54 | Cross-platform |
| React Navigation 7 | Tab + Stack |
| Axios | Gọi `/api/v1/app/*` |
| AsyncStorage | Lưu JWT |
| React Native WebView | Trang VNPay |

---

## --- SLIDE 13: KẾT QUẢ ĐẠT ĐƯỢC ---

### Chức năng đã hoàn thành
- Đặt sân online: timeline 30 phút, chọn nhiều khung, tối thiểu 30 phút, chống trùng lịch.
- Web Admin: sa bàn lịch, quản lý sân/giá/cơ sở, đặt hotline, POS bán hàng.
- Shop mobile: xem sản phẩm, giỏ hàng (local), đặt hàng, VNPay.
- Quản lý kho: nhập/xuất, tự trừ tồn khi bán.
- Báo cáo doanh thu (đặt sân + bán lẻ).
- VNPay end-to-end: tạo URL → IPN/Return → cập nhật DB.
- Socket.io: đơn hàng mới hiện trên web staff.
- Phân quyền Admin / Staff / Customer.

### Kiến trúc đạt được
- **Monolithic API** có tổ chức theo service layer — dễ bảo trì, một deploy.
- **Hai client** dùng chung contract REST `/api/v1`.
- **SOA ở mức thiết kế:** tách domain logic, không hard-code nghiệp vụ trong controller.

### Chưa hoàn thiện / mock
- Màn hình **Thông báo** trên app: UI mock, chưa có API đầy đủ.
- **QR check-in:** giao diện demo.
- **Giỏ hàng server** (`cart_items` model có, chưa có route API — app dùng giỏ local).
- **Audit log / Notification** model có trong DB, chưa dùng đầy đủ trong nghiệp vụ.

---

## --- SLIDE 14: HẠN CHẾ & HƯỚNG PHÁT TRIỂN ---

### Hạn chế hiện tại

| Hạn chế | Mô tả |
|---------|-------|
| Monolith single deploy | Toàn bộ nghiệp vụ trong một process — scale ngang phải scale cả khối |
| Shared Database | Một MySQL cho mọi domain |
| Không có Message Queue | Cron/`setInterval` thay cho hàng đợi tác vụ |
| Redis không bắt buộc | Chưa dùng cache cho booking; chỉ tùy chọn cho cấu hình |
| Push notification mobile | Chưa FCM / Expo Push |
| Test tự động | Chưa có suite unit/integration test trong repo |
| CI/CD | Chưa pipeline build/deploy tự động |

### Hướng phát triển (nếu mở rộng sau đồ án)
1. API notification đầy đủ + FCM cho mobile.
2. Giỏ hàng server-side, đồng bộ đa thiết bị.
3. Redis cache cho tra cứu lịch nếu traffic tăng.
4. CI/CD (GitHub Actions) + deploy Docker.
5. Thêm cổng thanh toán (MoMo, ZaloPay), membership, check-in QR thật.

> **Lưu ý:** Tách microservices **không** phải mục tiêu đồ án hiện tại; monolith đã đáp ứng quy mô và yêu cầu môn học.

---

## --- SLIDE 15: KẾT LUẬN & Q&A ---

### Tóm tắt
- Xây dựng **nền tảng quản lý sân cầu lông đa kênh** với **một backend API tập trung**.
- **Mobile App** phục vụ khách đặt sân & mua hàng.
- **Web Admin** phục vụ vận hành: lịch sân, POS, kho, báo cáo.
- Áp dụng **tư duy hướng dịch vụ** qua service layer và API contract — **không** triển khai microservices.

### Cảm ơn thầy/cô và các bạn đã lắng nghe!
**Hỏi đáp (Q&A)**

---

## PHỤ LỤC — GỢI Ý CÂU HỎI VẤN ĐÁP

| Câu hỏi có thể gặp | Gợi ý trả lời ngắn |
|--------------------|---------------------|
| Đồ án có microservices không? | **Không.** Một backend Node.js monolith, tách logic bằng service layer. |
| Vậy SOA ở đâu? | Hai client độc lập gọi REST API; backend tách domain trong `services/`; contract `/api/v1/app` và `/admin`. |
| Tránh double booking thế nào? | Query overlap trên `booking_slots` + **Sequelize transaction** trước khi commit. |
| Redis dùng làm gì? | **Tùy chọn** — cache đọc price config, holiday, system config. Không lock slot đặt sân. |
| VNPay IPN khác Return URL? | Return URL cho app hiển thị; IPN server-to-server để cập nhật DB chính thức. |
| Socket.io dùng ở đâu? | Push đơn hàng mới tới Web Admin staff (`staff_room`), không dùng cho khách mobile. |
| Web và app gọi cùng backend không? | **Có** — cùng server cổng 3000, khác prefix `/app` vs `/admin`. |

---

*Tài liệu cập nhật theo codebase: `backend/`, `web-admin/`, `customer-app/` — tháng 06/2025.*
