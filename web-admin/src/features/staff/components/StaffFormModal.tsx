import React from 'react';
import { Modal, Form, Input, Select, Button, Row, Col } from 'antd';
import { useStaffForm } from '../hooks/useStaffForm';

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({ open, onClose, onSuccess }) => {
  const { form, loading, handleSubmit } = useStaffForm({
    open,
    onClose,
    onSuccess,
    initialData: null, // Luôn là null vì đã bỏ chức năng sửa
  });

  return (
    <Modal title="Thêm tài khoản mới" open={open} onCancel={onClose} footer={null} width={600} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <Row gutter={16}>
          <Col span={12}><Form.Item name="last_name" label="Họ và tên đệm" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="first_name" label="Tên" rules={[{ required: true }]}><Input /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}><Input /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="role" label="Vai trò hệ thống" rules={[{ required: true }]}>
              <Select placeholder="Chọn vai trò">
                <Select.Option value="admin">Quản trị viên</Select.Option>
                <Select.Option value="staff">Nhân viên</Select.Option>
                <Select.Option value="customer">Khách hàng</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}><Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}><Input.Password /></Form.Item></Col>
        </Row>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="bg-blue-600">Tạo tài khoản</Button>
        </div>
      </Form>
    </Modal>
  );
};