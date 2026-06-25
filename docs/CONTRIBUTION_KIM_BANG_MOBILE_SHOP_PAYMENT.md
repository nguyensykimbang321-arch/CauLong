# Trả lời câu hỏi — Mobile App & Backend Payment

**Nguyễn Sỹ Kim Bằng** | Catalog, giỏ hàng, checkout, payments | Orders & Payments APIs

---

## Câu 1. Em làm phần nào trong dự án?

Em phụ trách **luồng mua hàng trên Mobile App** và **API đơn hàng/thanh toán** trên Backend:

- App: xem sản phẩm → giỏ hàng → checkout → thanh toán VNPay/COD → xem/hủy đơn.
- Backend: `POST/GET/PATCH /app/orders`, tích hợp VNPay (tạo URL, IPN, return), API sản phẩm cho catalog.

---

## Câu 2. Luồng mua hàng trên app hoạt động thế nào?

```
Chọn cơ sở → Xem sản phẩm → Thêm giỏ → Checkout → Tạo đơn (API)
                                              ↓
                                   COD: xong, sang MyOrders
                                    VNPay: mở WebView → thanh toán → quay lại MyOrders 
```

1. **ShopScreen:** gọi `GET /app/products?facility_id=...`, lọc danh mục, tìm kiếm.
2. **Giỏ hàng:** lưu trên app (`AppStore`), chưa gọi server.
3. **CheckoutScreen:** gửi `POST /app/orders` kèm thông tin khách, giờ lấy hàng, `payment_method`, danh sách sản phẩm.
4. **MyOrdersScreen:** `GET /app/orders` để xem trạng thái; có thể `PATCH /app/orders/:id` để hủy.

---

## Câu 3. Giỏ hàng em xử lý ra sao? Có lưu server không?

**Không lưu server.** Giỏ nằm trong `AppStore` (React `useReducer`) trên thiết bị.

- Thêm/sửa/xóa: `cart/add`, `cart/setQty`, `cart/remove`, `cart/clear`.
- Mỗi dòng gồm: `variant_id`, tên sản phẩm, giá, số lượng.
- Chỉ khi bấm **Thanh toán** mới gửi lên backend qua `createOrder`.

*Lý do:* đơn giản cho MVP; khách chưa đăng nhập vẫn có thể mua (API tạo đơn dùng `optionalToken`).

---

## Câu 4. API tạo đơn hàng làm gì?

**Endpoint:** `POST /api/v1/app/orders`  
**File:** `OrderService.createOrder`

Trong một **transaction**:

1. Tính `total_cents` từ danh sách item.
2. Tạo `orders` — trạng thái `pending_payment`.
3. Tạo `payments` — `pending`, provider = `cash` hoặc `vnpay`.
4. Tạo `order_items` (variant, số lượng, đơn giá).

Nếu chọn **VNPay**, controller tạo thêm `payment_url` (TxnRef: `ORDER_{id}_{timestamp}`) và trả về cho app.

Sau đó emit Socket `order` → Web Admin biết có đơn mới.

---

## Câu 5. Thanh toán VNPay em triển khai thế nào?

**Trên app:** nhận `payment_url` → mở `PaymentWebView` (React Native WebView) → khách thanh toán trên cổng VNPay.

**Trên backend:**


| Route                            | Vai trò                                |
| -------------------------------- | -------------------------------------- |
| `GET /app/payments/vnpay/return` | Trình duyệt redirect về sau thanh toán |
| `GET /app/payments/vnpay/ipn`    | VNPay server gọi ngược để xác nhận     |


Xử lý trong `PaymentService.processPosOrderVNPayIPN`:

1. Verify chữ ký HMAC-SHA512.
2. Parse mã đơn từ `vnp_TxnRef`.
3. Nếu thành công: `payment` → `paid`, `order` → `pending_pickup`, **trừ tồn kho**.
4. Emit `order_changed` cho Web Admin.

App chỉ theo dõi URL return (`vnp_ResponseCode=00`) để chuyển màn; **trạng thái thật do backend cập nhật**.

---

## Câu 6. COD (tiền mặt) khác VNPay chỗ nào?


|                         | COD                                 | VNPay                        |
| ----------------------- | ----------------------------------- | ---------------------------- |
| Sau tạo đơn             | `pending_payment`, không mở WebView | Có `payment_url`, mở WebView |
| Ai xác nhận đã thu tiền | Staff trên Web Admin (`pay-cash`)   | Tự động qua IPN/return       |
| Trừ kho                 | Khi staff xác nhận thu tiền         | Khi VNPay báo thành công     |


Trên app, COD: tạo đơn xong → xóa giỏ → sang MyOrders, khách đến quầy trả tiền khi lấy hàng.

---

## Câu 7. Trạng thái đơn hàng có những gì?


| Trạng thái        | Ý nghĩa                                |
| ----------------- | -------------------------------------- |
| `pending_payment` | Đã đặt, chưa thanh toán (hoặc chờ COD) |
| `pending_pickup`  | Đã thanh toán, chờ lấy hàng            |
| `completed`       | Staff xác nhận đã giao (Web Admin)     |
| `cancelled`       | Khách/staff hủy                        |
| `expired`         | Quá 24h chưa thanh toán (cron)         |
| `refunded`        | Đã hoàn tiền (Web Admin)               |


App chủ yếu thao tác: tạo (`pending_payment`), xem, hủy (`cancelled`). Các bước sau do staff trên Web Admin.

---

## Câu 8. Em dùng API nào cho phần shop?


| API                              | Chức năng                    |
| -------------------------------- | ---------------------------- |
| `GET /app/products?facility_id=` | Catalog + tồn kho theo cơ sở |
| `POST /app/orders`               | Tạo đơn                      |
| `GET /app/orders`                | Lịch sử đơn (cần đăng nhập)  |
| `PATCH /app/orders/:id`          | Hủy đơn                      |
| `GET /app/payments/vnpay/return` | Callback VNPay               |
| `GET /app/payments/vnpay/ipn`    | IPN VNPay                    |


---

## Câu 9. Web Admin liên quan thế nào?

App **không** xử lý giao hàng hay hoàn tiền. Sau khi khách đặt:

- Socket `order` / `order_changed` báo staff có đơn mới hoặc đổi trạng thái.
- Staff trên Web Admin: xác nhận COD, giao hàng (`complete`), hoàn tiền (`refund`).

Em chỉ làm phía **khách đặt và thanh toán**; phía **vận hành sau bán** do module Web Admin/POS.

---

## Câu 10. File chính em viết/sửa?

**App:** `ShopScreen`, `CartScreen`, `CheckoutScreen`, `MyOrdersScreen`, `PaymentWebView`, `AppStore.js`, `api.js`

**Backend:** `order.controller.ts`, `order.service.ts`, `payment.controller.ts`, `payment.service.ts`, `vnpay.ts`, `order.routes.ts`, `payment.route.ts`

---

## Gợi ý trả lời ngắn (30 giây)

> *"Em làm luồng shop trên app: xem sản phẩm theo cơ sở, giỏ hàng local, checkout gửi API tạo đơn. Thanh toán có COD và VNPay — VNPay mở WebView, backend nhận IPN để cập nhật trạng thái và trừ kho. Em cũng viết API orders và tích hợp VNPay phía server. Đơn mới được báo realtime cho staff qua Socket.IO."*

