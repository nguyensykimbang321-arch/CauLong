import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Tag, Space, message } from 'antd';
import type { Order } from '../types/sale.types';
import { PosService } from '../services/sale.api';

const OrderManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending_pickup');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Hàm "Bắt cầu" - Lấy dữ liệu theo Tab hiện tại
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let res;
      if (activeTab === 'pending_pickup') {
        res = await PosService.getPendingPickup();
      } else if (activeTab === 'pending_payment') {
        res = await PosService.getPendingPayment();
        console.log("pending payment", res);
      } else {
        res = await PosService.getAllOrders();
      }
      setOrders(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Cứ mỗi khi đổi Tab thì gọi lại API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [activeTab]);

  // Các cú "Smash" - Xử lý hành động của Staff
  const handlePayCash = async (orderId: number) => {
    try {
      await PosService.payCash(orderId);
      message.success('Đã xác nhận thu tiền mặt!');
      fetchOrders(); // Load lại danh sách
    } catch (error) {
        console.error(error);
      message.error('Lỗi khi xác nhận thanh toán');
    }
  };

  const handleComplete = async (orderId: number) => {
    try {
      await PosService.completeOrder(orderId);
      message.success('Đơn hàng đã được giao thành công!');
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi hoàn thành đơn');
    }
  };

  

  // Cấu hình các cột của Bảng (Table)
  const columns = [
    { title: 'Mã ĐH', dataIndex: 'id', key: 'id', render: (id: number) => `#${id}` },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const color = status === 'completed' ? 'green' : status === 'pending_payment' ? 'red' : 'blue';
        const text = status === 'completed' ? 'Hoàn thành' : status === 'pending_payment' ? 'Chờ thanh toán' : 'Chờ lấy hàng';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'total_cents', 
      key: 'total_cents',
      render: (cents: number) => `${(cents / 100).toLocaleString('vi-VN')} VNĐ` 
    },
    { title: 'Kiểu nhận', dataIndex: 'pickup_type', key: 'pickup_type' },
    {
      title: 'Hành động (Thao tác nhanh)',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Space size="middle">
          <Button type="link" onClick={() => {/* TODO: Mở Modal xem chi tiết getOrderById */}}>Xem chi tiết</Button>
          
          {/* Nút hành động thay đổi linh hoạt theo trạng thái đơn */}
          {record.status === 'pending_payment' && (
            <Button type="primary" danger onClick={() => handlePayCash(record.id)}>
              Đã thu tiền (Tiền mặt)
            </Button>
          )}

          {record.status === 'pending_pickup' && (
            <Button type="primary" onClick={() => handleComplete(record.id)}>
              Đã giao hàng (Hoàn thành)
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Xử lý Đơn hàng (App)</h1>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => {
          setActiveTab(key); // THAY ĐỔI TAB (Lúc này useEffect sẽ tự chạy fetchOrders ở chế độ ẩn)
        }}        
        items={[
          { key: 'pending_pickup', label: 'Cần Giao / Chờ lấy hàng' },
          { key: 'pending_payment', label: 'Chờ thanh toán (Tiền mặt)' },
          { key: 'all', label: 'Tất cả đơn hàng (Lịch sử)' },
        ]}
      />

      <Table 
        columns={columns} 
        dataSource={orders} 
        rowKey="id" 
        loading={loading}
      />
    </div>
  );
};

export default OrderManagementPage;