# 4.2.4. Triển khai nghiệp vụ đặt sân (Booking)

Service `BookingService` (`backend/src/services/booking.service.ts`) là lõi xử lý nghiệp vụ đặt sân của hệ thống. Tầng service này chịu trách nhiệm kiểm tra điều kiện hợp lệ, tính giá, chống trùng lịch, quản lý trạng thái thanh toán và trả dữ liệu cho cả Web Admin lẫn Mobile App.

Các hàm chính trong `BookingService` gồm:

1. `getAvailableCourts`  
   Lọc danh sách sân còn trống theo `facility_id`, loại sân, ngày chơi và khung giờ yêu cầu; loại bỏ các sân có slot bị trùng hoặc vi phạm quy tắc giãn cách giữa các ca.

2. `getDailyBookedSlots`  
   Trả về toàn bộ các khung giờ đã được đặt của từng sân trong một ngày cụ thể để phục vụ màn timeline lịch trống.

3. `createBooking`  
   Tạo đơn đặt sân trong transaction, khóa dữ liệu để chống race condition khi nhiều người cùng đặt một sân trong cùng thời điểm.

4. `getMyBookings`  
   Truy xuất lịch sử đặt sân của khách hàng đang đăng nhập.

5. `cancelBooking`  
   Hủy đơn đặt sân theo các điều kiện nghiệp vụ cho phép, đồng thời cập nhật trạng thái booking và payment liên quan.

Quy trình `createBooking` được triển khai theo các bước:

1. Kiểm tra dữ liệu đầu vào: ngày chơi, giờ bắt đầu, giờ kết thúc phải hợp lệ; không được đặt vào quá khứ; thời lượng đặt phải đạt mức tối thiểu do hệ thống quy định.
2. Xác minh sân tồn tại, thuộc đúng cơ sở được chọn và đang ở trạng thái hoạt động.
3. Tính tổng tiền qua `PricingService.calculateTotalPrice` dựa trên cấu hình giá tại bảng `price_configs`.
4. Mở transaction và khóa các bản ghi liên quan bằng cơ chế `LOCK.UPDATE` để ngăn việc 2 request đồng thời cùng đặt một sân.
5. Kiểm tra xung đột trực tiếp với các slot đã có, đồng thời kiểm tra quy tắc khoảng trống tối thiểu giữa các ca liền kề.
6. Ghi dữ liệu vào `bookings`, tạo `payments` ở trạng thái `pending` hoặc `paid` tùy phương thức thanh toán, sau đó sinh các bản ghi `booking_slots`.
7. Commit transaction nếu toàn bộ điều kiện đều hợp lệ; nếu có lỗi phát sinh ở bất kỳ bước nào thì rollback để giữ dữ liệu nhất quán.

Giá động được triển khai trong `PricingService.calculateTotalPrice`. Hàm này truy vấn các cấu hình giá theo `facility_id` và loại sân, sau đó cộng dồn phần thời gian giao nhau giữa khung giờ khách chọn và từng khung giá hiệu lực. Cách tiếp cận này cho phép hệ thống hỗ trợ giá thường, giá cao điểm, giá cuối tuần hoặc các biến thể cấu hình khác mà không cần hard-code theo từng màn hình.

## Luồng booking trên Web Admin

Luồng booking trên Web Admin chủ yếu phục vụ nhân viên lễ tân hoặc quản trị viên thao tác thay khách:

1. Nhân viên chọn cơ sở, ngày chơi, loại sân và khung giờ trên giao diện quản trị.
2. Web Admin gọi các API kiểm tra lịch trống để dựng timeline và hiển thị các slot đã bị chiếm.
3. Khi nhân viên xác nhận đặt sân, frontend gửi request lên backend.
4. `BookingService` thực hiện toàn bộ nghiệp vụ chống trùng, tính giá, tạo booking và payment.
5. Nếu chọn thanh toán VNPay, backend tạo URL thanh toán; Web Admin hiển thị QR hoặc link để khách thanh toán tại quầy.
6. Sau khi VNPay callback thành công, backend cập nhật `payment_status` và `status` của booking; giao diện Web Admin polling hoặc tải lại dữ liệu để phản ánh trạng thái mới.

## Luồng booking trên Mobile App

Luồng booking trên Mobile App được tổ chức theo trải nghiệm người dùng cuối:

1. Người dùng mở màn `BookingScreen`, chọn cơ sở, bộ môn và ngày chơi.
2. APP gọi API lấy lịch đã đặt trong ngày để dựng timeline trực quan.
3. Người dùng chọn một hoặc nhiều khung giờ; APP gọi API kiểm tra availability và preview giá.
4. APP chuyển sang `BookingConfirmScreen`, hiển thị danh sách các khung giờ đã chọn và cho phép chọn phương thức thanh toán cho từng khung.
5. APP gửi request tạo booking hàng loạt qua endpoint `POST /api/v1/app/bookings/batch`.
6. Nếu có khung giờ dùng VNPay, backend trả về `paymentUrl`; APP mở `PaymentWebView` để thực hiện thanh toán.
7. Sau khi thanh toán xong, backend xử lý IPN/return URL, cập nhật trạng thái booking; APP điều hướng về màn lịch sử để người dùng theo dõi kết quả.

---

# 4.2.5. Triển khai nghiệp vụ bán hàng và tồn kho

## Quản lý đơn hàng (`OrderService`)

`OrderService` chịu trách nhiệm quản lý toàn bộ vòng đời đơn hàng sản phẩm của hệ thống, bao gồm cả luồng đặt hàng từ Mobile App và luồng bán trực tiếp tại quầy trên Web Admin/POS.

Các điểm chính của `OrderService`:

1. Xử lý hai luồng tạo đơn:
   - Đơn hàng từ Mobile App qua `POST /api/v1/app/orders`
   - Đơn hàng bán trực tiếp tại quầy qua `POST /api/v1/admin/orders/pos`

2. Cung cấp các thao tác quản lý trạng thái đơn:
   - `confirmOrder`
   - `completeOrder`
   - `cancelOrder`
   - `refundOrder`
   - `payCash`
   - `getVNPayUrl`

3. Tự động dọn dẹp các đơn online quá hạn thanh toán thông qua cron job gọi hàm `cancelExpiredOrders`.

4. Đồng bộ realtime cho Web Admin bằng cách phát sự kiện Socket.IO `order` hoặc `order_changed` tới room `staff_room` khi có thay đổi trạng thái quan trọng.

## Luồng đơn hàng từ Mobile App

1. Người dùng chọn sản phẩm trong app và đi tới màn `CheckoutScreen`.
2. APP gửi request `POST /api/v1/app/orders` kèm danh sách sản phẩm, thời gian nhận và phương thức thanh toán.
3. Backend tạo `order` ở trạng thái `pending_payment`, đồng thời tạo `payment` tương ứng.
4. Nếu phương thức là VNPay, backend trả về `payment_url`; APP mở `PaymentWebView` để khách thanh toán.
5. Khi VNPay callback thành công, backend cập nhật `payment.status = paid` và chuyển `order.status` sang `pending_pickup`.
6. APP quay về màn `MyOrdersScreen` để người dùng theo dõi trạng thái đơn.

## Luồng bán trực tiếp tại quầy trên Web Admin/POS

1. Nhân viên chọn cơ sở, thêm sản phẩm vào giỏ và tạo đơn POS.
2. Web Admin gọi `POST /api/v1/admin/orders/pos`.
3. Backend kiểm tra tồn kho theo đúng `facility_id`, tính tổng tiền và tạo `order`, `order_items`, `payment`.
4. Nếu thanh toán tiền mặt, Web Admin gọi tiếp `PATCH /api/v1/admin/orders/:id/pay-cash`; nếu thanh toán VNPay thì gọi `GET /api/v1/admin/orders/:id/vnpay-url` để lấy QR/link thanh toán.
5. Sau khi thanh toán thành công, backend trừ tồn kho, cập nhật trạng thái đơn sang `pending_pickup` và phát `order_changed` để các máy quản trị khác cập nhật realtime.
6. Khi giao hàng xong, nhân viên gọi `PATCH /api/v1/admin/orders/:id/complete` để chuyển sang `completed`.
7. Nếu phát sinh hoàn tiền, backend gọi `refundOrder`, cập nhật `payment` sang `refunded` và cộng trả lại tồn kho.

## Quản lý tồn kho (`InventoryService`)

`InventoryService` phụ trách mọi thay đổi về số lượng tồn kho của sản phẩm.

Các đặc điểm chính:

1. Dữ liệu tồn kho được quản lý theo từng cơ sở trong bảng `inventory_levels`, nhờ đó mỗi chi nhánh có số lượng riêng.
2. Khi đơn hàng được ghi nhận thanh toán thành công, service sẽ gọi `adjustInventory` hoặc `bulkAdjustInventory` để trừ kho.
3. Nếu số lượng tồn không đủ, service ném lỗi và transaction của nghiệp vụ bán hàng sẽ rollback toàn bộ.
4. Mọi biến động kho đều bị ghi log vào bảng `inventory_movements`, bao gồm:
   - xuất kho do bán hàng
   - nhập/trả kho do hoàn tiền
   - điều chỉnh thủ công bởi quản trị viên

Cơ chế này giúp hệ thống vừa đảm bảo nhất quán dữ liệu, vừa hỗ trợ đối soát lịch sử biến động hàng hóa.

## Luồng web và app trong nghiệp vụ bán hàng

### Trên Web Admin

- Nhân viên thao tác trực tiếp với POS.
- Web Admin đóng vai trò màn hình vận hành: tạo đơn, lấy QR VNPay, theo dõi thanh toán realtime, xác nhận giao hàng, hoàn tiền.
- Các sự kiện Socket.IO giúp nhiều máy lễ tân nhìn thấy cùng một trạng thái đơn mà không cần tải lại trang.

### Trên Mobile App

- APP đóng vai trò kênh đặt hàng của khách.
- APP chỉ tạo đơn, mở WebView thanh toán và hiển thị lịch sử đơn.
- Các bước quản trị sau bán như xác nhận lấy hàng, hoàn tiền, đối soát kho được xử lý ở backend và Web Admin, không thực hiện trực tiếp trên app.

---

# 4.2.6. Triển khai nghiệp vụ trên APP

Phần APP được xây dựng xoay quanh ba nhóm nghiệp vụ chính: xác thực người dùng, đặt sân và mua sắm sản phẩm. Mobile App là kênh tương tác trực tiếp với khách hàng nên tập trung vào trải nghiệm chọn dịch vụ, thanh toán và theo dõi lịch sử giao dịch.

## 1. Luồng xác thực

1. Người dùng đăng ký tài khoản qua `POST /api/v1/app/auth/register`.
2. Người dùng đăng nhập qua `POST /api/v1/app/auth/login`.
3. Token JWT được lưu cục bộ để APP tự động gắn vào các request yêu cầu xác thực.
4. Khi quên mật khẩu, người dùng gọi `POST /api/v1/app/auth/forgot-password`.

## 2. Luồng đặt sân trên APP

1. APP tải danh sách cơ sở và loại sân.
2. Người dùng chọn cơ sở, bộ môn, ngày chơi; APP hiển thị timeline lịch trống.
3. Người dùng chọn một hoặc nhiều khung giờ cần đặt.
4. APP gửi yêu cầu kiểm tra khả dụng và tính giá tạm tính.
5. Màn hình xác nhận cho phép lựa chọn thanh toán tại sân hoặc VNPay cho từng booking.
6. APP gọi `POST /api/v1/app/bookings/batch` để tạo booking.
7. Nếu backend trả về `paymentUrl`, APP mở `PaymentWebView`.
8. Sau thanh toán, APP chuyển về màn lịch sử đặt sân để người dùng xem trạng thái mới.

## 3. Luồng mua hàng trên APP

1. Người dùng duyệt danh sách sản phẩm của cơ sở từ endpoint `GET /api/v1/app/products`.
2. Sản phẩm được thêm vào giỏ hàng cục bộ trên thiết bị.
3. Ở màn checkout, APP gửi đơn lên `POST /api/v1/app/orders`.
4. Nếu chọn VNPay, APP nhận `payment_url` và mở `PaymentWebView`.
5. Sau khi thanh toán xong, APP điều hướng về `MyOrdersScreen` để tải lại danh sách đơn hàng.

## 4. Luồng thanh toán VNPay trên APP

1. APP không tự xử lý logic thanh toán ở client mà chỉ nhận `paymentUrl` từ backend.
2. APP mở `PaymentWebView` để người dùng thực hiện thanh toán trên cổng VNPay.
3. Backend xử lý `return` và `ipn`, xác thực chữ ký HMAC, sau đó cập nhật trạng thái booking/order.
4. APP theo dõi URL điều hướng sau thanh toán và điều hướng người dùng về màn phù hợp:
   - `MyBookings` đối với đặt sân
   - `MyOrders` đối với mua sản phẩm

## 5. Vai trò của APP trong tổng thể hệ thống

APP chịu trách nhiệm:

- hiển thị dữ liệu cho khách hàng
- gửi request đến API `/api/v1/app/...`
- mở WebView thanh toán
- hiển thị lịch sử giao dịch và trạng thái đơn

APP không đảm nhiệm:

- xác nhận giao hàng
- trừ hoặc hoàn tồn kho
- xử lý realtime cho staff
- xử lý nghiệp vụ hậu cần nội bộ

Các phần này thuộc về backend và Web Admin.

---

# 4.2.7. API Client dành cho Mobile App

Các endpoint chính phía khách hàng được tổ chức dưới prefix `/api/v1/app/...`.

## 1. Authentication

1. `POST /api/v1/app/auth/register`  
   Đăng ký tài khoản mới.

2. `POST /api/v1/app/auth/login`  
   Đăng nhập hệ thống.

3. `POST /api/v1/app/auth/forgot-password`  
   Hỗ trợ khôi phục mật khẩu.

4. `POST /api/v1/app/auth/change-password`  
   Đổi mật khẩu khi người dùng đã đăng nhập.

## 2. Facility

5. `GET /api/v1/app/facilities`  
   Lấy danh sách các cơ sở sân thể thao.

6. `GET /api/v1/app/facilities/:id`  
   Lấy thông tin chi tiết của một cơ sở.

7. `GET /api/v1/app/facilities/:id/court-types`  
   Lấy danh sách loại sân thuộc cơ sở được chọn.

## 3. Booking

8. `GET /api/v1/app/bookings/availability`  
   Kiểm tra danh sách sân còn trống theo ngày, giờ và loại sân.

9. `GET /api/v1/app/bookings/booked-slots`  
   Lấy các khung giờ đã được đặt trong ngày để dựng timeline lịch trống.

10. `GET /api/v1/app/bookings/daily-booked-slots`  
    Alias của endpoint booked-slots, phục vụ cùng mục đích tra cứu lịch đã đặt.

11. `POST /api/v1/app/bookings/price-preview`  
    Xem trước giá tiền của khung giờ dự kiến đặt.

12. `POST /api/v1/app/bookings`  
    Tạo một đơn đặt sân mới.

13. `POST /api/v1/app/bookings/batch`  
    Tạo nhiều booking trong một lần gửi request; dùng cho luồng chọn nhiều khung giờ trên app.

14. `GET /api/v1/app/bookings`  
    Xem lịch sử các đơn đặt sân của khách hàng.

15. `PATCH /api/v1/app/bookings/:id`  
    Hủy hoặc cập nhật trạng thái booking theo điều kiện cho phép.

## 4. Shop

16. `GET /api/v1/app/products`  
    Lấy danh sách sản phẩm, phụ kiện thể thao theo cơ sở.

17. `POST /api/v1/app/orders`  
    Tạo đơn hàng mua sắm sản phẩm.

18. `GET /api/v1/app/orders`  
    Xem danh sách đơn hàng của người dùng.

19. `PATCH /api/v1/app/orders/:id`  
    Hủy đơn hàng của khách hàng khi còn đủ điều kiện.

## 5. Payment

20. `GET /api/v1/app/payments/vnpay/return`  
    Xử lý kết quả thanh toán trả về từ VNPay.

21. `GET /api/v1/app/payments/vnpay/ipn`  
    Nhận thông báo thanh toán tức thời từ VNPay.

22. `GET /api/v1/app/payments/vnpay-return`  
    Alias của return URL, dùng để tương thích với cấu hình callback dạng gạch nối.

23. `GET /api/v1/app/payments/vnpay-ipn`  
    Alias của IPN URL, dùng để tương thích với cấu hình callback dạng gạch nối.

## Phân biệt rõ luồng web và app

### Luồng Web Admin

- Dành cho `admin` và `staff`
- Quản lý vận hành nội bộ: sa bàn booking, POS, tồn kho, hoàn tiền, doanh thu
- Gọi API nhóm `/api/v1/admin/...`
- Có Socket.IO để cập nhật realtime cho nhân viên

### Luồng Mobile App

- Dành cho `customer`
- Tập trung vào trải nghiệm khách hàng: đăng nhập, đặt sân, mua hàng, thanh toán, xem lịch sử
- Gọi API nhóm `/api/v1/app/...`
- Không trực tiếp quản trị kho, không xử lý xác nhận giao hàng, không vận hành POS

## Gợi ý sử dụng file này

Bạn có thể dùng file này làm bản nháp để chèn lại vào báo cáo chính, hoặc tách ra thành tiểu mục trong chương triển khai hệ thống. Nếu cần, có thể chỉnh tiếp theo một trong hai hướng:

1. Viết theo văn phong báo cáo học thuật ngắn gọn, trang trọng hơn.
2. Viết theo kiểu dễ thuyết trình, có thêm sơ đồ luồng và bullet ngắn để đưa vào slide.
