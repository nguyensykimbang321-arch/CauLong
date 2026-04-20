# Thiết kế hệ thống

## 1. Kiến trúc tổng quan

```
[Trình duyệt — Web React (Vite)]
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
[Nginx / Reverse proxy (HTTPS)]   [App React Native]
        │                              │
        └──────────────┬───────────────┘
                       ▼
              Node.js API (Express/Fastify) — dùng chung
                       │
                       ├── MySQL 8
                       ├── Redis (cache, khóa slot đặt sân)
                       └── Object storage (ảnh sản phẩm, hóa đơn)
```

- **Lớp giao diện**: **Web** (React) cho luồng màn hình lớn / vận hành; **App** (React Native) cho luồng di động; cùng gọi một **REST API** phiên bản hóa (`/api/v1`).
- **Lớp dịch vụ**: Node.js API (`/api/v1/...`), xác thực JWT hoặc session.
- **Lớp dữ liệu**: MySQL là nguồn sự thật; Redis hỗ trợ khóa ngắn hạn khi giữ chỗ.
- **Tích hợp**: cổng thanh toán, gửi email/SMS/Zalo (theo giai đoạn).

## 2. Giao thức & kênh giao tiếp

| Kênh | Mục đích |
|------|-----------|
| **HTTPS / REST (JSON)** | Web và app đều dùng; CRUD đặt sân, sản phẩm, đơn hàng, đăng nhập. |
| **WebSocket hoặc SSE** (tùy chọn) | Cập nhật lịch sân realtime (ưu tiên web staff). |

## 2.1 Phân ranh giới Web vs App (gợi ý MVP)

| Kênh | Ưu tiên phần nghiệp vụ |
|------|-------------------------|
| **Web (React)** | Trang **khách** đặt sân trên trình duyệt; **Staff/Admin**: bảng lịch tổng, xác nhận/hủy booking, cấu hình slot, báo cáo, quản lý kho/sản phẩm (màn hình rộng). |
| **App (React Native)** | **Khách di động**: đặt sân nhanh, lịch của tôi, thông báo (sau MVP); **shop** trên điện thoại (xem sản phẩm, giỏ, đơn). Staff có thể chỉ xem nhanh lịch (tùy nhóm) — MVP có thể bỏ qua app staff. |

## 3. Luồng nghiệp vụ chính

### 3.1 Đặt sân

1. Client gọi API lấy slot khả dụng theo `facility`, `court_type`, ngày.
2. Người dùng chọn slot → server tạo **hold** ngắn (Redis TTL 5–15 phút) hoặc transaction DB với khóa hàng.
3. Thanh toán (hoặc đặt cọc) → xác nhận booking `confirmed`.
4. Hủy/đổi theo rule engine đọc từ cấu hình cơ sở.

### 3.2 Bán lẻ

1. Thêm vào giỏ → tạo `order` (pending).
2. Thanh toán → trừ tồn kho (transaction), ghi `inventory_movement`.
3. Đối soát với POS tại quầy nếu có (cùng API).

## 4. Công nghệ đề xuất (tham chiếu `GETTING_STARTED.md`)

| Thành phần | Gợi ý |
|------------|--------|
| Web | React + Vite + TypeScript |
| App | React Native + TypeScript (Expo hoặc CLI) |
| Backend API | Node.js (Express hoặc Fastify), TypeScript |
| ORM/Query | Drizzle ORM hoặc Knex/TypeORM |
| DB | MySQL 8+ |
| Cache / lock | Redis |
| Auth | JWT Bearer (web + app); web có thể thêm refresh cookie nếu cần |

## 5. An toàn & tuân thủ

- Phân quyền RBAC; audit log cho thao tác nhạy cảm (đổi giá, hủy đơn).
- Rate limit API đăng nhập và đặt sân.
- PII (SĐT, email) chỉ hiển thị theo role.

---

*Chi tiết API: `ARCHITECTURE.md`. Chi tiết bảng: `DATA_MODEL.md`.*
