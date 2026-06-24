import React from 'react';
import { Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Divider, Alert, Tag, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useBookingForm } from '../hooks/useBookingForm'; // Import hook vừa tạo

interface CreateBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    facility_id?: number;
    court_type?: string;
    court_id?: number;
    play_date?: dayjs.Dayjs | string;
    start_time?: string;
  } | null;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ open, onClose, onSuccess, initialData }) => {
  const {
    form, loading, searchingPhone, isExistingUser, foundCustomer, facilities, availableCourtTypes, courts,
    staffFacilityId, selectedCourtId, selectedCourtType, selectedDate, selectedFacilityId,
    currentCourtBookedSlots, handleSearchPhone, checkBookingTimes, handleSubmit
  } = useBookingForm({ open, onSuccess, onClose, initialData });

  const formatCourtTypeLabel = (type: string) => {
    switch (type) {
      case 'badminton': return 'Sân Cầu Lông';
      case 'tennis': return 'Sân Tennis';
      case 'football': return 'Sân Bóng Đá';
      case 'basketball': return 'Sân Bóng Rổ';
      case 'standard': return 'Sân Thường'; // Giữ lại cho chắc
      case 'vip': return 'Sân VIP';         // Giữ lại cho chắc
      default: return type.toUpperCase();
    }
  };

  return (
    <Modal
      title="Tạo Đơn Đặt Sân Mới (Hotline/Vãng lai)"
      open={open}
      width={750}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Chốt Đơn"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Số điện thoại Khách" name="phone" rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
              <Input 
                placeholder="Gõ SĐT rồi bấm ra ngoài..." 
                onBlur={(e) => handleSearchPhone(e.target.value)}
                onPressEnter={(e: any) => handleSearchPhone(e.target.value)}
                disabled={searchingPhone}
                suffix={searchingPhone ? <Spin size="small" /> : <SearchOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Họ và tên" name="full_name">
              <Input placeholder="Nguyễn Văn A..." disabled={isExistingUser} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Loại khách hàng" name="membership_type" initialValue="standard">
              <Select placeholder="-- Chọn loại --" disabled={isExistingUser}>
                <Select.Option value="standard">Khách thường</Select.Option>
                <Select.Option value="student">Học sinh - Sinh viên</Select.Option>
                <Select.Option value="vip">Khách VIP</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {isExistingUser && foundCustomer && (
          <div className="mb-4">
            <Alert
              type="info"
              showIcon
              message={
                <span>
                  Khách hàng quen: <strong>{foundCustomer.full_name || 'Khách vãng lai'}</strong> - Điểm tích lũy: <strong>{foundCustomer.loyalty_points || 0} điểm</strong> (Hạng: <strong>{foundCustomer.membership_type.toUpperCase()}</strong>)
                </span>
              }
            />
          </div>
        )}

        <Divider />

        <Row gutter={16}>
          <Col span={10}>
            <Form.Item label="Chọn Cơ Sở" name="facility_id" rules={[{ required: true }]}>
              <Select placeholder="-- Chọn cơ sở --" disabled={!!staffFacilityId}>
                {facilities.map(fac => (
                  <Select.Option key={fac.id} value={fac.id}>{fac.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Loại sân" name="court_type" rules={[{ required: true }]}>
              <Select placeholder="-- Chọn loại --" disabled={!selectedFacilityId || availableCourtTypes.length === 0}>
                {availableCourtTypes.map(type => (
                  <Select.Option key={type} value={type}>
                    {formatCourtTypeLabel(type)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Chọn Sân" name="court_id" rules={[{ required: true }]}>
              <Select placeholder="-- Chọn sân --" disabled={!selectedCourtType || courts.length === 0}>
                {courts.map(court => (
                  <Select.Option key={court.id} value={court.id}>{court.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Ngày chơi" name="play_date" rules={[{ required: true }]}>
              <DatePicker className="w-full" format="YYYY/MM/DD" disabledDate={(current) => current && current < dayjs().startOf('day')} />
            </Form.Item>
          </Col>
        </Row>

        {selectedCourtId && selectedDate && (
          <div className="mb-4">
            {currentCourtBookedSlots.length > 0 ? (
              <Alert 
                type="warning" showIcon 
                message={<span className="font-semibold">Lưu ý: Sân này đã có khách đặt các ca sau:</span>}
                description={
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentCourtBookedSlots.map((slot, index) => (
                      <Tag color="red" key={index} className="text-sm">
                        {slot.start_time} - {slot.end_time}
                      </Tag>
                    ))}
                  </div>
                }
              />
            ) : (
              <Alert type="success" showIcon message="Sân này hiện đang trống cả ngày!" />
            )}
          </div>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Giờ bắt đầu" name="start_time" dependencies={['end_time']}
              rules={[{ required: true, message: 'Chọn giờ bắt đầu!' }, { validator: checkBookingTimes }]}
            >
              <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="Giờ kết thúc" name="end_time" dependencies={['start_time']}
              rules={[{ required: true, message: 'Chọn giờ kết thúc!' }, { validator: checkBookingTimes }]}
            >
              <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateBookingModal;