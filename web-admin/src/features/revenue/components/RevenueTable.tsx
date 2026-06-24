import React from 'react';
import { Table, Tag } from 'antd';
import dayjs from 'dayjs';
import type { RevenueTransactionItem } from '../types/revenue.types';

interface RevenueTableProps {
  data: RevenueTransactionItem[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  onPageChange: (page: number, pageSize: number) => void;
}

export const RevenueTable: React.FC<RevenueTableProps> = ({
  data,
  loading,
  pagination,
  onPageChange,
}) => {
  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents || 0);
  };

  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'payment_id',
      key: 'payment_id',
      width: 100,
      render: (id: number) => <span className="font-semibold text-gray-700 font-mono">#{id}</span>,
    },
    {
      title: 'Nguồn & Mã quy chiếu',
      dataIndex: 'source',
      key: 'source',
      width: 180,
      render: (source: 'booking' | 'order', record: RevenueTransactionItem) => {
        const isBooking = source === 'booking';
        const refId = record.booking_id || record.order_id || '';
        return (
          <div className="flex flex-col gap-1">
            <Tag color={isBooking ? 'blue' : 'orange'} className="w-fit m-0">
              {isBooking ? 'Đặt sân' : 'Bán lẻ / POS'}
            </Tag>
            <span className="text-xs text-gray-400 font-mono">ID: #{refId}</span>
          </div>
        );
      },
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount_cents',
      key: 'amount_cents',
      align: 'right' as const,
      render: (cents: number) => (
        <span className="font-bold text-gray-800">
          {formatMoney(cents)}
        </span>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'provider',
      key: 'provider',
      width: 130,
      render: (prov: 'cash' | 'vnpay') => {
        const isVNPay = prov === 'vnpay';
        return (
          <Tag color={isVNPay ? 'cyan' : 'gold'}>
            {isVNPay ? 'VNPay' : 'Tiền mặt'}
          </Tag>
        );
      },
    },
    {
      title: 'Cơ sở',
      dataIndex: 'facility_name',
      key: 'facility_name',
      render: (name: string | null) => name || <span className="text-gray-400 italic">Toàn hệ thống</span>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (date: string | null, record: RevenueTransactionItem) => {
        const d = date || record.created_at;
        return d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '';
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: () => <Tag color="success">Đã thanh toán</Tag>,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Lịch sử giao dịch thanh toán</h3>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="payment_id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: (page: number, pageSize: number) => onPageChange(page, pageSize),
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Tổng cộng ${total} giao dịch`,
        }}
      />
    </div>
  );
};
