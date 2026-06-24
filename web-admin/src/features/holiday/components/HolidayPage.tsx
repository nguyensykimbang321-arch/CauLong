import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Holiday, HolidayPayload } from '../types/holiday.type';
import { HolidayService } from '../services/holiday.service';

interface FormValues {
  name: string;
  holiday_date: dayjs.Dayjs;
  surcharge_percent: number;
}

const HolidayPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<FormValues>();

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await HolidayService.getAllHolidays();
      setHolidays(res.data);
    } catch {
      message.error('Lỗi khi tải danh sách ngày lễ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenModal = (record?: Holiday) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        name: record.name,
        holiday_date: dayjs(record.holiday_date),
        surcharge_percent: record.surcharge_percent,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const payload: HolidayPayload = {
        name: values.name,
        holiday_date: values.holiday_date.format('YYYY-MM-DD'),
        surcharge_percent: values.surcharge_percent,
      };

      if (editingId) {
        await HolidayService.updateHoliday(editingId, payload);
        message.success('Cập nhật thành công!');
      } else {
        await HolidayService.createHoliday(payload);
        message.success('Thêm ngày lễ thành công!');
      }
      setIsModalOpen(false);
      fetchHolidays();
    } catch (error) {
      let errorMsg = 'Có lỗi xảy ra';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMsg = (error as { message: string }).message;
      }
      message.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await HolidayService.deleteHoliday(id);
      message.success('Xóa thành công!');
      fetchHolidays();
    } catch {
      message.error('Lỗi khi xóa');
    }
  };

  const columns = [
    { title: 'Tên Ngày Lễ', dataIndex: 'name', key: 'name', className: 'font-semibold' },
    { 
      title: 'Ngày áp dụng', 
      dataIndex: 'holiday_date', 
      key: 'holiday_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    { 
      title: 'Phụ thu (%)', 
      dataIndex: 'surcharge_percent', 
      key: 'surcharge_percent',
      render: (val: number) => <span className="text-red-500 font-bold">+{val}%</span>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Holiday) => (
        <Space>
          <Button type="text" className="text-blue-600" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Cấu hình Ngày Lễ</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm Ngày Lễ
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={holidays} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? "Sửa Ngày Lễ" : "Thêm Ngày Lễ Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Tên Ngày Lễ" name="name" rules={[{ required: true, message: 'Nhập tên lễ' }]}>
            <Input placeholder="VD: Giải phóng miền Nam" />
          </Form.Item>
          <Form.Item label="Ngày áp dụng" name="holiday_date" rules={[{ required: true, message: 'Chọn ngày' }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Phụ thu (%)" name="surcharge_percent" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={200} addonAfter="%" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HolidayPage;
