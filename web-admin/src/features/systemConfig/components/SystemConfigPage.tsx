import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { SystemConfigService } from '../services/systemConfig.service';
import type { SystemConfig, UpdateSystemConfigPayload } from '../types/systemConfig.type';

interface FormValues {
  key: string;
  value: string;
  data_type: 'number' | 'string' | 'boolean';
  description: string;
}

const SystemConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<FormValues>();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await SystemConfigService.getAllConfigs();
      setConfigs(res.data);
    } catch {
      message.error('Lỗi khi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleOpenModal = (record?: SystemConfig) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        key: record.key,
        value: record.value,
        data_type: record.data_type,
        description: record.description || '',
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (editingId) {
        const payload: UpdateSystemConfigPayload = {
          value: values.value,
          description: values.description,
        };
        await SystemConfigService.updateConfig(editingId, payload);
        message.success('Cập nhật cấu hình thành công!');
      } else {
        await SystemConfigService.createConfig(values);
        message.success('Thêm cấu hình mới thành công!');
      }
      setIsModalOpen(false);
      fetchConfigs();
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
      await SystemConfigService.deleteConfig(id);
      message.success('Xóa cấu hình thành công!');
      fetchConfigs();
    } catch {
      message.error('Lỗi khi xóa');
    }
  };

  const columns = [
    { 
      title: 'Key', 
      dataIndex: 'key', 
      key: 'key',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    { 
      title: 'Giá trị (Value)', 
      dataIndex: 'value', 
      key: 'value',
      render: (text: string) => <span className="font-bold">{text}</span>
    },
    { title: 'Kiểu dữ liệu', dataIndex: 'data_type', key: 'data_type' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: SystemConfig) => (
        <Space>
          <Button type="text" className="text-blue-600" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm title="Xóa cấu hình này có thể gây lỗi hệ thống. Vẫn xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} disabled={true}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Cấu hình Tham Số Hệ Thống</h2>
          <p className="text-gray-500 text-sm">Cảnh báo: Chỉ thay đổi khi bạn thực sự hiểu rõ biến hệ thống! Để Thêm/Xóa cấu hình tham số hệ thống vui lòng liên hệ đến đội kỹ thuật</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} disabled={true}>
          Thêm Tham Số
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={configs} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? "Sửa Tham Số" : "Thêm Tham Số Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ data_type: 'number' }}>
          <Form.Item 
            label="Khóa cấu hình (Key)" 
            name="key" 
            rules={[{ required: true, message: 'Nhập Key' }]}
            help="Chỉ dùng CHỮ IN HOA và DẤU GẠCH DƯỚI (VD: STUDENT_DISCOUNT)"
          >
            <Input disabled={!!editingId} /> 
          </Form.Item>

          <Form.Item label="Giá trị (Value)" name="value" rules={[{ required: true, message: 'Nhập giá trị' }]}>
            <Input />
          </Form.Item>

          {!editingId && (
            <Form.Item label="Kiểu dữ liệu" name="data_type">
              <Select>
                <Select.Option value="number">Số (Number)</Select.Option>
                <Select.Option value="string">Chuỗi (String)</Select.Option>
                <Select.Option value="boolean">Đúng/Sai (Boolean)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Mô tả công dụng" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả cho người khác dễ hiểu..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemConfigPage;
