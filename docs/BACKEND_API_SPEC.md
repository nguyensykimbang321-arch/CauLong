# Tài liệu Đặc tả Backend API cho hệ thống đặt sân Cầu Lông

Tài liệu này mô tả các điểm cuối (endpoints) cần thiết để Backend có thể triển khai, nhằm thay thế dữ liệu giả lập (mock data) hiện tại trong ứng dụng Mobile.

## 1. Thông tin chung
- **Base URL:** `https://api.caulong.example.com/v1`
- **Định dạng dữ liệu:** JSON
- **Xác thực:** Sử dụng Bearer Token (JWT) trong header: `Authorization: Bearer <token>`
- **Đơn vị tiền tệ:** Cents (Ví dụ: 80.000 VNĐ = 80000)

## 2. Authentication & User
### 2.1. Đăng nhập
- **Endpoint:** `POST /auth/login`
- **Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": 1,
    "full_name": "Nguyễn Văn Bình",
    "email": "binh.nguyen@gmail.com",
    "role": "customer"
  }
}
```

### 2.2. Hồ sơ người dùng
- **Endpoint:** `GET /user/profile`
- **Response:** Trả về thông tin chi tiết user bao gồm `loyalty_points`.

### 2.3. Thông báo
- **Endpoint:** `GET /user/notifications`
- **Response:** Danh sách thông báo dạng:
```json
{
  "data": [
    {
      "id": 1,
      "type": "booking_confirmed",
      "title": "Đặt sân thành công!",
      "body": "Sân A1 ngày 22/04 lúc 18:00...",
      "is_read": false,
      "created_at": "2026-04-20T10:31:00Z"
    }
  ]
}
```

---

## 3. Booking & Facilities
### 3.1. Danh sách cơ sở (Facilities)
- **Endpoint:** `GET /facilities`
- **Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Sân Cầu Lông Quận 7",
      "address": "123 Nguyễn Thị Thập, Quận 7, TP.HCM",
      "open_time": "06:00",
      "close_time": "22:00",
      "avatar_url": "..."
    }
  ]
}
```

### 3.2. Kiểm tra tính khả dụng (Availability)
Đây là API quan trọng nhất để ứng dụng tự động gợi ý sân.
- **Endpoint:** `GET /facilities/:id/availability?date=YYYY-MM-DD&court_type_id=1`
- **Response:** Trả về danh sách các sân và trạng thái của từng slot 1 tiếng.
```json
{
  "courts": [
    { "id": 1, "name": "Sân A1", "status": "active" },
    { "id": 2, "name": "Sân A2", "status": "active" }
  ],
  "slots_by_court": {
    "1": [
      { "start": "06:00", "end": "07:00", "price_cents": 80000, "available": true },
      { "start": "07:00", "end": "08:00", "price_cents": 80000, "available": false }
    ],
    "2": [...]
  }
}
```

### 3.3. Tạo đơn đặt sân (Booking)
Hỗ trợ đặt nhiều slot (có thể khác sân nếu người dùng chấp nhận di chuyển).
- **Endpoint:** `POST /bookings`
- **Request:**
```json
{
  "facility_id": 1,
  "date": "2026-04-25",
  "slots": [
    { "court_id": 1, "start_at": "09:00", "end_at": "10:00" },
    { "court_id": 3, "start_at": "10:00", "end_at": "11:00" }
  ],
  "note": "Ghi chú nếu có",
  "promo_code": "GIAM20"
}
```

### 3.4. Lịch sử đặt sân
- **Endpoint:** `GET /bookings/me`
- **Response:** Trả về danh sách các booking đã đặt, kèm chi tiết các slot và trạng thái thanh toán.

---

## 4. Shop & Ecommerce
### 4.1. Danh sách sản phẩm
- **Endpoint:** `GET /products?category=racket`
- **Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Vợt Cầu Lông Yonex Astrox 88D",
      "slug": "yonex-astrox-88d",
      "thumbnail_url": "...",
      "rating": 4.8,
      "min_price": 3200000
    }
  ]
}
```

### 4.2. Chi tiết sản phẩm & Biến thể
- **Endpoint:** `GET /products/:slug`
- **Response:**
```json
{
  "id": 1,
  "name": "...",
  "description": "...",
  "variants": [
    {
      "id": 101,
      "sku": "YNX-88D-3U",
      "attributes": { "weight": "3U", "color": "Red" },
      "price_cents": 3200000,
      "stock": 5
    }
  ]
}
```

### 4.3. Đơn hàng (Orders)
- **Endpoint:** `POST /orders`
- **Request:**
```json
{
  "facility_id": 1,
  "items": [
    { "variant_id": 101, "quantity": 1 }
  ],
  "payment_method": "manual_transfer"
}
```

---

## 5. Quy tắc xử lý và Logic đặc biệt
1. **Auto-assign Court Logic:** Backend nên kế thừa logic từ `autoAssignCourt.js` để kiểm tra tính liên tục của các slot. Nếu người dùng chọn một khoảng thời gian dài, ưu tiên xếp vào cùng 1 sân.
2. **Pricing Rules:** Giá phải được backend tính toán dựa trên ngày trong tuần và khung giờ (Peak hour vs Regular hour) được định nghĩa trong bảng `price_rules`.
3. **Concurrency:** Cần xử lý lock (hoặc transaction) khi có nhiều người cùng đặt 1 slot tại cùng một thời điểm.
4. **Loyalty Points:** Mỗi đơn hàng hoặc booking hoàn tất nên cộng điểm thưởng cho người dùng (ví dụ: 1% giá trị đơn hàng).

---

## 6. Tham chiếu Database Schema
Các bảng và quan hệ chi tiết có thể xem tại: [DATABASE_SCHEMA.dbml](file:///e:/HocTap/CauLong/docs/DATABASE_SCHEMA.dbml)
