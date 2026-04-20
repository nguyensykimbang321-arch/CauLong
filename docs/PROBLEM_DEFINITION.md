# Định nghĩa bài toán

## 1. Tổng quan

Xây dựng **nền tảng gồm web và ứng dụng di động** (cùng một backend Node.js) phục vụ các cơ sở thể thao (cầu lông, tennis, bóng đá, pickleball, v.v.) cho phép:

- **Đặt sân / thuê sân** theo khung giờ, loại sân, chi nhánh.
- **Bán lẻ** thiết bị và phụ kiện (vợt, cầu/bóng, giày, quần áo, băng keo, túi đựng, v.v.).
- **Quản lý nhân viên** (ca làm, phân quyền, xử lý đặt sân tại quầy, bán hàng).
- **Báo cáo** doanh thu, lịch sử đặt sân, tồn kho.

Mục tiêu: giảm gọi điện/Zalo thủ công, minh bạch lịch sân, tối ưu vận hành và doanh thu phụ trợ (bán đồ).

## 2. Stakeholder (bên liên quan)

| Vai trò | Nhu cầu chính |
|--------|----------------|
| **Khách hàng (người chơi)** | Xem lịch trống, đặt nhanh, thanh toán, hủy/đổi theo quy định, mua đồ kèm hoặc online. |
| **Chủ sân / quản lý** | Nhìn tổng quan lịch, giá, khuyến mãi, nhân sự, báo cáo. |
| **Nhân viên lễ tân / thu ngân** | Check-in, walk-in, bán hàng POS, xác nhận thanh toán tiền mặt/chuyển khoản. |
| **Nhân viên kho / bán hàng** | Nhập–xuất kho, đổi trả, cảnh báo hết hàng. |
| **Đội phát triển / vận hành IT** | Triển khai, giám sát, backup, bảo mật. |

## 3. Yêu cầu chức năng (tóm tắt)

### 3.1 Đặt sân / thuê sân

- Danh mục **loại sân** (cầu lông, tennis, sân 7, sân 5, v.v.) và **sân cụ thể** trong từng cơ sở.
- **Lịch theo slot** (ví dụ 30/60/90 phút), hiển thị trạng thái: trống / đã giữ / đã đặt / đang chơi / bảo trì.
- Đặt online; tùy chọn **đặt cọc** hoặc **thanh toán đủ**; áp dụng **mã giảm giá**.
- **Chính sách hủy/đổi**: thời hạn, phí (cấu hình theo từng cơ sở).

### 3.2 Bán lẻ (retail)

- Danh mục sản phẩm, biến thể (size, màu), SKU, giá, khuyến mãi.
- Giỏ hàng, đơn hàng; giao **tại quầy** hoặc **giao hàng** (nếu sau này mở rộng).
- Tồn kho theo **kho/chi nhánh**; cảnh báo tồn thấp.

### 3.3 Nhân viên & phân quyền

- Tài khoản nhân viên, vai trò (admin, quản lý, lễ tân, thu ngân, kho).
- Phân quyền theo chức năng (xem/sửa lịch, giá, đơn hàng, báo cáo, cấu hình hệ thống).

### 3.4 Báo cáo & vận hành

- Doanh thu theo ngày/tháng (sân + bán lẻ).
- Lịch sử đặt sân, no-show (nếu theo dõi).

## 4. Yêu cầu phi chức năng

- **Bảo mật**: xác thực mạnh, phân quyền rõ; dữ liệu khách và giao dịch được bảo vệ.
- **Hiệu năng**: trang lịch sân phản hồi nhanh; tránh double-booking khi nhiều người đặt cùng lúc.
- **Khả dụng**: ưu tiên uptime cho giờ cao điểm tối/cuối tuần.
- **Mở rộng**: thêm loại sân, chi nhánh, tích hợp thanh toán/Cổng VN mới mà không phá vỡ lõi.

## 5. Giả định & phạm vi ngoài MVP (ghi nhận)

- Tích hợp **thanh toán online** (MoMo, VNPay, v.v.) có thể làm theo giai đoạn.

---

*Tài liệu này là đầu vào cho `SYSTEM_DESIGN.md`, `MVP_SCOPE.md` và `DATA_MODEL.md`.*
