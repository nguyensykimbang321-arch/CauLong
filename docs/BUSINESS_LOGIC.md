# 📋 TÀI LIỆU QUY HOẠCH NGHIỆP VỤ & PHÂN CHIA TRÁCH NHIỆM (MVP PHASE)

Tài liệu này định nghĩa ranh giới công việc, quyền sở hữu Database và các luồng nghiệp vụ cốt lõi của dự án Quản lý Sân Thể Thao kết hợp Bán lẻ. 
**⚠️ QUY TẮC TỐI THƯỢNG:** Không ai được phép dùng `sequelize.sync({ force: true })` trên Database chung. Bảng của ai người nấy quản lý, cấm tự ý thay đổi cấu trúc bảng của người khác!

---

## 1. PHÂN CHIA TRÁCH NHIỆM DEV THEO DOMAIN

Hệ thống được chia làm 2 Domain lớn, mỗi Domain do 1 cặp (Web + App) phụ trách.

### 🔴 DOMAIN 1: QUẢN LÝ SÂN & ĐẶT LỊCH (Booking & Facility)
**W1 (Web Admin Backend/Frontend) & A1 (Mobile App Frontend)** phối hợp thực hiện.

#### Trách nhiệm của W1 (Nắm trùm Backend Đặt sân):
*   **Sở hữu các bảng (DB):** `facilities`, `courts`, `price_configs` (Cấm W2 đụng vào), `bookings`, `booking_slots`.
*   **Nhiệm vụ Web Admin:**
    *   Quản lý danh sách Cơ sở & Sân (Thêm/Sửa/Xóa).
    *   Quản lý Cấu hình Giá (`price_configs` theo giờ và loại sân).
    *   Màn hình Lễ tân: Xem lịch đặt, Check-in khách, Tạo lịch đặt mới (Hotline).
    *   Dashboard Thống kê: Doanh thu tiền sân, Số lượng booking, Tỷ lệ lấp đầy.
*   **Nhiệm vụ API:** Cung cấp API lấy danh sách sân trống, tính tiền, tạo lịch đặt cho A1 gọi.

#### Trách nhiệm của A1 (Giao diện App Đặt sân):
*   Làm việc trực tiếp với API của W1.
*   Thiết kế luồng tìm kiếm sân (chọn cơ sở, ngày, môn thể thao).
*   Thiết kế giao diện chọn giờ (block 30 phút), hiển thị tiền sân.
*   Xử lý luồng thanh toán / xác nhận đặt sân.
*   Màn hình "Lịch đặt của tôi" cho khách hàng.

---

### 🔵 DOMAIN 2: E-COMMERCE, KHO HÀNG & NHÂN SỰ (Retail & Ops)
**W2 (Web Admin Backend/Frontend) & A2 (Mobile App Frontend)** phối hợp thực hiện.

#### Trách nhiệm của W2 (Nắm trùm Backend Bán lẻ & Hệ thống):
*   **Sở hữu các bảng (DB):** `users` (Khách & Staff), `products`, `categories`, `inventory_levels` (Tồn kho), `orders`, `order_items`.
*   **Nhiệm vụ Web Admin:**
    *   Quản lý Tài khoản (Xác thực Auth, Cấp quyền Admin/Staff).
    *   Quản lý Sản phẩm (Nước, Cầu...) và Nhập kho.
    *   Giao diện POS Bán hàng tại quầy cho Lễ tân.
    *   Màn hình quản lý Đơn hàng Online (Từ App đổ về).
    *   Dashboard Thống kê: Doanh thu bán lẻ, Hàng tồn kho.
*   **Nhiệm vụ API:** Cung cấp API cửa hàng, giỏ hàng, đặt đơn, Auth cho A2 gọi.

#### Trách nhiệm của A2 (Giao diện App Bán lẻ & User):
*   Làm việc trực tiếp với API của W2.
*   Màn hình Đăng nhập / Đăng ký / Hồ sơ cá nhân.
*   Thiết kế luồng Cửa hàng (Xem sản phẩm, tìm kiếm).
*   Quản lý Giỏ hàng và luồng Đặt mua Online (In-App Purchases).
*   Màn hình "Đơn hàng của tôi".

---

## 2. QUYYỀN HẠN CỦA VAI TRÒ (Role Permissions)

Hệ thống chỉ có 3 Role, áp dụng cho toàn bộ API và UI:

| Nhóm Tính Năng | Thao tác | `admin` (Web) | `staff` (Web) | `customer` (App) |
| :--- | :--- | :---: | :---: | :---: |
| **Hệ thống** | Tạo/Khóa tài khoản Staff | ✅ | ❌ | ❌ |
| **Sân & Giá (W1)** | Cấu hình Sân & Bảng Giá | ✅ | ❌ | ❌ |
| | Tìm kiếm sân trống | ✅ | ✅ | ✅ |
| **Booking (W1)** | Đặt sân (Hotline / App) | ✅ | ✅ | ✅ |
| | Check-in / Hủy lịch | ✅ | ✅ | ❌ (Chỉ xem) |
| **Kho & POS (W2)**| Quản lý SP / Nhập kho | ✅ | ❌ | ❌ |
| | Bán POS / Xử lý đơn Online | ✅ | ✅ | ❌ |
| **Cửa hàng (A2)** | Xem hàng / Đặt mua | ❌ | ❌ | ✅ |
| **Báo cáo** | Xem tất cả Doanh thu | ✅ | ❌ | ❌ |
| | Xem doanh thu ca trực | ✅ | ✅ | ❌ |

---

## 3. LUỒNG NGHIỆP VỤ CỐT LÕI (Core Business Flows)

### 3.1 Luồng Đặt Sân (A1 + W1)
1. **[A1] Khách hàng:** Chọn Môn -> Chọn Cơ sở -> Chọn Ngày. 
2. **[A1] Khách hàng:** Gọi API của W1 để lấy danh sách sân trống và giá tiền.
3. **[A1] Khách hàng:** Chọn giờ, bấm Đặt Sân.
4. **[W1] Backend:** Ràng buộc luật chống lủng giờ (Smart Gap) -> Tạo Booking trạng thái `PENDING`.
5. **[W1] Lễ tân (Web):** Khách đến sân, Lễ tân tìm Booking, bấm `CHECK-IN` -> Sân chuyển trạng thái đang dùng.

### 3.2 Luồng Bán hàng Tại quầy - POS (W2)
1. **[W2] Lễ tân (Web):** Mở tab POS, chọn 2 chai nước, 1 ống cầu.
2. **[W2] Backend:** Kiểm tra tồn kho trong `inventory_levels`. Nếu đủ, cho phép thanh toán.
3. **[W2] Lễ tân (Web):** Thu tiền mặt, bấm Hoàn tất.
4. **[W2] Backend:** Trừ tồn kho, lưu Log đơn hàng trạng thái `COMPLETED`.

### 3.3 Luồng Bán hàng Online (A2 + W2)
1. **[A2] Khách hàng:** Lên App mua 1 bộ quần áo, thanh toán online.
2. **[W2] Backend:** Tạo Order trạng thái `PENDING`, tạm trừ tồn kho.
3. **[W2] Lễ tân (Web):** Nhận thông báo có đơn mới, chuẩn bị đồ sẵn ở quầy, chuyển trạng thái `PROCESSING`.
4. **[W2] Lễ tân (Web):** Khách tới lấy đồ, Lễ tân bấm `COMPLETED`.

---

## 4. QUY CHUẨN TRẠNG THÁI (Status Enums)

Bắt buộc sử dụng các chuỗi (String) chuẩn sau trong Database và API:

*   **Booking Status (W1):**
    *   `pending`: Đang chờ thanh toán/xác nhận.
    *   `confirmed`: Đã chốt lịch.
    *   `checked_in`: Khách đang chơi trên sân.
    *   `cancelled`: Đã hủy.
*   **Order Status (W2):**
    *   `pending`: Vừa đặt xong.
    *   `processing`: Đang chuẩn bị hàng.
    *   `completed`: Đã giao hàng & thu tiền.
    *   `cancelled`: Hủy đơn (Trả lại tồn kho).
