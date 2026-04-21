# 🏗️ Kiến trúc & Cấu trúc mã nguồn (Project Structure)

Dự án này sử dụng mô hình **Monorepo**, chứa toàn bộ mã nguồn Backend, Web Admin và Mobile App trong cùng một kho lưu trữ (repository). Điều này giúp team dễ dàng đồng bộ code, chia sẻ các Interface (Kiểu dữ liệu) và quản lý phiên bản.

---

## 1. Cấu trúc Tổng thể (Monorepo)

```text
thethaovip-monorepo/
├── backend/          # API Server (Node.js, Express, Sequelize, MySQL)
├── web-admin/        # Dashboard Quản lý (React, Vite, Tailwind, AntD)
├── customer-app/     # Ứng dụng Khách hàng (React Native, Expo)
├── docs/             # Tài liệu dự án (Kiến trúc, API, Workflow)
├── shared/           # (Tùy chọn) Chứa các TS Interfaces dùng chung cho cả BE và FE
└── README.md         # Hướng dẫn khởi chạy dự án ban đầu
```

---

## 2. Cấu trúc Backend (Node.js + Express)

Backend được tổ chức theo mô hình **Layered Architecture (Kiến trúc phân lớp)** kết hợp với chuẩn thiết kế Service Pattern. Điều này giúp tách biệt rõ ràng giữa việc nhận Request và xử lý Logic.

```text
backend/
├── src/
│   ├── config/        # Cấu hình hệ thống (Kết nối DB Aiven, Cloudinary,...)
│   ├── controllers/   # Tiếp nhận Request từ FE, gọi Service và trả về Response JSON
│   ├── middlewares/   # Lớp bảo vệ (Kiểm tra Token JWT, Bắt lỗi Zod, Phân quyền)
│   ├── models/        # Khai báo cấu trúc bảng CSDL (Sequelize Models: User, Court...)
│   ├── routes/        # Định nghĩa các API endpoints (GET, POST, PUT, DELETE)
│   ├── seeders/       # Dữ liệu mầm để test (Tài khoản Admin, Danh sách sân)
│   ├── services/      # 🧠 Nơi chứa LOGIC CHÍNH (Thao tác DB, tính toán tiền, check trùng lịch)
│   └── utils/         # Các hàm tiện ích dùng chung (Mã hóa mật khẩu, Format thời gian)
├── server.ts          # Điểm khởi chạy gốc của toàn bộ Server
└── package.json
```
**Quy tắc luồng chạy Backend:** `Route` ➡️ `Middleware (Validate/Auth)` ➡️ `Controller` ➡️ `Service (Logic)` ➡️ `Model (Database)` ➡️ Trả về `Controller` ➡️ Gửi về `Frontend`.

---

## 3. Cấu trúc Frontend (Web Admin & Customer App)

Cả `web-admin` và `customer-app` đều tuân thủ chặt chẽ kiến trúc **Feature-Sliced Design (Chia theo tính năng)**. Mọi thứ liên quan đến 1 nghiệp vụ sẽ được đóng gói vào 1 thư mục riêng để chia việc dễ dàng.

```text
src/
├── app/ (hoặc routes/) # Nơi định nghĩa các đường dẫn (Router), KHÔNG chứa logic code.
├── components/         # Các UI Component dùng CHUNG (VD: CustomButton, LoadingSpinner).
├── config/             # Cấu hình môi trường, Axios instance (có gắn sẵn Token).
├── layouts/            # Cấu trúc khung trang (VD: AdminLayout chứa Sidebar + Header).
├── utils/              # Các hàm dùng chung (VD: format tiền VNĐ, xử lý ngày tháng).
│
└── features/           # 🚀 NƠI CODE CHÍNH (Từng thành viên nhận thư mục riêng)
    ├── auth/           # Login, Register, Quản lý Token
    ├── booking/        # Đặt sân, Duyệt lịch, Tính tiền (Bạn W1 / A1 code)
    ├── commerce/       # Sản phẩm, Giỏ hàng, Tồn kho (Bạn W2 / A2 code)
    └── staff/          # Quản lý nhân viên, Phân quyền
```

**Cấu trúc bên trong một `feature` (Ví dụ: `features/booking/`):**
```text
features/booking/
├── components/         # Các Component chỉ dùng cho đặt sân (VD: BookingCalendar.tsx).
├── services/           # Các hàm gọi API (Axios: getCourts, createBooking).
├── store/              # Zustand store để lưu trữ trạng thái đặt sân (State).
└── types/              # Khai báo TypeScript Interface cho đối tượng Sân, Lịch đặt.
```

---

## 4. Quy tắc Code & Làm việc nhóm ⚠️ (BẮT BUỘC ĐỌC)

1. **Nước giếng không phạm nước sông:**
   - Mỗi bạn code trong thư mục `feature` của mình. Không tự ý sửa file trong `feature` của bạn khác để tránh Merge Conflict.
2. **Không Import chéo giữa các Feature:**
   - ❌ **Sai:** `features/booking/components/BookingForm.tsx` import một hàm từ `features/commerce/services/...`
   - ✅ **Đúng:** Nếu có một logic/UI mà cả 2 feature cùng cần, hãy đưa nó ra vùng dùng chung là `src/utils/` hoặc `src/components/`.
3. **Thống nhất API Contract (Hợp đồng dữ liệu):**
   - Trước khi code FE, Team BE và FE phải chốt với nhau API trả về những trường gì (JSON format).
   - Mọi response từ API đều phải được định nghĩa Interface rõ ràng bằng TypeScript, KHÔNG dùng kiểu dữ liệu `any`.
4. **Bảo mật:**
   - Tuyệt đối không hardcode (gõ cứng) mật khẩu Database, chuỗi Secret JWT vào code. Mọi thông tin nhạy cảm phải đặt trong file `.env`.