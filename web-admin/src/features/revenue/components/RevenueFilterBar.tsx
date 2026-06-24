import React, { useEffect, useState } from 'react';
import { DatePicker, Select, Card, Button } from 'antd';
import dayjs from 'dayjs';
import { FacilityService } from '../../facility/services/facility.service';
import type { Facility } from '../../facility/types/facility.type';
import type { RevenueGroupBy, RevenueProvider, RevenueSource } from '../types/revenue.types';

const { RangePicker } = DatePicker;

interface RevenueFilterBarProps {
  from: string;
  to: string;
  groupBy: RevenueGroupBy;
  provider: RevenueProvider | 'all';
  source: RevenueSource | 'all';
  facilityId: number | undefined;
  onDateRangeChange: (dates: [string, string]) => void;
  onGroupByChange: (group: RevenueGroupBy) => void;
  onProviderChange: (prov: RevenueProvider | 'all') => void;
  onSourceChange: (src: RevenueSource | 'all') => void;
  onFacilityChange: (id: number | undefined) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const RevenueFilterBar: React.FC<RevenueFilterBarProps> = ({
  from,
  to,
  groupBy,
  provider,
  source,
  facilityId,
  onDateRangeChange,
  onGroupByChange,
  onProviderChange,
  onSourceChange,
  onFacilityChange,
  onRefresh,
  loading,
}) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [fetchingFacilities, setFetchingFacilities] = useState<boolean>(false);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setFetchingFacilities(true);
        const res = await FacilityService.getAllFacilities();
        if (res.success) {
          setFacilities(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách cơ sở:', err);
      } finally {
        setFetchingFacilities(false);
      }
    };
    fetchFacilities();
  }, []);

  const handleRangeChange = (
    values: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ) => {
    if (values && values[0] && values[1]) {
      onDateRangeChange([values[0].format('YYYY-MM-DD'), values[1].format('YYYY-MM-DD')]);
    }
  };

  return (
    <Card bordered={false} className="shadow-sm mb-6 border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Khoảng ngày:</span>
            <RangePicker
              value={[dayjs(from), dayjs(to)]}
              onChange={handleRangeChange}
              allowClear={false}
              format="DD/MM/YYYY"
              className="w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Cơ sở:</span>
            <Select
              placeholder="Chọn cơ sở"
              value={facilityId}
              onChange={onFacilityChange}
              loading={fetchingFacilities}
              allowClear
              className="w-52"
              options={[
                { value: undefined, label: 'Toàn hệ thống (Tất cả)' },
                ...facilities.map((fac) => ({
                  value: fac.id,
                  label: fac.name,
                })),
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Nhóm theo:</span>
            <Select
              value={groupBy}
              onChange={onGroupByChange}
              className="w-32"
              options={[
                { value: 'day', label: 'Theo ngày' },
                { value: 'month', label: 'Theo tháng' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Thanh toán:</span>
            <Select
              value={provider}
              onChange={onProviderChange}
              className="w-32"
              options={[
                { value: 'all', label: 'Tất cả PTTT' },
                { value: 'cash', label: 'Tiền mặt' },
                { value: 'vnpay', label: 'VNPay' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Nguồn:</span>
            <Select
              value={source}
              onChange={onSourceChange}
              className="w-36"
              options={[
                { value: 'all', label: 'Tất cả nguồn' },
                { value: 'booking', label: 'Đặt sân' },
                { value: 'order', label: 'Bán hàng/POS' },
              ]}
            />
          </div>
        </div>

        <Button
          type="primary"
          onClick={onRefresh}
          loading={loading}
          className="bg-blue-600 hover:bg-blue-500"
        >
          Làm mới
        </Button>
      </div>
    </Card>
  );
};
