# 🏸 Hướng Dẫn Kiểm Thử (Test) API Quản Lý Tài Khoản & Nhân Sự

Tài liệu này cung cấp hướng dẫn chi tiết để kiểm thử các API bằng các công cụ như Postman hoặc Thunder Client. Các API này đã được chuẩn hóa Response và tích hợp cơ chế bắt lỗi tập trung.

---

## 1. API Lấy Danh Sách Tài Khoản (GET All Users)

API này dùng để lấy toàn bộ danh sách người dùng trong hệ thống. Dữ liệu trả về đã được tự động ẩn đi cột `password_hash` để đảm bảo bảo mật. Các tài khoản đã bị xóa (Soft Delete) cũng sẽ được tự động bỏ qua.

* **Method:** `GET`
* **Endpoint:** `/admin/users/`
* **Body:** Không có.

---

## 2. API Khóa/Mở Khóa Tài Khoản (Toggle Status)

API này gộp chung tính năng khóa và mở khóa thành một. Nó sẽ tự động kiểm tra trạng thái `is_active` hiện tại của tài khoản và đảo ngược nó (`true` thành `false` và ngược lại).

* **Method:** `PATCH`
* **Endpoint:** `/admin/users/:id/toggle-status` 
(Thay `:id` bằng ID thực tế của user, VD: `/users/1/toggle-status`).
* **Body:** Không có.

**✅ Kết quả mong đợi (Thành công - 200 OK):**
Lưu ý: Thông báo trả về sẽ tự động thay đổi thành "Đã mở khóa tài khoản thành công" hoặc "Đã khóa tài khoản thành công" tùy thuộc vào trạng thái mới.

---

## 3. API Tạo Tài Khoản Nhân Viên (Create Staff)

Đây là API phức tạp nhất, sử dụng Transaction để lưu dữ liệu đồng thời vào 2 bảng `users` và `staff_profiles`. Dữ liệu đầu vào sẽ đi qua lưới lọc Zod Validation trước khi tới Controller. Mật khẩu sẽ được tự động mã hóa (hash).

* **Method:** `POST`
* **Endpoint:** `/admin/users/staff`
* **Body (raw -> JSON):**
```json
{
  "email": "staff.nguyenvan@thethaovip.local",
  "password": "Password123!",
  "full_name": "Nguyễn Văn Staff",
  "phone": "0987654321",
  "facility_id": 1
}
```