# Kiến trúc, API và luồng dữ liệu

## 1. Kiến trúc chi tiết

```
                    ┌─────────────────┐
                    │    React UI     │
                    │   (Vite SPA)    │
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   Node.js API   │
                    │ Express/Fastify │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌────────────┐  ┌──────────┐
        │  MySQL   │  │   Redis    │  │  Storage │
        │   (SQL)  │  │ (hold lock)│  │  (S3/R2) │
        └──────────┘  └────────────┘  └──────────┘

  (Optional) Worker ◄──► MQTT Broker ◄──► Thiết bị sân
```

- **Luồng chính**: trình duyệt → API Node.js → MySQL.
- **Luồng giữ chỗ**: API → SET key Redis TTL → commit booking → Xóa key.
- **Luồng IoT**: thiết bị ↔ MQTT broker; service/worker cập nhật DB hoặc chỉ dashboard vận hành.

## 2. Quy ước API

- Base: `/api/v1`
- Định dạng: JSON, UTF-8
- Lỗi: `{ "error": { "code": "...", "message": "..." } }`
- Auth: `Authorization: Bearer <JWT>` (hoặc cookie session)

## 3. Endpoint gợi ý

### 3.1 Auth & người dùng

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| GET | `/users/me` | Profile hiện tại |
| PATCH | `/users/me` | Cập nhật profile |

### 3.2 Cơ sở & sân

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/facilities` | Danh sách chi nhánh |
| GET | `/facilities/:id/courts` | Sân thuộc cơ sở |
| GET | `/court-types` | Loại sân (filter) |

### 3.3 Đặt sân (booking)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/facilities/:id/availability` | Query: `date`, `courtTypeId` → slot trống |
| POST | `/bookings/hold` | Giữ slot tạm (TTL) |
| POST | `/bookings` | Tạo booking đã xác nhận (sau hold hoặc thanh toán) |
| GET | `/bookings` | Lịch sử (user); staff có filter facility |
| PATCH | `/bookings/:id/cancel` | Hủy theo policy |
| GET | `/staff/bookings` | Danh sách theo ngày/cơ sở (role staff) |

### 3.4 Sản phẩm & đơn hàng (retail)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/products` | Phân trang, lọc category |
| GET | `/products/:slug` | Chi tiết + variants |
| POST | `/cart/validate` | Kiểm tra tồn (optional) |
| POST | `/orders` | Tạo đơn (kèm line items) |
| GET | `/orders/:id` | Chi tiết đơn |
| PATCH | `/orders/:id/status` | Staff: xác nhận / hoàn thành |

### 3.5 Kho (staff)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/warehouses/:id/inventory` | Tồn theo kho |
| POST | `/inventory/adjustments` | Điều chỉnh có lý do |

### 3.6 Báo cáo (admin)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/reports/revenue` | Query: `from`, `to`, `facilityId` |

## 4. Luồng dữ liệu — đặt sân

1. Client `GET /availability` → server đọc `booking_slots` + rule giá → trả slot.
2. Client `POST /bookings/hold` → Redis lock + record tạm (hoặc chỉ Redis).
3. Client `POST /bookings` → transaction: insert `bookings` + `booking_slots`, kiểm tra overlap, xóa hold.
4. (Tuỳ chọn) Webhook thanh toán → cập nhật `payment_status`.

## 5. Luồng dữ liệu — bán hàng

1. `GET /products` phục vụ catalog; ảnh từ object storage URL.
2. `POST /orders` trong transaction: tạo `orders`, `order_items`, trừ `inventory_levels`, ghi `inventory_movements`.

## 6. Công nghệ (tham chiếu)

React (Vite), TypeScript, Node.js (Express/Fastify), MySQL, Redis; hosting: VPS/Docker hoặc các nền tảng cloud tương thích.

---

*Cập nhật route thực tế khi code được tạo trong repo.*
