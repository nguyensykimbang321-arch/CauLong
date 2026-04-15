# Phạm vi MVP, sprint và rủi ro

## 1. MVP — phạm vi cố định

**Trong MVP** (8–10 tuần làm mẫu nhóm 4 người):

| Hạng mục | Gồm | Không gồm (để sau) |
|----------|-----|---------------------|
| Đặt sân | 1 cơ sở, nhiều sân, 2–3 loại (CLB, tennis, sân bóng), slot cố định, giá theo khung giờ | Đa tenant phức tạp, dynamic pricing AI |
| Thanh toán | Giả lập / chuyển khoản thủ công + xác nhận tay; hoặc 1 cổng test | Đầy đủ MoMo + VNPay production |
| Bán lẻ | Danh mục, giỏ hàng, đơn, trừ kho 1 kho | Đa kho chuyển hàng liên tỉnh |
| Nhân viên | Đăng nhập, 2–3 role (admin, staff), CRUD sản phẩm/tồn tối thiểu | Phân ca chi tiết, payroll |

## 2. Kế hoạch sprint (gợi ý 4 sprint × 2 tuần)

### Sprint 1 — Nền tảng

- Khởi tạo repo, CI, môi trường dev.
- Auth cơ bản, layout, DB schema lõi (`users`, `facilities`, `courts`).
- Trang danh sách sân + lịch đọc được (chưa thanh toán).

### Sprint 2 — Booking

- API slot, chống trùng (transaction/lock).
- Luồng đặt: chọn giờ → xác nhận → trạng thái đơn booking.
- Dashboard staff: xem lịch.

### Sprint 3 — Retail + kho

- Sản phẩm, biến thể, đơn hàng, trừ tồn.
- Trang bán hàng đơn giản (có thể tách POS tối giản).

### Sprint 4 — Hoàn thiện & cứng hóa

- Báo cáo doanh thu cơ bản.
- Tăng cường phân quyền ở tầng API + middleware.
- Test E2E chính, README, demo.

## 3. Phân công 4 người (chia đều frontend + backend theo module)

| Thành viên | Module sở hữu (fullstack) | Phạm vi công việc |
|------------|----------------------------|-------------------|
| **A** | **Auth + User Profile** | React: login/register/profile; Node.js: auth API, JWT/session, refresh token, bảo mật endpoint. |
| **B** | **Booking (đặt sân)** | React: lịch sân, chọn slot, quản lý booking; Node.js: availability, hold slot, tạo/hủy booking, chống double booking. |
| **C** | **Shop + Inventory** | React: catalog, cart, order UI; Node.js: products/orders API, trừ tồn kho, inventory movement. |
| **D** | **Staff Dashboard + Reports** | React: trang nhân viên, bảng điều khiển; Node.js: API báo cáo doanh thu, quản lý đơn/sân cho staff, audit log. |

Nguyên tắc chia đều:

- Mỗi người làm **1 module end-to-end**: vừa frontend, vừa backend, vừa DB migration liên quan module đó.
- Review chéo theo cặp: A review C, B review D (luân phiên mỗi sprint).
- Mỗi sprint, ai cũng có user story React + Node.js để không lệch kỹ năng.

## 4. Rủi ro và giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
|--------|-----------|-----------|
| Double booking | Trải nghiệm kém, khiếu nại | Transaction MySQL + kiểm tra overlap + Redis TTL hold |
| Phạm vi creep (đa chi nhánh, quá nhiều rule giá) | Trễ MVP | Ghi rõ “sau MVP” trong backlog |
| Thanh toán thật | Rủi ro pháp lý & kỹ thuật | MVP: xác nhận thủ công hoặc sandbox |
| Đồng bộ tồn kho | Bán quá số lượng | Transaction một bước trừ kho + unique order line |

## 5. Tiêu chí hoàn thành MVP

- Khách đặt được sân và nhận trạng thái rõ ràng.
- Staff xem được lịch và xác nhận đơn.
- Mua được ít nhất một sản phẩm và tồn kho giảm đúng.
- Repo có `GETTING_STARTED.md` chạy được trên máy dev trong &lt; 30 phút (máy đã cài Node, Docker nếu cần).
