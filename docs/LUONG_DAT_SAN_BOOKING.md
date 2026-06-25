# Luồng đặt sân (Booking) — có Realtime Socket.IO

## Mô tả nghiệp vụ (4 bước)

**① Khách hàng chọn sân & khung giờ trên Mobile App**

Khách tra cứu lịch trống theo ngày, chọn cơ sở / loại sân / khung giờ, xác nhận đặt sân và chọn thanh toán VNPay. App gọi `POST /api/v1/app/bookings` (hoặc `/bookings/batch` nếu đặt nhiều khung). Backend tạo bản ghi `bookings` + `booking_slots` + `payments` trong transaction (trạng thái `pending`, `payment_status = unpaid`), trả về `payment_url` nếu thanh toán VNPay.

Ngay sau khi giữ chỗ thành công, server phát sự kiện Socket.IO **`booking`** tới phòng `staff_room` để Web Admin biết có đơn đặt sân mới.

**② Server xử lý thanh toán VNPay & cập nhật realtime**

Khách mở WebView VNPay, quét QR / thanh toán. VNPay gọi ngược:

- `GET /api/v1/app/payments/vnpay/ipn` (server-to-server)
- `GET /api/v1/app/payments/vnpay/return` (trả kết quả cho WebView)

`PaymentService.processBookingIPN` xác thực chữ ký **HMAC-SHA512**, kiểm tra số tiền và idempotency, rồi cập nhật:

- `payments.status = paid`
- `bookings.payment_status = paid`, `bookings.status = confirmed`

Sau khi commit DB, server phát sự kiện Socket.IO **`booking_changed`** tới `staff_room` (và `booking_status_updated` tới room `user_{userId}` trên app khách nếu cần).

**③ Nhân viên nhận thông báo tức thì & xử lý trên Web Admin**

Mọi tab Web Admin đang mở đều lắng nghe socket qua `staff_room`:

| Thành phần | Hành vi khi có sự kiện |
|------------|-------------------------|
| **Thông báo toàn cục** (`StaffRealtimeNotifier`) | Popup góc màn hình: "Đặt sân mới" / "Cập nhật đặt sân" |
| **Trung tâm vận hành** (`/dashboard`) | Cập nhật thống kê, danh sách chờ xử lý, nhật ký realtime |
| **Sa bàn lịch sân** (`/booking/schedule`) | Tự refresh lưới, không cần F5 |
| **Danh sách đặt sân** (`/booking/list`) | Tự tải lại bảng; sắp xếp **`updated_at DESC`** — đơn vừa đổi lên trên cùng |

Nhân viên xác nhận, đối soát tiền mặt, đổi trạng thái hoặc hủy đơn qua Web Admin → mỗi lần cập nhật lại emit **`booking_changed`**.

**④ Hậu xử lý sau khi thanh toán thành công**

- Cộng **điểm tích lũy** cho khách (`UserService.addPointsAndUpgrade`).
- **Sa bàn lịch sân** phản ánh slot đã đặt qua realtime (bước ③).
- Giao dịch được ghi vào bảng `payments` → phản ánh trên **báo cáo doanh thu** khi staff/admin truy vấn trang Doanh thu.

> **Lưu ý:** Luồng đặt sân **không trừ tồn kho phụ kiện**. Trừ kho chỉ áp dụng cho luồng **mua hàng / POS** (xem `LUONG_4_ECOMMERCE_ORDER`).

---

## Sự kiện Socket.IO (staff)

| Event | Khi phát | Payload chính |
|-------|----------|---------------|
| `booking` | Tạo đơn đặt sân mới từ App | `bookingId`, `status`, `facilityId`, `message` |
| `booking_changed` | Đổi trạng thái / thanh toán / hủy / hết hạn VNPay 30 phút | `bookingId`, `status`, `payment_status` hoặc `updatedCount` |

**Nguồn emit (backend):**

- `booking.service.ts` — `createBooking`, `updateBookingStatus`, `cancelBooking`
- `payment.service.ts` — `processBookingIPN`, `checkExpiredPayments` (cron hủy booking VNPay quá hạn)

**Lắng nghe (web-admin):**

- `web-admin/src/hooks/useStaffRealtime.ts`
- `web-admin/src/components/StaffRealtimeNotifier.tsx`
- `web-admin/src/features/dashboard/components/StaffDashboardPage.tsx`
- `web-admin/src/features/booking/components/BookingPage.tsx`
- `web-admin/src/features/booking/components/BookingSchedulePage.tsx`

---

## Tác vụ nền liên quan

| Tác vụ | Cơ chế | Hành vi |
|--------|--------|---------|
| Hủy booking VNPay quá 30 phút | `PaymentService.checkExpiredPayments` (mỗi 1 phút) | `status = cancelled` → emit `booking_changed` |
