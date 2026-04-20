# Cấu trúc thư mục & hướng dẫn mở rộng

## 1. Cấu trúc đề xuất (monorepo: Web + App + Backend dùng chung)

```
CauLong/
├── docs/
├── backend/                      # Node.js API dùng chung (một server)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # A1: đăng ký, đăng nhập, JWT
│   │   │   ├── users/           # A1: profile, lịch sử
│   │   │   ├── facilities/      # W1: cơ sở, sân, loại sân
│   │   │   ├── booking/         # W1: availability, hold, booking CRUD
│   │   │   ├── products/        # W2: sản phẩm, variants, danh mục
│   │   │   ├── inventory/       # W2: tồn kho, nhập hàng
│   │   │   ├── orders/          # A2: đơn hàng, trạng thái
│   │   │   ├── payments/        # A2: thanh toán, webhook
│   │   │   └── reports/         # W2: doanh thu, thống kê
│   │   ├── middlewares/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── app.ts
│   └── package.json
├── apps/
│   ├── web/                      # React + Vite — Admin + Staff Dashboard
│   │   ├── src/
│   │   │   ├── court-management/ # W1: quản lý sân, lịch đặt, cấu hình
│   │   │   ├── commerce/        # W2: sản phẩm, kho, đơn hàng, nhân viên
│   │   │   ├── dashboard/       # W1 + W2: tổng quan, báo cáo
│   │   │   └── shared/          # Layout, auth, components dùng chung
│   │   └── package.json
│   └── mobile/                     # React Native — Customer App
│       ├── src/
│       │   ├── booking/          # A1: đặt sân, lịch, QR check-in
│       │   ├── shop/             # A2: mua hàng, giỏ, thanh toán
│       │   ├── account/          # A1: tài khoản, profile
│       │   └── shared/           # Navigation, auth, components dùng chung
│       └── package.json
├── packages/                       # (tuỳ chọn) types, API client sinh từ OpenAPI
│   └── shared-types/
├── tests/
├── docker-compose.yml              # MySQL + Redis
└── README.md
```

Tên thư mục `booking` / `commerce` phản ánh đúng domain nghiệp vụ. Xem chi tiết phân công trong `MVP_SCOPE.md`.

## 2. Nguyên tắc tổ chức code

- **Một API**, nhiều client: web và app chỉ khác UI; không fork backend.
- **Chia backend theo module riêng biệt** để 4 người ít conflict merge (xem `MVP_SCOPE.md`).
- **`apps/web`** và **`apps/mobile`**: có thể dùng chung hook pattern (React Query / tương đương) với `API_BASE_URL`.
- SQL chỉ trong `backend` (repository/service), không trong component UI.

## 3. Thêm tính năng mới

### 3.1 Thêm loại sân mới

1. Seed hoặc admin CRUD `court_types` (thuộc module **booking** + UI staff web).
2. Cập nhật filter trên **app khách** nếu hiển thị loại sân.

### 3.2 Thêm API

1. Xác định module thuộc ai phụ trách (W1/W2/A1/A2) — xem `MVP_SCOPE.md`.
2. Implement route → service → DB; cập nhật `ARCHITECTURE.md` nếu là endpoint công khai.

### 3.3 Thêm màn hình trên cả Web và App

1. Làm contract API trước (request/response).
2. Implement song song: một PR backend (nếu cần) + hai PR front (web + app) hoặc gộp theo feature flag nhỏ.

## 4. Biến môi trường (ví dụ)

- **Backend**: `MYSQL_URL`, `REDIS_URL`, `JWT_SECRET`, `API_PORT`
- **Web**: `VITE_API_BASE_URL`
- **App**: `EXPO_PUBLIC_API_BASE_URL` hoặc tương đương (Expo)

---

*Giữ naming feature giống nhau giữa web và app (ví dụ `BookingListScreen` / `BookingListPage`) để đồng đội khi review.*
