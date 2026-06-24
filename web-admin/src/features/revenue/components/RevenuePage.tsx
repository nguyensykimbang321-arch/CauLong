import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button, Alert, Card, Table, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../auth/store/auth.store';
import { useRevenue } from '../hooks/useRevenue';
import { RevenueFilterBar } from './RevenueFilterBar';
import { RevenueSummaryCards } from './RevenueSummaryCards';
import { RevenueBreakdown } from './RevenueBreakdown';
import { RevenueTable } from './RevenueTable';

export const RevenuePage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/booking/schedule" replace />;
  }

  const {
    filters,
    pagination,
    summary,
    chartData,
    breakdown,
    transactions,
    loading,
    error,
    refresh,
    handleDateRangeChange,
    handleGroupByChange,
    handleProviderChange,
    handleSourceChange,
    handleFacilityChange,
    handlePageChange,
  } = useRevenue();

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents || 0);
  };

  const chartColumns = [
    {
      title: filters.groupBy === 'day' ? 'Ngày' : 'Tháng',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_amount_cents',
      key: 'total_amount_cents',
      align: 'right' as const,
      render: (amount: number) => <span className="font-bold text-emerald-600">{formatMoney(amount)}</span>,
    },
    {
      title: 'Số giao dịch',
      dataIndex: 'total_transactions',
      key: 'total_transactions',
      align: 'center' as const,
      render: (count: number) => `${count} GD`,
    },
  ];

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <Typography.Title level={4} style={{ margin: 0 }}>Thống kê doanh thu đặt sân</Typography.Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={refresh}
          loading={loading}
          type="text"
          className="text-gray-500 hover:text-blue-600"
        >
          Làm mới dữ liệu
        </Button>
      </div>

      {error && (
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          className="mb-6"
          action={
            <Button size="small" danger onClick={refresh}>
              Thử lại
            </Button>
          }
        />
      )}

      <RevenueFilterBar
        from={filters.from}
        to={filters.to}
        groupBy={filters.groupBy}
        provider={filters.provider}
        source={filters.source}
        facilityId={filters.facilityId}
        onDateRangeChange={handleDateRangeChange}
        onGroupByChange={handleGroupByChange}
        onProviderChange={handleProviderChange}
        onSourceChange={handleSourceChange}
        onFacilityChange={handleFacilityChange}
        onRefresh={refresh}
        loading={loading}
      />

      <RevenueSummaryCards data={summary} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <Card
            title={`Doanh thu chi tiết (Nhóm theo ${filters.groupBy === 'day' ? 'ngày' : 'tháng'})`}
            bordered={false}
            className="shadow-sm border border-gray-100"
          >
            <Table
              dataSource={chartData}
              columns={chartColumns}
              rowKey="label"
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </div>
        <div>
          <RevenueBreakdown data={breakdown} loading={loading} />
        </div>
      </div>

      <RevenueTable
        data={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default RevenuePage;
