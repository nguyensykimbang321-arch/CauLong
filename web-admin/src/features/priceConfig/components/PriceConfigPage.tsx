import { useEffect, useState } from "react";
import { Button, Card, message, Popconfirm, Space, Table, Tag, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { PriceConfig } from "../types/priceConfig.type";
import type { Facility } from "../../facility/types/facility.type";
import { PriceConfigService } from "../services/priceConfig.service";
import { FacilityService } from "../../facility/services/facility.service";
import PriceConfigModal from "./PriceConfigModal";

const COURT_TYPE_LABELS: Record<string, string> = {
  badminton: "Cầu lông",
  tennis: "Tennis",
  football: "Bóng đá",
  table_tennis: "Bóng bàn",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const PriceConfigPage = () => {
  const [configs, setConfigs] = useState<PriceConfig[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PriceConfig | null>(null);

  const [filterFacilityId, setFilterFacilityId] = useState<number | null>(null);
  const [filterCourtType, setFilterCourtType] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [configRes, facilityRes] = await Promise.all([
        PriceConfigService.getAllConfigs(),
        FacilityService.getAllFacilities(),
      ]);
      setConfigs(configRes.data);
      setFacilities(facilityRes.data);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await PriceConfigService.getAllConfigs();
      setConfigs(res.data);
    } catch (error) {
      message.error("Lỗi cập nhật bảng giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await PriceConfigService.deleteConfig(id);
      message.success("Xóa cấu hình thành công");
      fetchConfigs();
    } catch (error) {
      message.error("Lỗi xóa cấu hình");
    }
  };

  const filteredConfigs = configs.filter((cfg) => {
    const matchFacility = filterFacilityId ? cfg.facility_id === filterFacilityId : true;
    const matchCourtType = filterCourtType ? cfg.court_type === filterCourtType : true;
    return matchFacility && matchCourtType;
  });

  const columns: ColumnsType<PriceConfig> = [
    { 
      title: "Cơ sở", 
      key: "facility", 
      render: (_, record) => <span className="font-semibold">{record.facility?.name}</span> 
    },
    { 
      title: "Loại sân", 
      dataIndex: "court_type", 
      render: (type: string) => <Tag color="blue">{COURT_TYPE_LABELS[type] || type}</Tag>
    },
    { 
      title: "Khung giờ", 
      key: "time", 
      render: (_, record) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
          {record.start_time.slice(0, 5)} - {record.end_time.slice(0, 5)}
        </span>
      )
    },
    { 
      title: "Đơn giá / Giờ", 
      dataIndex: "price_per_hour", 
      render: (price: number) => <span className="text-orange-600 font-bold">{formatCurrency(price)}</span>
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" className="text-green-500" onClick={() => { setEditingConfig(record); setOpenModal(true); }}>Sửa</Button>
          <Popconfirm title="Xóa mức giá này?" okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <Title level={3} className="!mb-0!">Cấu hình Bảng giá</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingConfig(null); setOpenModal(true); }}>
            Thêm Mức giá
          </Button>
        </div>

        <div className="flex gap-4 mb-5 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <Select
            placeholder="Lọc theo Cơ sở"
            value={filterFacilityId}
            onChange={setFilterFacilityId}
            className="w-64" allowClear showSearch optionFilterProp="label"
            options={facilities.map(f => ({ label: f.name, value: f.id }))}
          />
          <Select
            placeholder="Lọc theo Loại sân"
            value={filterCourtType}
            onChange={setFilterCourtType}
            className="w-48" allowClear
            options={Object.keys(COURT_TYPE_LABELS).map(key => ({ label: COURT_TYPE_LABELS[key], value: key }))}
          />
        </div>

        <Table rowKey="id" columns={columns} dataSource={filteredConfigs} loading={loading} />
      </Card>

      <PriceConfigModal
        open={openModal}
        config={editingConfig}
        facilities={facilities}
        onClose={() => { setOpenModal(false); setEditingConfig(null); }}
        onSuccess={fetchConfigs}
      />
    </>
  );
};

export default PriceConfigPage;