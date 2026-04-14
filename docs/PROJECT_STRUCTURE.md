# Cấu trúc thư mục & hướng dẫn mở rộng

## 1. Cấu trúc đề xuất (monorepo đơn giản)

```
CauLong/
├── docs/                    # Tài liệu dự án (file bạn đang đọc)
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── shop/
│   │   │   └── staff/
│   │   ├── middlewares/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── app.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── shop/
│   │   │   └── staff/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── main.tsx
│   └── package.json
├── tests/
│   ├── e2e/
│   └── unit/
├── docker-compose.yml       # MySQL + Redis (+ optional mqtt)
└── README.md
```

## 2. Nguyên tắc tổ chức code

- Tổ chức theo **module fullstack**: mỗi module có phần frontend và backend tương ứng.
- **`backend/src/modules/*`**: controller/service/repository theo domain.
- **`frontend/src/modules/*`**: page, UI, state cho cùng domain.
- SQL truy cập qua tầng repository/service, không gọi trực tiếp trong route/UI.

## 3. Thêm tính năng mới

### 3.1 Thêm loại sân mới

1. Seed hoặc admin CRUD `court_types`.
2. Không đổi schema nếu chỉ là bản ghi mới; cập nhật filter UI và `price_rules` nếu giá khác.

### 3.2 Thêm API

1. Định nghĩa schema request/response ở `backend/src/modules/<module>/`.
2. Implement route handler → gọi service.
3. Thêm test và mục trong `ARCHITECTURE.md`.

### 3.3 Thêm trang staff

1. Tạo route trong `frontend/src/modules/staff/`.
2. Bảo vệ route bằng middleware (kiểm tra session + role).
3. Tái sử dụng component từ `components/booking` nếu được.

### 3.4 Tích hợp MQTT (sau MVP)

1. Thêm worker hoặc API bridge subscribe topic.
2. Map `court.external_id` ↔ device id.
3. Không expose broker ra client trình duyệt.

## 4. Biến môi trường (ví dụ)

- `MYSQL_URL`, `REDIS_URL`, `JWT_SECRET`
- `MQTT_URL` (khi bật)

---

*Ưu tiên giữ naming module giống nhau giữa frontend và backend để dễ chia việc theo người.*
