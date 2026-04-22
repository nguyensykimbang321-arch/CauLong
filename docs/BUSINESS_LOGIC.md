# 📋 Tài liệu Nghiệp vụ Hệ thống (Business Logic & Roles) - MVP Phase

Tài liệu này mô tả chi tiết quyền hạn của từng nhóm người dùng (Roles) và các luồng nghiệp vụ cốt lõi trong hệ thống Quản lý Sân Thể Thao kết hợp Bán lẻ.

---

## 1. Định nghĩa Vai trò (Roles)

Hệ thống MVP chỉ duy trì 3 phân quyền (Role) để tối ưu thời gian phát triển và vận hành:

1. **`admin` (Chủ hệ thống / Quản lý cấp cao):** Người có toàn quyền thiết lập hệ thống, xem báo cáo doanh thu và quản lý nhân sự. Thao tác chủ yếu trên **Web Admin**.
2. **`staff` (Nhân viên vận hành / Lễ tân):** Người trực tiếp làm việc tại sân, xử lý check-in cho khách và bán hàng tại quầy. Thao tác chủ yếu trên **Web Admin**.
3. **`customer` (Khách hàng):** Người sử dụng dịch vụ đặt sân và mua hàng. Thao tác độc quyền trên **Mobile App**.

---

## 2. Ma trận Phân quyền (Permission Matrix)

Bảng dưới đây quy định rõ ai được phép làm gì trên hệ thống Web Admin.

| Nhóm Tính Năng | Thao tác | `admin` | `staff` |
| :--- | :--- | :---: | :---: |
| **Cơ sở & Sân** | Xem danh sách / Xem lịch | ✅ | ✅ |
| *(W1 phụ trách)* | Thêm / Sửa / Xóa (Ẩn) Cơ sở & Sân | ✅ | ❌ |
| | Cấu hình giá tiền theo khung giờ | ✅ | ❌ |
| **Lịch đặt (Booking)** | Tạo lịch đặt mới (giúp khách gọi hotline) | ✅ | ✅ |
| *(W1 phụ trách)* | Check-in khách đến sân | ✅ | ✅ |
| | Hủy lịch / Hoàn tiền | ✅ | ❌ (Chỉ được báo cáo) |
| **Hàng hóa & Kho** | Xem danh sách sản phẩm & Tồn kho | ✅ | ✅ |
| *(W2 phụ trách)* | Thêm / Sửa / Xóa Sản phẩm | ✅ | ❌ |
| | Nhập kho (Tăng số lượng tồn) | ✅ | ❌ |
| **Bán hàng (POS / Đơn)** | Tạo đơn bán lẻ tại quầy & Thu tiền | ✅ | ✅ |
| *(W2 phụ trách)* | Cập nhật trạng thái đơn Online của khách | ✅ | ✅ |
| **Nhân sự & Báo cáo** | Tạo tài khoản Staff mới / Khóa tài khoản | ✅ | ❌ |
| *(W2 phụ trách)* | Xem báo cáo Tổng doanh thu | ✅ | ❌ |
| | Xem doanh thu theo Ca trực của mình | ✅ | ✅ |

---

## 3. Luồng Nghiệp vụ Cốt lõi (Core Business Flows)

Để tránh hệ thống bị quá tải logic, luồng Đặt Sân và Mua Hàng được tách biệt hoàn toàn.

### 3.1 Luồng Đặt Sân (Khách hàng làm chủ) - Phối hợp A1 & W1
1. **Khách hàng (A1):** Mở App ➡️ Chọn Cơ sở ➡️ Chọn Ngày ➡️ Hệ thống hiển thị các Sân và Khung giờ CÒN TRỐNG.
2. **Khách hàng (A1):** Chọn khung giờ ➡️ Bấm "Đặt sân". Hệ thống tạm khóa (Hold) slot đó trong 5-10 phút để chờ thanh toán.
3. **Thanh toán:** Khách chuyển khoản (giả lập) ➡️ Trạng thái Booking đổi thành `CONFIRMED` (Đã xác nhận).
4. **Đến sân (W1):** Tới giờ đá/đánh cầu, khách đến quầy đọc SĐT. Lễ tân (Staff) trên Web Admin tìm Booking ➡️ Bấm `CHECK-IN`. Sân chuyển trạng thái đang sử dụng.

### 3.2 Luồng Bán hàng Tại quầy (Offline POS) - W2 phụ trách
*(Dành cho khách đến sân khát nước hoặc mua thêm cầu)*
1. Khách hàng ra quầy yêu cầu mua 2 chai nước và 1 ống cầu.
2. **Lễ tân (Staff):** Mở Web Admin (Tab POS Bán hàng) ➡️ Chọn sản phẩm ➡️ Nhập số lượng.
3. **Thanh toán:** Lễ tân thu tiền mặt/chuyển khoản ➡️ Bấm "Hoàn tất đơn".
4. **Hệ thống (W2 API):** Tự động trừ số lượng nước và cầu trong Bảng Tồn kho (Inventory). Lưu lịch sử Đơn hàng (Order).

### 3.3 Luồng Bán hàng Online (In-App Purchases) - Phối hợp A2 & W2
*(Dành cho khách muốn đặt mua đồ trước qua App, đến sân chỉ việc lấy)*
1. **Khách hàng (A2):** Mở App ➡️ Vào tab Cửa hàng ➡️ Thêm hàng vào Giỏ ➡️ Bấm "Đặt hàng".
2. **Hệ thống:** Tạo Order với trạng thái `PENDING` (Chờ xử lý). Tạm trừ tồn kho để tránh khách khác mua mất.
3. **Tại sân (W2):** Lễ tân thấy có Đơn Online mới trên màn hình Web Admin ➡️ Gom đồ sẵn ra túi.
4. **Nhận hàng:** Khách đến sân lấy đồ ➡️ Lễ tân bấm chuyển trạng thái đơn thành `COMPLETED` (Hoàn thành).

---

## 4. Chi tiết Dữ liệu cần có (Database Entities)

Để phục vụ các luồng trên, hệ thống cần các trạng thái (Status) chuẩn như sau:

* **Trạng thái Lịch đặt (Booking Status):**
    * `PENDING`: Đang giữ chỗ chờ thanh toán (Sau 10p không trả tiền -> Tự hủy).
    * `CONFIRMED`: Đã thanh toán, giữ sân thành công.
    * `CHECKED_IN`: Khách đang chơi trên sân.
    * `CANCELLED`: Lịch đã bị hủy.
* **Trạng thái Đơn hàng (Order Status):**
    * `PENDING`: Khách vừa đặt online, chưa xử lý.
    * `PROCESSING`: Lễ tân đang gom hàng / chờ khách đến lấy.
    * `COMPLETED`: Khách đã nhận hàng và thanh toán đủ.
    * `CANCELLED`: Hết hàng hoặc khách không nhận.