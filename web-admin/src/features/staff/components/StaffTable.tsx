import React from 'react';
import { Table, Tag, Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Staff } from '../types/staff.types';

interface StaffTableProps {
  staffs: Staff[];
  loading: boolean;
  onToggleStatus: (id: number) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({ staffs, loading, onToggleStatus }) => {
  const columns: ColumnsType<Staff> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col text-xs">
          <span>{record.email}</span>
          <span className="text-gray-400">{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      sorter: (a, b) => a.role.localeCompare(b.role),
      render: (role: string) => {
        const roleMap: Record<string, string> = { admin: 'Admin', staff: 'Nhân viên', customer: 'Khách hàng' };
        const colorMap: Record<string, string> = { admin: 'red', staff: 'blue', customer: 'green' };
        return <Tag color={colorMap[role]}>{roleMap[role] || role}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title={record.is_active ? "Bạn có chắc chắn muốn khóa tài khoản này?" : "Mở khóa tài khoản này?"}
          onConfirm={() => onToggleStatus(record.id)}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <Button type="link" danger={record.is_active} className="p-0">
            {record.is_active ? "Khóa" : "Mở khóa"}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={staffs} 
      rowKey="id" 
      loading={loading} 
      pagination={{ pageSize: 10 }}
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
    />
  );
};