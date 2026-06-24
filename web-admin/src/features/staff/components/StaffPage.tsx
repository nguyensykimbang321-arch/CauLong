import React, { useState } from 'react';
import { Card, Button, Input, Space, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { StaffTable } from './StaffTable';
import { StaffFormModal } from './StaffFormModal';
import { useStaffs } from '../hooks/useStaffs';

const { Title } = Typography;

export const StaffPage: React.FC = () => {
  const { staffs, isLoading, fetchStaffs, toggleLockStatus, updateParams } = useStaffs();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex justify-between items-center">
          <Title level={3} className="m-0">Quản lý tài khoản hệ thống</Title>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)} className="bg-blue-600">
            Thêm tài khoản
          </Button>
        </div>

        <Card className="shadow-sm">
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
            style={{ width: 400 }}
            size="large"
          />
        </Card>

        <StaffTable staffs={staffs} loading={isLoading} onToggleStatus={toggleLockStatus} />

        <StaffFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchStaffs} />
      </Space>
    </div>
  );
};