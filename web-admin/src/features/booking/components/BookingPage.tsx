import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Card } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { BookingService } from '../services/booking.service';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api.type';
import type { Booking } from '../types/booking.types';
import BookingDetailDrawer from './BookingDetailDrawer';
import BookingStatusModal from './BookingStatusModal';
import CreateBookingModal from './CreateBookingModal';

const BookingPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await BookingService.getAllBookings();
      setBookings(response.data);
    } catch (error) {
        console.log(error)
        const err = error as AxiosError<ApiErrorResponse>;
        message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleViewDetails = (record: Booking) => {
    setSelectedBooking(record);
    setIsDrawerOpen(true);
  };

  const handleEditBooking = (record: Booking) => {
    setSelectedBooking(record);
    setIsStatusModalOpen(true); // Mở Modal Cập nhật
  };

  // Định nghĩa các cột cho bảng (Nhớ import type Booking ở trên cùng)
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      // text ở đây là id (number)
      render: (text: number) => <b>#{text}</b>, 
    },
    {
      title: 'Khách hàng',
      key: 'user',
      // Thêm _text: any và ép kiểu record là Booking
      render: (_text: any, record: Booking) => record.user?.full_name || 'Khách vãng lai',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_cents',
      key: 'total_cents',
      render: (cents: number) => `${(cents).toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'confirmed') color = 'green';
        if (status === 'cancelled') color = 'red';
        if (status === 'completed') color = 'purple';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => {
        return <Tag color={status === 'paid' ? 'success' : 'warning'}>{status}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Booking) => (
        <Space size="middle">
          {/* Truyền record vào hàm onClick */}
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            className="text-blue-500" 
            onClick={() => handleViewDetails(record)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            className="text-orange-500" 
            onClick={() => handleEditBooking(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
    <Card 
      title="Quản lý Đặt Sân" 
      extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsCreateModalOpen(true)}
          >
            Tạo đơn mới
          </Button>
        }
    >
      <Table 
        columns={columns} 
        dataSource={bookings} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
    
    <BookingDetailDrawer 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        booking={selectedBooking} 
    />

    <BookingStatusModal
        open={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={() => fetchBookings()} // Lưu xong thì gọi lại hàm này để bảng tự động chớp chớp load data mới
        booking={selectedBooking}
      />

      <CreateBookingModal 
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchBookings()} // Tạo xong tự động refetch bảng
      />

    </>
  );
};

export default BookingPage;