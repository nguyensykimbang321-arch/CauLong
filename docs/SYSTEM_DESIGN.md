# Thiết kế hệ thống

## 1. Kiến trúc tổng quan

```
[Trình duyệt (React SPA)]
        │
        ▼
[Nginx / Reverse proxy (HTTPS)]
        │
        ├── React App (Vite build)
        │
        └── Node.js API (Express/Fastify)
               │
               ├── MySQL 8 (nguồn dữ liệu chính)
               ├── Redis (cache, khóa slot đặt sân)
               └── Object storage (ảnh sản phẩm, hóa đơn)

  (Tùy chọn) MQTT Broker ◄── Thiết bị IoT tại sân
```

- **Lớp giao diện**: React SPA cho khách và dashboard nhân viên.
- **Lớp dịch vụ**: Node.js API (`/api/v1/...`), xác thực JWT hoặc session.
- **Lớp dữ liệu**: MySQL là nguồn sự thật; Redis hỗ trợ khóa ngắn hạn khi giữ chỗ.
- **Tích hợp**: cổng thanh toán, gửi email/SMS/Zalo (theo giai đoạn).

## 2. Giao thức & kênh giao tiếp

| Kênh | Mục đích |
|------|-----------|
| **HTTPS / REST (JSON)** | CRUD đặt sân, sản phẩm, đơn hàng, đăng nhập. |
| **WebSocket hoặc SSE** (tùy chọn) | Cập nhật lịch sân realtime trên màn hình lễ tân. |
| **MQTT** | Thiết bị tại sân: đèn, khóa, cảm biến chiếm sân; nhận **lệnh** (bật đèn) và gửi **telemetry** (trạng thái cửa). Không thay thế API chính cho nghiệp vụ booking. |

### 2.1 MQTT — vai trò và nguyên tắc

- **Broker**: Mosquitto hoặc EMQX (self-host) hoặc dịch vụ cloud tương thích MQTT 3.1.1/5.0.
- **Topic gợi ý** (chuẩn hóa theo `facilityId` / `courtId`):
  - `facilities/{facilityId}/courts/{courtId}/status` — payload JSON: `{ "occupied": true, "ts": "..." }`
  - `facilities/{facilityId}/commands/court/{courtId}` — ví dụ bật đèn (chỉ server/backend publish, thiết bị subscribe).
- **Bảo mật**: TLS, username/password hoặc chứng chỉ client; ACL theo topic; backend là thành phần duy nhất bridge MQTT ↔ DB nếu cần đồng bộ trạng thái.

Luồng tích hợp tương lai: thiết bị gửi sự kiện → worker consume → cập nhật bảng `court_sessions` hoặc cảnh báo “quá giờ”.

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
| Frontend | React + Vite + TypeScript |
| Backend API | Node.js (Express hoặc Fastify), TypeScript |
| ORM/Query | Drizzle ORM hoặc Knex/TypeORM |
| DB | MySQL 8+ |
| Cache / lock | Redis |
| Auth | JWT hoặc Session + cookie HTTP-only |
| MQTT | EMQX / Mosquitto (khi bật module IoT) |

## 5. An toàn & tuân thủ

- Phân quyền RBAC; audit log cho thao tác nhạy cảm (đổi giá, hủy đơn).
- Rate limit API đăng nhập và đặt sân.
- PII (SĐT, email) chỉ hiển thị theo role.

---

*Chi tiết API: `ARCHITECTURE.md`. Chi tiết bảng: `DATA_MODEL.md`.*
