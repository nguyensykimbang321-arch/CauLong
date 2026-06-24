import React from 'react';
import { Card, Progress, Empty, Tag, Divider } from 'antd';
import type { RevenueBreakdownResponse } from '../types/revenue.types';

interface RevenueBreakdownProps {
  data: RevenueBreakdownResponse | null;
  loading: boolean;
}

export const RevenueBreakdown: React.FC<RevenueBreakdownProps> = ({ data, loading }) => {
  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents || 0);
  };

  const providerBreakdown = React.useMemo(() => {
    if (!data || !data.by_provider) {
      return {
        cash: { amount: 0, count: 0, pct: 0 },
        vnpay: { amount: 0, count: 0, pct: 0 },
        total: 0,
      };
    }
    
    let cashAmount = 0;
    let cashCount = 0;
    let vnpayAmount = 0;
    let vnpayCount = 0;

    data.by_provider.forEach((item) => {
      if (item.provider === 'cash') {
        cashAmount = item.total_amount_cents;
        cashCount = item.total_transactions;
      } else if (item.provider === 'vnpay') {
        vnpayAmount = item.total_amount_cents;
        vnpayCount = item.total_transactions;
      }
    });

    const totalAmount = cashAmount + vnpayAmount;
    const cashPct = totalAmount > 0 ? Math.round((cashAmount / totalAmount) * 100) : 0;
    const vnpayPct = totalAmount > 0 ? 100 - cashPct : 0;

    return {
      cash: { amount: cashAmount, count: cashCount, pct: cashPct },
      vnpay: { amount: vnpayAmount, count: vnpayCount, pct: vnpayPct },
      total: totalAmount,
    };
  }, [data]);

  const sourceBreakdown = React.useMemo(() => {
    if (!data || !data.by_source) {
      return {
        booking: { amount: 0, count: 0, pct: 0 },
        order: { amount: 0, count: 0, pct: 0 },
        total: 0,
      };
    }
    
    let bookingAmount = 0;
    let bookingCount = 0;
    let orderAmount = 0;
    let orderCount = 0;

    data.by_source.forEach((item) => {
      if (item.source === 'booking') {
        bookingAmount = item.total_amount_cents;
        bookingCount = item.total_transactions;
      } else if (item.source === 'order') {
        orderAmount = item.total_amount_cents;
        orderCount = item.total_transactions;
      }
    });

    const totalAmount = bookingAmount + orderAmount;
    const bookingPct = totalAmount > 0 ? Math.round((bookingAmount / totalAmount) * 100) : 0;
    const orderPct = totalAmount > 0 ? 100 - bookingPct : 0;

    return {
      booking: { amount: bookingAmount, count: bookingCount, pct: bookingPct },
      order: { amount: orderAmount, count: orderCount, pct: orderPct },
      total: totalAmount,
    };
  }, [data]);

  const hasData = providerBreakdown.total > 0 || sourceBreakdown.total > 0;

  return (
    <Card
      title="Cấu trúc doanh thu"
      bordered={false}
      className="shadow-sm border border-gray-100 h-full"
      loading={loading}
    >
      {!hasData ? (
        <div className="py-12 flex justify-center items-center h-full">
          <Empty description="Không có dữ liệu phân tích tỷ lệ" />
        </div>
      ) : (
        <div className="flex flex-col py-2">
          {/* PHÂN TÍCH THEO CỔNG THANH TOÁN */}
          <div>
            <h4 className="font-semibold text-gray-500 mb-3 text-sm">Theo phương thức thanh toán</h4>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 text-xs">
                    <Tag color="gold">Tiền mặt</Tag> ({providerBreakdown.cash.count} GD)
                  </span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatMoney(providerBreakdown.cash.amount)} ({providerBreakdown.cash.pct}%)
                  </span>
                </div>
                <Progress
                  percent={providerBreakdown.cash.pct}
                  strokeColor="#d4b106"
                  trailColor="#f5f5f5"
                  strokeWidth={8}
                  showInfo={false}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 text-xs">
                    <Tag color="cyan">VNPay (QR)</Tag> ({providerBreakdown.vnpay.count} GD)
                  </span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatMoney(providerBreakdown.vnpay.amount)} ({providerBreakdown.vnpay.pct}%)
                  </span>
                </div>
                <Progress
                  percent={providerBreakdown.vnpay.pct}
                  strokeColor="#13c2c2"
                  trailColor="#f5f5f5"
                  strokeWidth={8}
                  showInfo={false}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* PHÂN TÍCH THEO NGUỒN DOANH THU */}
          <div>
            <h4 className="font-semibold text-gray-500 mb-3 text-sm">Theo nguồn doanh thu</h4>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 text-xs">
                    <Tag color="blue">Đặt sân</Tag> ({sourceBreakdown.booking.count} GD)
                  </span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatMoney(sourceBreakdown.booking.amount)} ({sourceBreakdown.booking.pct}%)
                  </span>
                </div>
                <Progress
                  percent={sourceBreakdown.booking.pct}
                  strokeColor="#1890ff"
                  trailColor="#f5f5f5"
                  strokeWidth={8}
                  showInfo={false}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 text-xs">
                    <Tag color="orange">Bán hàng/POS</Tag> ({sourceBreakdown.order.count} GD)
                  </span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatMoney(sourceBreakdown.order.amount)} ({sourceBreakdown.order.pct}%)
                  </span>
                </div>
                <Progress
                  percent={sourceBreakdown.order.pct}
                  strokeColor="#fa8c16"
                  trailColor="#f5f5f5"
                  strokeWidth={8}
                  showInfo={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
