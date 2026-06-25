# NỘI DUNG SLIDE — BÀI THUYẾT TRÌNH
## Hệ thống Quản lý & Đặt sân Cầu lông (Badminton Court Management System)

> **Môn học:** Phát triển phần mềm hướng dịch vụ (SOA)  
> **Nhóm:** Nhóm 21  
> **Ghi chú:** Copy từng block `--- SLIDE X ---` sang PowerPoint/Google Slides. Phần `[GỢI Ý HÌNH]` là nội dung cần vẽ sơ đồ hoặc chụp màn hình.

---

## --- SLIDE 1: MỞ ĐẦU ---

### Tiêu đề đề tài
**HỆ THỐNG QUẢN LÝ & ĐẶT SÂN CẦU LÔNG HƯỚNG DỊCH VỤ (SOA)**  
*Badminton Court Management System — Web Admin + Mobile App + API trung tâm*

### Thông tin môn học
- **Môn học:** Phát triển phần mềm hướng dịch vụ (SOA)
- **Giảng viên hướng dẫn:** [Điền tên GV]

### Danh sách thành viên & phân công

| STT | Họ tên | MSSV | Vai trò / Phân hệ phụ trách | Tỷ lệ đóng góp |
|-----|--------|------|-----------------------------|----------------|
| 1 | Trương Anh Tùng | N22DCCN195 | Web Admin: quản lý sân, sa bàn lịch đặt; Backend: Facility, Booking, Price Config | 25% |
| 2 | Nguyễn Đức Chính | N22DCCN110 | Web Admin: POS bán hàng, kho, báo cáo doanh thu; Backend: Product, Inventory, Order, Revenue | 25% |
| 3 | Nguyễn Sỹ Kim Bằng | N22DCCN106 | Mobile App: đặt sân, tài khoản; Backend: Auth, User, điều phối API client | 25% |
| 4 | Nguyễn Hữu Ngọc Hoàng | N22DCCN129 | Mobile App: cửa hàng, thanh toán; Backend: Payment (VNPay), Order client | 25% |

**Tổng quan phân chia:** 2 thành viên tập trung **Web + nghiệp vụ vận hành nội bộ**, 2 thành viên tập trung **Mobile + trải nghiệm khách hàng & thanh toán**.

---

## --- SLIDE 2: BỐI CẢNH & BÀI TOÁN ---

### Bối cảnh thực tế
- Phong trào cầu lông phát triển mạnh → nhiều cụm sân, nhà thi đấu mở ra.
- Đa số cơ sở vẫn quản lý bằng **sổ sách, Excel, Zalo/Facebook** → thiếu đồng bộ, khó mở rộng.

### Bài toán cần giải quyết (Business Requirements)
| Vấn đề hiện tại | Hệ thống giải quyết |
|-----------------|---------------------|
| Trùng lịch (double booking) khi nhiều kênh đặt | Lịch sân tập trung, kiểm tra chồng chéo theo slot thời gian |
| Khách phải gọi điện / nhắn tin đặt sân | Đặt sân online qua Mobile App, xem timeline trống theo ngày |
| Nhân viên khó nắm tổng quan lịch toàn cơ sở | Web Admin: sa bàn lịch, duyệt/hủy booking, đặt qua hotline |
| Bán phụ kiện (vợt, cầu, giày…) rời rạc | Module bán lẻ: shop trên app + POS tại quầy trên web |
| Thanh toán & đối soát thủ công | Tích hợp **VNPay** (QR / WebView), tự hủy giao dịch quá hạn |
| Thiếu báo cáo doanh thu tổng hợp | Báo cáo doanh thu theo ngày/tháng (đặt sân + bán lẻ) |

### Đối tượng sử dụng
- **Khách hàng (Customer):** Đặt sân, mua hàng, thanh toán, xem lịch cá nhân.
- **Nhân viên / Lễ tân (Staff):** Check-in, bán hàng POS, xử lý đơn.
- **Quản trị viên (Admin):** Cấu hình giá, sân, nhân sự, báo cáo.

---

## --- SLIDE 3: LÝ DO CHỌN KIẾN TRÚC HƯỚNG DỊCH VỤ (SOA) ---

### Tại sao không làm một khối monolith “cứng”?
Hệ thống có **nhiều miền nghiệp vụ độc lập** nhưng cùng phục vụ một chuỗi giá trị:

1. **Auth & User Service** — xác thực, phân quyền JWT (Admin / Staff / Customer)
2. **Facility & Court Service** — cơ sở, loại sân, sân cụ thể
3. **Booking Service** — tra cứu lịch trống, đặt sân, hủy, batch booking
4. **Pricing Service** — tính giá động (giờ thường, cuối tuần, ngày lễ) theo Strategy Pattern
5. **Payment Service** — VNPay, IPN callback, quét giao dịch hết hạn
6. **Product & Inventory Service** — sản phẩm, biến thể, tồn kho, xuất nhập
7. **Order Service** — đơn hàng online + POS, trừ kho trong transaction
8. **Revenue & System Config Service** — báo cáo, cấu hình hệ thống, ngày lễ

### Lợi ích SOA áp dụng trong đề tài
- **Loose coupling:** Mỗi service có lớp `controller → service → model` riêng; client chỉ gọi qua REST API.
- **Dễ mở rộng:** Thêm cổng thanh toán, thêm loại sân mới không ảnh hưởng toàn hệ thống.
- **Tái sử dụng:** Một API phục vụ đồng thời **Web Admin** và **Mobile App** (`/api/v1/app/*` và `/api/v1/admin/*`).
- **Phân chia nhóm:** Mỗi thành viên phụ trách một domain service rõ ràng.

> **Lưu ý trình bày:** Dự án triển khai theo mô hình **Modular Monolith + SOA** (các dịch vụ logic trong một codebase Node.js), sẵn sàng tách thành microservices khi scale.

---

## --- SLIDE 4: KIẾN TRÚC TỔNG THỂ ---

### [GỢI Ý HÌNH] Sơ đồ Architecture Diagram

```
┌─────────────────────┐     ┌──────────────────────┐
│   Web Admin         │     │   Mobile App         │
│   React + Vite      │     │   React Native       │
│   Ant Design        │     │   Expo + Axios       │
│   Socket.io Client  │     │   WebView (VNPay)    │
└──────────┬──────────┘     └──────────┬───────────┘
           │  HTTPS / REST JSON         │
           │  JWT Bearer Token          │
           └─────────────┬────────────────┘
                         ▼
              ┌──────────────────────┐
              │   API Layer          │
              │   Node.js + Express  │
              │   /api/v1/app/*      │  ← Khách hàng
              │   /api/v1/admin/*    │  ← Quản trị
              │   Socket.io Server   │  ← Real-time staff
              └──────────┬───────────┘
                         │
     ┌───────────────────┼───────────────────────┐
     ▼                   ▼                       ▼
┌─────────┐      ┌───────────────┐      ┌─────────────┐
│ Auth    │      │ Booking       │      │ Payment     │
│ Service │      │ Service       │      │ Service     │
├─────────┤      ├───────────────┤      ├─────────────┤
│ Facility│      │ Pricing       │      │ Order       │
│ Service │      │ Service       │      │ Service     │
├─────────┤      ├───────────────┤      ├─────────────┤
│ Product │      │ Inventory     │      │ Revenue     │
│ Service │      │ Service       │      │ Service     │
└────┬────┘      └───────┬───────┘      └──────┬──────┘
     │                   │                      │
     └───────────────────┼──────────────────────┘
                         ▼
              ┌──────────────────────┐
              │   MySQL (Aiven)      │
              │   Sequelize ORM      │
              │   ACID Transaction   │
              └──────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌──────────┐         ┌─────────────┐
        │  Redis   │         │ Cloudinary  │
        │  (Cache) │         │ (Ảnh SP)  │
        └──────────┘         └─────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   VNPay Gateway      │
              │   (Thanh toán online)│
              └──────────────────────┘
```

### Điểm nhấn khi trình bày
- **Không có API Gateway riêng** → Express đóng vai trò **API Gateway logic** qua route prefix.
- **Hai luồng client** tách biệt rõ ràng nhưng dùng chung tầng service.

---

## --- SLIDE 5: DANH SÁCH CÁC DỊCH VỤ (SERVICES DEFINITION) ---

| Dịch vụ | Endpoint chính | Trách nhiệm |
|---------|----------------|-------------|
| **Auth Service** | `/app/auth/*`, `/admin/auth/*` | Đăng ký, đăng nhập, JWT, đổi mật khẩu, quên mật khẩu (email) |
| **Facility Service** | `/app/facilities/*`, `/admin/facilities/*` | CRUD cơ sở, danh sách loại sân, chi tiết sân |
| **Court Service** | `/admin/courts/*` | Quản lý sân theo cơ sở (cầu lông, tennis, bóng bàn…) |
| **Booking Service** | `/app/bookings/*`, `/admin/bookings/*` | Lịch trống, kiểm tra availability, tạo/hủy booking, đặt batch |
| **Pricing Service** | (nội bộ) + `/admin/price-configs/*` | Tính giá theo khung giờ, cuối tuần, ngày lễ (Strategy Pattern) |
| **Payment Service** | `/app/payments/*` | Tạo URL VNPay, xử lý IPN, quét thanh toán hết hạn 30 phút |
| **Product Service** | `/app/products/*`, `/admin/products/*` | Danh mục sản phẩm, biến thể (size, màu), upload ảnh |
| **Inventory Service** | `/admin/inventory/*` | Tồn kho, nhập/xuất, inventory movement |
| **Order Service** | `/app/orders/*`, `/admin/orders/*` | Đơn hàng online + POS, trừ kho, hủy đơn quá hạn (cron) |
| **Revenue Service** | `/admin/revenue/*` | Báo cáo doanh thu đặt sân + bán lẻ |
| **System Config / Holiday** | `/admin/system-configs/*`, `/admin/holidays/*` | Cấu hình hệ thống, ngày lễ ảnh hưởng giá |

### Client tương ứng
| Client | Công nghệ | Chức năng chính |
|--------|-----------|-----------------|
| **Web Admin** | React 19, Vite, Ant Design, Tailwind, Zustand, React Query | Sa bàn lịch, POS, kho, báo cáo, CRUD |
| **Mobile App** | React Native, Expo, React Navigation, Axios | Đặt sân timeline, shop, VNPay WebView, lịch sử |

---

## --- SLIDE 6: CƠ SỞ DỮ LIỆU & LIÊN KẾT LỎNG LẺO ---

### Mô hình dữ liệu (Shared Database — Logical Separation)

> Trong phạm vi đồ án: dùng **một MySQL** nhưng **tách logic theo domain** qua Sequelize models & service layer — đặc trưng SOA ở tầng thiết kế, sẵn sàng tách DB khi microservices hóa.

| Domain | Bảng chính | Quan hệ |
|--------|-----------|---------|
| **User & Auth** | `users`, `refresh_tokens`, `staff_profiles` | User ↔ StaffProfile ↔ Facility |
| **Facility & Court** | `facilities`, `courts`, `court_types`, `price_configs`, `holidays` | Facility → Courts → BookingSlots |
| **Booking** | `bookings`, `booking_slots` | Booking → nhiều Slot; kiểm tra overlap |
| **Commerce** | `products`, `product_variants`, `orders`, `order_items`, `cart_items` | Order → OrderItems → trừ Inventory |
| **Inventory** | `inventory_levels`, `inventory_movements` | Ghi nhận mọi thay đổi tồn kho |
| **Payment** | `payments` | Liên kết Booking hoặc Order |
| **Audit** | `audit_logs`, `notifications`, `system_configs` | Theo dõi & cấu hình |

### Đảm bảo toàn vẹn dữ liệu
- **Sequelize Transaction (ACID):** Tạo booking + slot, tạo order + trừ kho, xử lý IPN VNPay.
- **Redis (tùy chọn):** Cache tra cứu lịch trống — giảm tải DB khi nhiều user cùng xem.
- **Loose coupling giữa services:** Booking gọi PricingService tính giá; Payment gọi InventoryService khi order thành công — không truy cập trực tiếp bảng của service khác từ controller.

---

## --- SLIDE 7: GIAO TIẾP ĐỒNG BỘ (SYNCHRONOUS) ---

### HTTP/REST API — phương thức chính

| Luồng | Phương thức | Ví dụ endpoint |
|-------|-------------|----------------|
| Đăng nhập app | `POST` | `/api/v1/app/auth/login` |
| Xem lịch trống | `GET` | `/api/v1/app/bookings/booked-slots?facility_id&date&court_type` |
| Kiểm tra & tính giá slot | `GET` / `POST` | `/api/v1/app/bookings/availability`, `/price-preview` |
| Tạo booking | `POST` | `/api/v1/app/bookings` hoặc `/bookings/batch` |
| Tạo thanh toán VNPay | `POST` | `/api/v1/app/payments/vnpay/create` |
| Admin xem sa bàn | `GET` | `/api/v1/admin/bookings/daily-slots` |
| POS tạo đơn | `POST` | `/api/v1/admin/orders` |

### Cơ chế bảo mật
- **JWT Bearer Token** — Mobile & Web đính kèm qua Axios Interceptor.
- **Role Middleware** — Phân quyền `admin`, `staff`, `customer`.
- **Zod Validation** — Validate input trước khi vào service layer.
- **Helmet + CORS** — Bảo vệ HTTP headers.

### [GỢI Ý HÌNH] Luồng REST đặt sân
```
Mobile App  --GET booked-slots-->  Booking Service  --query-->  MySQL
Mobile App  --POST bookings----->  Booking Service  --transaction-->  bookings + booking_slots
Mobile App  --POST payments----->  Payment Service  --redirect URL-->  VNPay
VNPay       --IPN callback----->  Payment Service  --update-->  booking status = confirmed
```

---

## --- SLIDE 8: GIAO TIẾP BẤT ĐỒNG BỘ & REAL-TIME ---

### Socket.io — thông báo thời gian thực (Web Admin)
- Khi khách đặt hàng online → `Order Service` emit event `order` / `order_changed` tới phòng `staff_room`.
- Web Admin kết nối Socket.io → nhân viên thấy đơn mới **không cần refresh trang**.

```
Mobile App  --POST /app/orders-->  Order Service
                                      │
                                      ▼ emit('order_changed')
                              Socket.io Server
                                      │
                                      ▼
                              Web Admin (staff_room)
```

### Node-cron & Background Jobs — không dùng Message Broker
| Tác vụ | Cơ chế | Tần suất | Mục đích |
|--------|--------|----------|----------|
| Hủy đơn hàng quá hạn | `node-cron` | Mỗi 1 phút | `OrderService.cancelExpiredOrders()` |
| Hủy thanh toán booking/order VNPay quá hạn | `setInterval` trong `server.ts` | Mỗi 1 phút | `PaymentService.checkExpiredPayments()` |

> **Giải thích khi vấn đáp:** Nhóm chưa triển khai RabbitMQ/Kafka vì quy mô đồ án; cron job đủ cho tác vụ nền. Hướng phát triển: đưa các job này vào queue (BullMQ + Redis) khi traffic tăng.

### Email bất đồng bộ (Nodemailer)
- Gửi email quên mật khẩu qua SMTP — không chặn luồng đăng nhập chính.

---

## --- SLIDE 9: TÍCH HỢP BÊN THỨ BA ---

### 9.1 VNPay — Thanh toán online

**[GỢI Ý HÌNH] Luồng thanh toán VNPay**

```
┌─────────────┐    ① POST create payment     ┌──────────────┐
│ Mobile App  │ ───────────────────────────► │ Payment Svc  │
│ / Web Admin │ ◄── ② paymentUrl + QR ────── │ (Backend)    │
└──────┬──────┘                              └──────┬───────┘
       │ ③ Mở WebView / QR Modal                     │
       ▼                                             │
┌─────────────┐    ④ Khách thanh toán          ┌──────▼───────┐
│   VNPay     │ ◄──────────────────────────► │  VNPay GW    │
│  (Browser)  │                              └──────┬───────┘
└──────┬──────┘                                       │
       │ ⑤ Return URL (app)                           │ ⑥ IPN (server-to-server)
       ▼                                              ▼
┌─────────────┐                              ┌──────────────┐
│ Mobile App  │                              │ Payment Svc  │
│ hiển thị KQ │                              │ verify HMAC  │
└─────────────┘                              │ update DB    │
                                             └──────────────┘
```

**Chi tiết kỹ thuật:**
- Ký HMAC-SHA512 (`VNPayUtils`) khi tạo URL và khi nhận IPN.
- Phân biệt `TxnRef`: Booking (`{id}_{timestamp}`) vs Order (`ORDER_{id}_{timestamp}`).
- Tự động hủy giao dịch pending sau **30 phút**.

### 9.2 Cloudinary — Lưu trữ ảnh
- Admin upload ảnh sản phẩm / sân → Multer + Cloudinary Storage → trả URL public.

### 9.3 MySQL Aiven Cloud — Database hosted
- Kết nối qua Sequelize; hỗ trợ triển khai production không phụ thuộc máy local.

---

## --- SLIDE 10: DESIGN PATTERN NỔI BẬT ---

| Pattern | Áp dụng ở đâu | Lợi ích |
|---------|---------------|---------|
| **Strategy Pattern** | `backend/src/patterns/strategies/pricing/` | Thêm loại giá (weekend, holiday) không sửa core |
| **Service Layer** | `backend/src/services/*.ts` | Tách nghiệp vụ khỏi HTTP controller |
| **Repository (ORM)** | Sequelize Models | Trừu tượng hóa truy vấn DB |
| **Middleware Chain** | Auth, Role, Validate, ErrorHandler | Xử lý cross-cutting concerns |
| **Optimistic UI** | Mobile App BookingScreen | Hiển thị khung giờ chọn ngay, lấy giá background |

---

## --- SLIDE 11: DEMO SẢN PHẨM (5–10 PHÚT) ---

### Kịch bản demo đề xuất — luồng nghiệp vụ chính

> **Nguyên tắc:** Chỉ demo luồng thể hiện **tương tác giữa các dịch vụ**, không demo CRUD lẻ tẻ.

#### Phần 1 — Mobile App (3–4 phút) — Booking + Payment
1. **Đăng nhập** → Auth Service cấp JWT.
2. Chọn **cơ sở → bộ môn → ngày** → Booking Service trả timeline `booked-slots`.
3. Chọn khung giờ trên timeline → Pricing Service tính giá → thêm vào danh sách.
4. **Xác nhận đặt sân** → tạo booking pending → Payment Service tạo URL VNPay.
5. Thanh toán (sandbox VNPay) → IPN cập nhật trạng thái → hiển thị trong **Lịch sử đặt sân**.

#### Phần 2 — Web Admin (2–3 phút) — Vận hành real-time
1. Đăng nhập Admin → mở **Sa bàn lịch đặt** → thấy slot vừa đặt (refresh hoặc real-time).
2. Demo **đặt sân qua hotline** (staff tạo booking thay khách).
3. (Tuỳ chọn) Khách đặt hàng trên app → staff nhận thông báo Socket.io trên web.

#### Phần 3 — POS & Kho (2 phút) — Order + Inventory
1. Staff bán sản phẩm tại quầy (POS) → Order Service tạo đơn → Inventory trừ tồn.
2. Xem **Báo cáo doanh thu** → Revenue Service tổng hợp booking + order.

### [GỢI Ý] Checklist trước khi demo
- [ ] Backend chạy (`PORT=5000` hoặc đồng bộ với `api.js` trong app)
- [ ] Metro Expo: `npx expo start`
- [ ] Web Admin: `pnpm dev` (port 5173)
- [ ] Điện thoại & máy tính cùng WiFi; `baseURL` trỏ đúng IP LAN

---

## --- SLIDE 12: CÔNG NGHỆ ĐÃ SỬ DỤNG ---

### Backend
| Công nghệ | Phiên bản / Ghi chú |
|-----------|---------------------|
| Node.js + Express | API server, TypeScript |
| Sequelize ORM | MySQL — Aiven Cloud |
| JWT + bcryptjs | Xác thực |
| Socket.io | Real-time staff notification |
| Redis | Cache (optional) |
| node-cron | Background jobs |
| Zod | Validation |
| VNPay SDK (custom utils) | Thanh toán |
| Nodemailer | Email |
| Cloudinary | Upload ảnh |
| Docker | Dockerfile backend + web-admin |

### Frontend
| Công nghệ | Ứng dụng |
|-----------|----------|
| React 19 + Vite 8 | Web Admin SPA |
| Ant Design 6 + Tailwind 4 | UI quản trị |
| React Query + Zustand | State & data fetching |
| React Native + Expo 54 | Mobile App |
| Axios | HTTP client (cả web & app) |
| React Navigation | Điều hướng mobile |
| React Native WebView | Nhúng trang VNPay |

---

## --- SLIDE 13: KẾT QUẢ ĐẠT ĐƯỢC ---

### Chức năng đã hoàn thành
- Đặt sân online với timeline 30 phút, multi-slot, kiểm tra trùng lịch.
- Web Admin: sa bàn lịch, quản lý sân/giá, đặt hotline, POS bán hàng.
- Shop trên mobile: xem sản phẩm, đặt hàng, thanh toán VNPay.
- Quản lý kho: nhập/xuất, tự trừ tồn khi bán.
- Báo cáo doanh thu theo thời gian.
- Thanh toán VNPay end-to-end (tạo URL → IPN → cập nhật DB).
- Real-time thông báo đơn hàng cho staff qua Socket.io.
- Phân quyền Admin / Staff / Customer.

### Kiến trúc SOA đạt được
- Tách domain service rõ ràng trong backend.
- Hai client độc lập giao tiếp qua API contract thống nhất `/api/v1`.
- Sẵn sàng mở rộng thêm dịch vụ mới (notification push, MoMo…).

---

## --- SLIDE 14: HẠN CHẾ & HƯỚNG PHÁT TRIỂN ---

### Hạn chế hiện tại
| Hạn chế | Mô tả |
|---------|-------|
| Chưa tách microservices thật | Các service logic nằm chung một process Node.js |
| Shared Database | Chưa áp dụng Database-per-Service |
| Chưa có Message Broker | Cron thay cho RabbitMQ/Kafka |
| Chưa có API Gateway riêng | Express đảm nhiệm routing |
| Push notification mobile | Chưa tích hợp FCM/Expo Push |
| CI/CD | Chưa có pipeline tự động build/deploy |

### Hướng phát triển
1. **Tách microservices:** Booking, Payment, Order thành các container Docker độc lập.
2. **API Gateway:** Kong / Nginx reverse proxy, rate limiting, centralized auth.
3. **Message Queue:** Redis BullMQ hoặc RabbitMQ cho email, notification, payment retry.
4. **CI/CD:** GitHub Actions → build Docker → deploy VPS/Cloud.
5. **Bảo mật:** Refresh token rotation, API rate limit, audit log đầy đủ hơn.
6. **Mở rộng nghiệp vụ:** MoMo, ZaloPay, membership, điểm tích lũy, check-in QR.

---

## --- SLIDE 15: KẾT LUẬN & Q&A ---

### Tóm tắt
- Xây dựng thành công **nền tảng quản lý sân cầu lông đa kênh** theo hướng dịch vụ.
- **Mobile App** phục vụ khách hàng đặt sân & mua hàng nhanh.
- **Web Admin** phục vụ vận hành nội bộ: lịch sân, POS, kho, báo cáo.
- **Backend API** kết nối các dịch vụ nghiệp vụ qua REST + Socket.io + tích hợp VNPay.

### Cảm ơn thầy/cô và các bạn đã lắng nghe!
**Hỏi đáp (Q&A)**

---

## PHỤ LỤC — GỢI Ý CÂU HỎI VẤN ĐÁP & GỢI Ý TRẢ LỜI

| Câu hỏi có thể gặp | Gợi ý trả lời ngắn |
|--------------------|---------------------|
| Vì sao gọi là SOA mà không phải Microservices? | SOA tách **logic nghiệp vụ thành các service độc lập về interface**; nhóm triển khai modular monolith, có thể tách deploy sau. |
| Tránh double booking thế nào? | Kiểm tra overlap `booking_slots` trong transaction Sequelize trước khi commit. |
| VNPay IPN khác Return URL thế nào? | Return URL cho app hiển thị; IPN là server-to-server, dùng để cập nhật DB chính thức. |
| Redis dùng để làm gì? | Cache availability; có thể tắt nếu không cấu hình `REDIS_URL`. |
| Socket.io dùng ở đâu? | Push đơn hàng mới tới Web Admin staff, không dùng cho mobile customer. |

---

*Tài liệu được sinh từ codebase thực tế: `backend/`, `web-admin/`, `customer-app/`, `docs/ARCHITECTURE.md`, `docs/BCCK_HDV_Report.md`.*
