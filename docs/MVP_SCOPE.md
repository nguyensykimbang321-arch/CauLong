# Phạm vi MVP & Phân công cụ thể

## 1. Phạm vi MVP

**Thời gian**: 8–10 tuần | **Nhóm**: 4 người

### 1.1 Những gì LÀM trong MVP

| Hạng mục | Chi tiết |
|----------|----------|
| **Nền tảng** | Web (React + Vite) + App (React Native) dùng chung 1 Backend (Node.js + MySQL) |
| **Đặt sân** | 1 cơ sở, nhiều sân, 2–3 loại sân (cầu lông, tennis, bóng bàn), slot cố định, giá theo khung giờ |
| **Thanh toán** | Giả lập / chuyển khoản thủ công + xác nhận tay (hoặc 1 cổng sandbox test) |
| **Bán lẻ** | Danh mục sản phẩm, giỏ hàng, tạo đơn, trừ kho (1 kho duy nhất) |
| **Nhân viên** | Đăng nhập, 2–3 role (admin, staff, customer), CRUD cơ bản |

### 1.2 Những gì KHÔNG LÀM trong MVP (để sau)

- Đa cơ sở / multi-tenant
- Dynamic pricing bằng AI
- Tích hợp MoMo / VNPay production
- Đa kho, chuyển hàng liên tỉnh
- Phân ca chi tiết, bảng lương (payroll)
- Push notification phức tạp

---

## 2. Phân chia nền tảng

| Nền tảng | Vai trò | Người phụ trách |
|----------|---------|-----------------|
| **Web** (React + Vite) | Admin + Staff Dashboard — quản lý, điều hành | **W1, W2** (2 người) |
| **App** (React Native) | Customer App — trải nghiệm khách hàng | **A1, A2** (2 người) |
| **Backend** (Node.js) | API dùng chung cho cả Web và App | Chia đều cho 4 người theo domain |

---

## 3. Phân công cụ thể — 4 thành viên

### W1 — Web: Quản lý Sân & Lịch đặt

**Phụ trách:** Giao diện admin quản lý sân bãi + lịch đặt + Backend liên quan

| STT | Phần | Công việc | Mô tả |
|-----|------|-----------|-------|
| | **Web** | | |
| 1 | | Quản lý sân bãi | CRUD sân, giá theo khung giờ, trạng thái sân (đang sửa / đang dùng) |
| 2 | | Quản lý lịch đặt | Calendar view toàn bộ sân, duyệt / hủy booking, phát hiện trùng lịch |
| 3 | | Cấu hình hệ thống | Giá sân theo giờ, chính sách hủy, cài đặt khuyến mãi |
| 4 | | Dashboard (phần booking) | Thống kê booking hôm nay, tỷ lệ lấp sân |
| | **Backend** | | |
| 5 | | Module Facilities & Courts | API CRUD cơ sở, sân, loại sân, giá theo khung giờ |
| 6 | | Module Booking | API availability, hold slot (Redis), tạo/hủy booking, chống trùng lịch |

### W2 — Web: Quản lý Bán hàng & Vận hành

**Phụ trách:** Giao diện admin quản lý bán hàng, nhân viên, báo cáo + Backend liên quan

| STT | Phần | Công việc | Mô tả |
|-----|------|-----------|-------|
| | **Web** | | |
| 1 | | Quản lý sản phẩm | CRUD sản phẩm (vợt, quần áo, cầu…), variant, cập nhật giá |
| 2 | | Quản lý kho | Nhập hàng, xem tồn kho, điều chỉnh số lượng |
| 3 | | Quản lý đơn hàng | Danh sách đơn, cập nhật trạng thái (xác nhận / hoàn thành) |
| 4 | | Quản lý nhân viên | Tài khoản nhân viên, phân quyền (admin, staff) |
| 5 | | Báo cáo & thống kê | Doanh thu theo ngày/tháng, sản phẩm bán chạy, khách hàng VIP |
| | **Backend** | | |
| 6 | | Module Products | API CRUD sản phẩm, variants, danh mục |
| 7 | | Module Inventory | API tồn kho, nhập hàng, trừ kho, điều chỉnh |
| 8 | | Module Reports | API doanh thu, thống kê tổng hợp |

### A1 — App: Đặt sân & Tài khoản

**Phụ trách:** App khách hàng — luồng đặt sân, tài khoản + Backend liên quan

| STT | Phần | Công việc | Mô tả |
|-----|------|-----------|-------|
| | **App** | | |
| 1 | | Đăng ký / Đăng nhập | Auth trên app (login, register, quên mật khẩu) |
| 2 | | Đặt sân | Xem sân trống theo thời gian → chọn slot → giữ chỗ → xác nhận |
| 3 | | Lịch cá nhân | Lịch đã đặt, nhắc lịch, xem chi tiết booking |
| 4 | | Tài khoản cá nhân | Profile, lịch sử đặt sân, điểm tích lũy |
| 5 | | QR / Check-in | Quét mã khi tới sân, xác nhận có mặt |
| | **Backend** | | |
| 6 | | Module Auth | API đăng ký, đăng nhập, JWT, refresh token, middleware xác thực |
| 7 | | Module Users | API profile, cập nhật thông tin, lịch sử hoạt động |

### A2 — App: Mua hàng & Thanh toán

**Phụ trách:** App khách hàng — luồng mua hàng, thanh toán + Backend liên quan

| STT | Phần | Công việc | Mô tả |
|-----|------|-----------|-------|
| | **App** | | |
| 1 | | Xem sản phẩm | Catalog sản phẩm, chi tiết, tìm kiếm |
| 2 | | Giỏ hàng | Thêm / xóa / cập nhật số lượng |
| 3 | | Checkout & Đơn hàng | Tạo đơn, xem trạng thái, lịch sử mua hàng |
| 4 | | Thanh toán | Chọn phương thức, xác nhận thanh toán |
| 5 | | Notification | Nhắc giờ chơi, xác nhận booking, thông báo khuyến mãi |
| | **Backend** | | |
| 6 | | Module Orders | API tạo đơn, cập nhật trạng thái, lịch sử đơn hàng |
| 7 | | Module Payments | API tạo payment intent, xem trạng thái, webhook thanh toán |

---

## 4. Tổng hợp phân công

| Thành viên | Frontend | Backend |
|------------|----------|---------|
| **W1** | Web — Quản lý sân, lịch đặt, cấu hình | facilities, courts, booking |
| **W2** | Web — Quản lý bán hàng, nhân viên, báo cáo | products, inventory, reports |
| **A1** | App — Đặt sân, lịch cá nhân, tài khoản, QR | auth, users |
| **A2** | App — Mua hàng, thanh toán, notification | orders, payments |

### Nguyên tắc phối hợp

- **Web (W1 + W2)** → Admin/Staff Dashboard, quản lý và vận hành
- **App (A1 + A2)** → Customer App, trải nghiệm khách hàng
- Backend chia theo domain: mỗi người làm API cho phần mình phụ trách
- API contract (request/response) phải thống nhất trước khi code
- Review PR chéo: W1 ↔ A1 (nhóm booking), W2 ↔ A2 (nhóm commerce)

---

## 5. Rủi ro và cách giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
|--------|----------|------------|
| Trùng lịch đặt sân (double booking) | Khiếu nại khách hàng | Transaction MySQL + overlap check + Redis TTL hold |
| Web / App lệch API contract | Bug khó debug | Thống nhất contract trước, dùng shared types nếu cần |
| Hai người backend đụng migration | Conflict DB | Mỗi người prefix migration riêng, sync trước khi merge |
| Bán quá số lượng tồn kho | Sai dữ liệu | Transaction trừ kho + unique constraint |
| Thanh toán thật gây rủi ro | Pháp lý & kỹ thuật | MVP chỉ dùng sandbox / xác nhận tay |

---

## 6. Tiêu chí hoàn thành MVP

- [ ] Khách đặt được sân trên **app** (luồng hoàn chỉnh: chọn sân → đặt → xác nhận)
- [ ] Staff duyệt / hủy booking trên **web**
- [ ] Khách mua được hàng trên **app** và tồn kho giảm đúng
- [ ] Staff quản lý sản phẩm / kho / đơn hàng trên **web**
- [ ] Dashboard admin hiển thị thống kê cơ bản
- [ ] Repo có `GETTING_STARTED.md` chạy được trên máy dev trong < 30 phút
