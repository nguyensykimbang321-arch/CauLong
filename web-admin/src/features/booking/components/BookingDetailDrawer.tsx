import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Divider, Tag, List, Typography, Spin, Space, Button, Popconfirm, message } from 'antd';
import type { Booking } from '../types/booking.types';
import { BookingService } from '../services/booking.service';
import VNPayQRModal from './VNPayQRModal';

const { Text } = Typography;

interface BookingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  // Cho phép truyền 1 trong 2: Hoặc nguyên cái object, hoặc chỉ cái ID
  booking?: Booking | null; 
  bookingId?: number | null; 
  onRefresh?: () => void; // Thêm prop này để trigger F5 lưới/bảng khi hủy đơn
}

const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({ open, onClose, booking: initialBooking, bookingId, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [internalBooking, setInternalBooking] = useState<Booking | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // 💥 ĐÂY LÀ KHÚC "SMART" CỦA COMPONENT
  useEffect(() => {
    if (open) {
      if (initialBooking) {
        // Nếu có sẵn data (từ trang Danh sách truyền vào), xài luôn
        setInternalBooking(initialBooking);
      } else if (bookingId) {
        // Nếu chỉ có ID (từ trang Sa bàn truyền vào), phải gọi API đi lấy
        setLoading(true);
        BookingService.getBookingDetail(bookingId) // 🔥 Đảm bảo em đã viết API này trong Service nhé!
          .then(res => setInternalBooking(res.data))
          .catch(() => message.error('Không thể tải chi tiết đơn hàng'))
          .finally(() => setLoading(false));
      }
    } else {
      // Khi đóng Drawer thì dọn dẹp data để lần sau mở cái khác không bị chớp giật data cũ
      setInternalBooking(null); 
    }
  }, [open, initialBooking, bookingId]);

  const handleCancelBooking = async () => {
    if (!internalBooking) return;
    try {
      setLoading(true);
      await BookingService.updateBooking(internalBooking.id, { status: 'cancelled' });
      message.success('Đã hủy đơn thành công');
      if (onRefresh) onRefresh(); // Ép trang cha F5 lại danh sách/lưới
      onClose(); 
    } catch (error) {
      message.error('Lỗi hủy đơn');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <Drawer
      title={`Chi tiết đơn hàng #${internalBooking?.id || bookingId || ''}`}
      placement="right"
      width={500}
      onClose={onClose}
      open={open}
    >
      <Spin spinning={loading}>
        {internalBooking && (
          <div>
            {/* THÔNG TIN KHÁCH HÀNG */}
            <Descriptions title="Thông tin Khách hàng" column={1} bordered size="small">
              <Descriptions.Item label="Họ tên">{internalBooking.user?.full_name || 'Khách vãng lai'}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{internalBooking.user?.phone || 'Chưa cập nhật'}</Descriptions.Item>
              <Descriptions.Item label="Email">{internalBooking.user?.email || 'N/A'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* THÔNG TIN ĐƠN HÀNG */}
            <Descriptions title="Thông tin Đơn hàng" column={1} bordered size="small">
              <Descriptions.Item label="Cơ sở đặt">
                <Text strong>{internalBooking.facility?.name || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo đơn">
                {formatDateTime(internalBooking.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn">
                <Tag color={internalBooking.status === 'confirmed' ? 'green' : 'blue'}>
                  {internalBooking.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Tag color={internalBooking.payment_status === 'paid' ? 'success' : 'warning'}>
                  {internalBooking.payment_status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <span className="text-lg font-bold text-red-500">
                  {internalBooking.total_cents.toLocaleString('vi-VN')} VNĐ
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* CHI TIẾT CA ĐẶT SÂN */}
            <Typography.Title level={5}>Chi tiết Sân / Khung giờ</Typography.Title>
            <List
              itemLayout="horizontal"
              dataSource={internalBooking.slots || []}
              renderItem={(slot) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text className="text-blue-600 font-semibold">{slot.court?.name}</Text>}
                    description={
                      <div>
                        <div>Thời gian: <b>{formatDateTime(slot.start_at)}</b> - <b>{formatDateTime(slot.end_at)}</b></div>
                        <div>Giá ca này: <Text type="danger">{slot.price_cents.toLocaleString('vi-VN')} đ</Text></div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {/* 🔥 KHU VỰC NÚT BẤM DÀNH CHO LỄ TÂN */}
            <div className="mt-8 border-t pt-4 bg-gray-50 -mx-6 px-6 pb-6">
              <Space direction="vertical" className="w-full mt-4">
                {/* 1. Nút tạo mã QR (Dành cho đơn chưa thanh toán) */}
                {internalBooking.payment_status === 'unpaid' && internalBooking.status !== 'cancelled' && (
                  <Button type="primary" block size="large" className="bg-green-600 font-semibold shadow-md"
                    onClick={() => setIsQrModalOpen(true)}>
                    Tạo mã QR Thu Tiền (VNPay)
                  </Button>
                )}
                
                {/* 2. Nút Hủy Đơn (Chỉ hiện nếu chưa hủy hoặc chưa chơi xong) */}
                {internalBooking.status !== 'cancelled' && internalBooking.status !== 'completed' && (
                  <Popconfirm 
                    title="Hủy đơn đặt sân" 
                    description="Bạn có chắc chắn muốn hủy đơn này không? Hành động này không thể hoàn tác."
                    onConfirm={handleCancelBooking}
                    okText="Đồng ý Hủy"
                    cancelText="Giữ lại"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger block type="dashed">
                      Hủy Đơn Này
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </div>
        )}
      </Spin>
      {internalBooking && (
        <VNPayQRModal
          open={isQrModalOpen}
          bookingId={internalBooking.id}
          totalCents={internalBooking.total_cents}
          onClose={() => setIsQrModalOpen(false)}
          onSuccess={() => {
            setIsQrModalOpen(false); // Đóng mã QR
            // F5 lại data của Drawer và Lưới bên ngoài
            if (onRefresh) onRefresh();
            // Gọi lại API lấy chi tiết để UI Drawer cập nhật thành Đã thanh toán
            BookingService.getBookingDetail(internalBooking.id).then(res => setInternalBooking(res.data));
          }}
        />
      )}
    </Drawer>
  );
};

export default BookingDetailDrawer;