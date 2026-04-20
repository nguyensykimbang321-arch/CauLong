# Bắt đầu — cài đặt và chạy dự án

## 1. Stack công nghệ (đề xuất)

| Lớp | Công nghệ |
|-----|-----------|
| Ngôn ngữ | TypeScript |
| Web | React + Vite |
| App | React Native (Expo hoặc CLI) |
| Backend | Node.js + Express/Fastify (API dùng chung cho web + app) |
| ORM/Query | Drizzle / Knex / TypeORM (chọn 1) |
| CSDL | MySQL 8+ |
| Cache / khóa | Redis 7+ |
| Auth | JWT hoặc Session |
| Package manager | pnpm (khuyến nghị) hoặc npm |

## 2. Yêu cầu môi trường

- **Node.js** 20 LTS trở lên
- **Docker Desktop** (để chạy MySQL + Redis local) — khuyến nghị
- **App**: Android Studio (Android) và/hoặc Xcode (iOS) nếu build native; với Expo có thể dùng Expo Go
- Git

## 3. Cài đặt nhanh (sau khi có code trong repo)

```bash
git clone <url-repo>
cd CauLong
pnpm install
```

Sao chép file môi trường:

```bash
copy .env.example .env
```

Chỉnh `MYSQL_URL`, `REDIS_URL` khớp Docker Compose.

Khởi động dịch vụ nền:

```bash
docker compose up -d
```

Tạo schema & seed (ví dụ khi dùng ORM migration):

```bash
pnpm --filter backend migrate
pnpm --filter backend seed
```

Chạy dev server:

```bash
pnpm dev
```

Mở **web**: `http://localhost:5173` (hoặc cổng cấu hình). Chạy **app** theo hướng dẫn trong `apps/mobile` (ví dụ `pnpm --filter mobile start` hoặc `npx expo start`).

## 4. Biến môi trường thường gặp

| Biến | Ý nghĩa |
|------|---------|
| `MYSQL_URL` | Chuỗi kết nối MySQL |
| `REDIS_URL` | Chuỗi kết nối Redis |
| `JWT_SECRET` | Ký access token |
| `API_PORT` | Cổng backend Node.js |
| `VITE_API_BASE_URL` | Web trỏ tới API (vd `http://localhost:4000/api/v1`) |
| `EXPO_PUBLIC_API_BASE_URL` | App (Expo) trỏ tới API; máy thật dùng IP LAN thay `localhost` |

## 5. Lệnh hữu ích

| Lệnh | Mô tả |
|------|--------|
| `pnpm lint` | ESLint |
| `pnpm test` | Unit test |
| `pnpm build` | Build production |

## 6. Khi chưa có mã nguồn ứng dụng

Thư mục `docs/` mô tả kiến trúc mục tiêu. Bước tiếp theo: khởi tạo `apps/web` (React + Vite), `apps/mobile` (React Native), `backend` (Node.js), cấu hình MySQL + Redis theo `PROJECT_STRUCTURE.md`.

---

*Nếu gặp lỗi cổng frontend bận, đổi cổng trong cấu hình Vite (ví dụ 5174).*
