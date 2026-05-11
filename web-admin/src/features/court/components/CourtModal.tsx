import { useEffect, useState } from "react";
import { Button, Form, Input, message, Modal, Select, Switch } from "antd";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../../types/api.type";
import type { Court, CourtPayload } from "../types/court.type";
import { CourtService } from "../services/court.service";
import type { Facility } from "../../facility/types/facility.type";

interface CourtModalProps {
  open: boolean;
  court?: Court | null;
  facilities: Facility[];
  onClose: () => void;
  onSuccess: () => void;
}

const COURT_TYPES = [
  { label: "Sân Cầu lông", value: "badminton" },
  { label: "Sân Tennis", value: "tennis" },
  { label: "Sân Bóng đá", value: "football" },
  { label: "Bàn Bóng bàn", value: "table_tennis" },
];

const CourtModal: React.FC<CourtModalProps> = ({ open, court, facilities, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!court;

  useEffect(() => {
    if (open) {
      if (court) {
        form.setFieldsValue(court);
      } else {
        form.resetFields();
      }
    }
  }, [open, court, form]);

  const handleSubmit = async (values: CourtPayload) => {
    try {
      setLoading(true);
      if (isEdit && court) {
        await CourtService.updateCourt(court.id, values);
        message.success("Cập nhật sân thành công");
      } else {
        await CourtService.createCourt(values);
        message.success("Thêm sân mới thành công");
      }
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      message.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa thông tin Sân" : "Thêm Sân mới"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        
        {/* CHỌN CƠ SỞ */}
        <Form.Item
          label="Thuộc Cơ sở"
          name="facility_id"
          rules={[{ required: true, message: "Vui lòng chọn cơ sở" }]}
        >
          <Select 
            placeholder="-- Chọn cơ sở --"
            options={facilities.map(f => ({ label: f.name, value: f.id }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        {/* TÊN SÂN */}
        <Form.Item
          label="Tên Sân"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên sân" }]}
        >
          <Input placeholder="Ví dụ: Sân Cầu Lông Số 1" />
        </Form.Item>

        {/* LOẠI SÂN */}
        <Form.Item
          label="Loại sân"
          name="court_type"
          rules={[{ required: true, message: "Vui lòng chọn loại sân" }]}
        >
          <Select placeholder="-- Chọn loại sân --" options={COURT_TYPES} />
        </Form.Item>

        {/* TRẠNG THÁI */}
        <Form.Item
          label="Trạng thái hoạt động"
          name="is_active"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CourtModal;