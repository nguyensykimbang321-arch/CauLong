import { useCallback } from 'react';
import { notification, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  useStaffRealtime,
  type BookingSocketPayload,
  type OrderSocketPayload,
} from '../hooks/useStaffRealtime';

const StaffRealtimeNotifier = () => {
  const navigate = useNavigate();

  const handleNewOrder = useCallback((payload: OrderSocketPayload) => {
    notification.info({
      message: 'Đơn hàng mới',
      description: payload.message || `Có đơn hàng mới #${payload.orderId}`,
      duration: 8,
      placement: 'topRight',
      btn: (
        <Button type="primary" size="small" onClick={() => navigate('/employee/orders')}>
          Xử lý ngay
        </Button>
      ),
    });
  }, [navigate]);

  const handleOrderChanged = useCallback((payload: OrderSocketPayload) => {
    const description = payload.updatedCount
      ? `${payload.updatedCount} đơn hết hạn đã được xử lý`
      : `Đơn hàng #${payload.orderId} đã thay đổi trạng thái`;

    notification.open({
      message: 'Cập nhật đơn hàng',
      description,
      duration: 6,
      placement: 'topRight',
    });
  }, []);

  const handleNewBooking = useCallback((payload: BookingSocketPayload) => {
    notification.info({
      message: 'Đặt sân mới',
      description: payload.message || `Có đơn đặt sân mới #${payload.bookingId}`,
      duration: 8,
      placement: 'topRight',
      btn: (
        <Button type="primary" size="small" onClick={() => navigate('/booking/schedule')}>
          Xem lịch sân
        </Button>
      ),
    });
  }, [navigate]);

  const handleBookingChanged = useCallback((payload: BookingSocketPayload) => {
    const description = payload.updatedCount
      ? `${payload.updatedCount} đơn đặt sân hết hạn đã được xử lý`
      : `Đơn đặt sân #${payload.bookingId} đã thay đổi trạng thái`;

    notification.open({
      message: 'Cập nhật đặt sân',
      description,
      duration: 6,
      placement: 'topRight',
    });
  }, []);

  useStaffRealtime({
    onOrder: handleNewOrder,
    onOrderChanged: handleOrderChanged,
    onBooking: handleNewBooking,
    onBookingChanged: handleBookingChanged,
  });

  return null;
};

export default StaffRealtimeNotifier;
