# Quy trình Git: push, PR, commit

## 1. Nhánh (branching)

| Nhánh | Mục đích |
|-------|-----------|
| `main` | Luôn deploy được; chỉ merge qua PR đã review. |
| `develop` | (Tùy chọn) Tích hợp tính năng hàng ngày. |
| `feature/<tên-ngắn>` | Một tính năng / ticket, ví dụ `feature/booking-hold`. |
| `fix/<tên>` | Sửa lỗi production hoặc blocking. |

- Tên nhánh: chữ thường, gạch ngang; tránh tiếng Việt có dấu trong tên nhánh.

## 2. Quy tắc push & Pull Request

1. **Không push trực tiếp** lên `main` (trừ maintainer trong trường hợp hotfix có quy trình riêng).
2. Mỗi PR **nhỏ, review được** (ưu tiên &lt; 400 dòng diff nếu có thể).
3. PR phải có:
   - Mô tả: **làm gì**, **vì sao**, **cách test**.
   - Link issue/ticket (nếu có).
   - Ảnh chụp màn hình nếu thay đổi UI.
4. **Ít nhất 1 approve** (nhóm 4 người: luân phiên review để cả nhóm hiểu code).
5. CI (lint + test) **xanh** mới merge.
6. Dùng **Squash merge** hoặc **Merge commit** thống nhất trong team; tránh rebase nhánh dùng chung sau khi đã push công khai trừ khi cả nhóm đồng ý.

## 3. Quy ước commit message (Conventional Commits)

Cấu trúc:

```
<type>(<scope>): <mô tả ngắn tiếng Việt hoặc English thống nhất>

[optional body]
```

**type**:

- `feat`: tính năng mới
- `fix`: sửa lỗi
- `docs`: chỉ tài liệu
- `style`: format, không đổi logic
- `refactor`: tái cấu trúc
- `test`: thêm/sửa test
- `chore`: công cụ, dependency

**Ví dụ**:

```
feat(booking): thêm API giữ chỗ slot 10 phút
fix(shop): trừ tồn kho đúng kho khi đặt tại quầy
docs: cập nhật DATA_MODEL cho inventory_movements
```

## 4. Trước khi mở PR

- `pnpm lint` / `npm run lint` (hoặc tương đương).
- Chạy test liên quan.
- Cập nhật `docs/` nếu thay đổi hợp đồng API hoặc schema.

## 5. Xử lý xung đột (merge conflict)

- Pull `main` (hoặc `develop`) mới nhất vào nhánh feature.
- Giải quyết conflict locally; không merge PR “vừa đủ” — đảm bảo build chạy sau khi resolve.

---

*Thống nhất một ngôn ngữ trong message (VN hoặc EN) cho cả nhóm.*
