import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, message } from 'antd';
import { BookingService } from '../services/booking.service';
import type { Booking } from '../types/booking.types';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api.type';

interface BookingStatusModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Hàm gọi để báo cho trang cha load lại bảng sau khi lưu thành công
  booking: Booking | null;
}

const BookingStatusModal: React.FC<BookingStatusModalProps> = ({ open, onClose, onSuccess, booking }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Khi mở Modal lên, tự động điền trạng thái hiện tại của đơn vào Form
  useEffect(() => {
    if (booking && open) {
      form.setFieldsValue({
        status: booking.status,
        payment_status: booking.payment_status,
      });
    }
  }, [booking, open, form]);

  const handleSubmit = async (values: any) => {
    if (!booking) return;
    
    try {
      setLoading(true);
      await BookingService.updateBooking(booking.id, values);
      message.success('Cập nhật trạng thái thành công!');
      
      onSuccess(); // Bảo trang cha: "Ê, tao lưu xong rồi, mày fetch lại dữ liệu đi!"
      onClose();   // Đóng Modal
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      message.error(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Cập nhật trạng thái Đơn #${booking?.id}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()} // Bấm nút OK mặc định của Modal sẽ trigger hàm submit của Form
      confirmLoading={loading}
      okText="Lưu thay đổi"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Trạng thái Đơn sân" name="status">
          <Select>
            <Select.Option value="pending">Chờ xác nhận (Pending)</Select.Option>
            <Select.Option value="confirmed">Đã xác nhận (Confirmed)</Select.Option>
            <Select.Option value="completed">Đã hoàn thành (Completed)</Select.Option>
            <Select.Option value="cancelled">Đã hủy (Cancelled)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Trạng thái Thanh toán" name="payment_status">
          <Select>
            <Select.Option value="unpaid">Chưa thanh toán (Unpaid)</Select.Option>
            <Select.Option value="paid">Đã thanh toán (Paid)</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingStatusModal;