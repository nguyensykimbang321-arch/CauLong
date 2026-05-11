import { useEffect, useState } from "react";
import { Button, Form, InputNumber, message, Modal, Select, TimePicker } from "antd";
import type { AxiosError } from "axios";
import dayjs from "dayjs";
import type { ApiErrorResponse } from "../../../types/api.type";
import { PriceConfigService } from "../services/priceConfig.service";
import type { PriceConfig, PriceConfigPayload } from "../types/priceConfig.type";
import type { Facility } from "../../facility/types/facility.type";

interface PriceConfigModalProps {
  open: boolean;
  config?: PriceConfig | null;
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

const PriceConfigModal: React.FC<PriceConfigModalProps> = ({ open, config, facilities, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!config;

  useEffect(() => {
    if (open) {
      if (config) {
        form.setFieldsValue({
          ...config,
          time_range: [dayjs(config.start_time, "HH:mm:ss"), dayjs(config.end_time, "HH:mm:ss")]
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, config, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const payload: PriceConfigPayload = {
        facility_id: values.facility_id,
        court_type: values.court_type,
        start_time: values.time_range[0].format("HH:mm:ss"),
        end_time: values.time_range[1].format("HH:mm:ss"),
        price_per_hour: values.price_per_hour
      };

      if (isEdit && config) {
        await PriceConfigService.updateConfig(config.id, payload);
        message.success("Cập nhật giá thành công");
      } else {
        await PriceConfigService.createConfig(payload);
        message.success("Thêm cấu hình giá thành công");
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
      title={isEdit ? "Chỉnh sửa Cấu hình giá" : "Thêm Cấu hình giá mới"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Thuộc Cơ sở" name="facility_id" rules={[{ required: true, message: "Chọn cơ sở!" }]}>
          <Select 
            placeholder="-- Chọn cơ sở --"
            options={facilities.map(f => ({ label: f.name, value: f.id }))}
            showSearch optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item label="Loại sân áp dụng" name="court_type" rules={[{ required: true, message: "Chọn loại sân!" }]}>
          <Select placeholder="-- Chọn loại sân --" options={COURT_TYPES} />
        </Form.Item>

        <Form.Item label="Khung giờ áp dụng" name="time_range" rules={[{ required: true, message: "Chọn khung giờ!" }]}>
          <TimePicker.RangePicker className="w-full" format="HH:mm" minuteStep={15} />
        </Form.Item>

        <Form.Item label="Giá tiền mỗi giờ (VNĐ)" name="price_per_hour" rules={[{ required: true, message: "Nhập giá tiền!" }]}>
          <InputNumber
            className="w-full"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: any) => value!.replace(/\$\s?|(,*)/g, '')}
            addonAfter="VNĐ / Giờ"
            min={0}
            step={10000}
          />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? "Cập nhật" : "Tạo mới"}</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PriceConfigModal;