# 🏗️ Kiến trúc & Cấu trúc mã nguồn (Project Structure)

Dự án này sử dụng mô hình **Monorepo**, chứa cả Backend, Web Admin và Mobile App trong cùng một kho lưu trữ (repository) để dễ dàng đồng bộ code và quản lý phiên bản.

## 1. Cấu trúc Tổng thể (Monorepo)

```text
thethaovip-monorepo/
├── backend/          # API Server (Node.js, Express, Sequelize, MySQL)
├── web-admin/        # Dashboard Quản lý (React, Vite, Tailwind, AntD)
├── customer-app/     # Ứng dụng Khách hàng (React Native, Expo)
├── docs/             # Tài liệu dự án
└── README.md         # Hướng dẫn chạy dự án ban đầu
```

---

## 2. Quy tắc Tổ chức Thư mục Frontend (Web & App)

Cả `web-admin` và `customer-app` đều tuân thủ chặt chẽ kiến trúc **Feature-Sliced Design (Chia theo tính năng)**. 

Thay vì gom tất cả API vào một chỗ, tất cả Component vào một chỗ, chúng ta sẽ **gom mọi thứ liên quan đến 1 nghiệp vụ vào 1 thư mục riêng biệt**.

### Cấu trúc chi tiết bên trong `src/`:

```text
src/
├── app/ (hoặc routes/) # Nơi định nghĩa các đường dẫn (Router), KHÔNG chứa logic code ở đây.
├── components/         # Các UI dùng CHUNG toàn dự án (VD: Nút bấm chuẩn, Popup thông báo).
├── config/             # Cấu hình môi trường, Axios instance.
├── utils/              # Các hàm dùng chung (VD: format tiền tệ, format ngày tháng).
├── types/              # Các Interface dùng chung.
│
└── features/           # 🚀 NƠI CODE CHÍNH (Chiếm 90% thời gian code)
    ├── auth/           # VD: Nghiệp vụ Đăng nhập/Phân quyền
    ├── booking/        # VD: Nghiệp vụ Đặt sân (Bạn W1 / A1 code ở đây)
    ├── commerce/       # VD: Nghiệp vụ Mua hàng (Bạn W2 / A2 code ở đây)
    └── ...
```

### Cấu trúc bên trong một `feature`:
Bất kỳ một thư mục nghiệp vụ nào (VD: `features/booking/`) cũng sẽ có cấu trúc như sau:

```text
features/booking/
├── components/         # Các UI chỉ phục vụ cho việc đặt sân (VD: BookingCalendar.tsx).
├── services/           # Chứa các hàm Axios gọi API liên quan đến đặt sân.
├── store/              # Chứa Zustand store để quản lý state (nếu cần).
└── types/              # Khai báo TypeScript interface riêng cho đặt sân.
```

---

## 3. Quy tắc Code (Luật của Team) - ⚠️ BẮT BUỘC ĐỌC

1. **Nước giếng không phạm nước sông:** Code của ai làm ở feature người đó. Hạn chế tối đa việc chỉnh sửa code trong feature của người khác để tránh Merge Conflict.
2. **Không import chéo giữa các Feature:**
   - ❌ Sai: `features/booking/components/BookingForm.tsx` import một hàm từ `features/commerce/services/api.ts`.
   - ✅ Đúng: Nếu có một hàm/UI mà cả 2 feature cùng cần, hãy chuyển nó ra thư mục `src/utils/` hoặc `src/components/` (vùng dùng chung).
3. **Luôn dùng TypeScript Interface:**
   - Không dùng `any`. Mọi response từ API đều phải được định nghĩa Interface rõ ràng trong folder `types/`.