import { useEffect, useState } from "react";
import { Button, Card, Input, message, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { Court } from "../types/court.type";
import type { Facility } from "../../facility/types/facility.type";
import { CourtService } from "../services/court.service";
import { FacilityService } from "../../facility/services/facility.service";
import CourtModal from "./CourtModal";


const COURT_TYPE_LABELS: Record<string, string> = {
  badminton: "Cầu lông",
  tennis: "Tennis",
  football: "Bóng đá",
  table_tennis: "Bóng bàn",
};

const CourtPage = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterFacilityId, setFilterFacilityId] = useState<number | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [courtRes, facilityRes] = await Promise.all([
        CourtService.getAllCourts(),
        FacilityService.getAllFacilities(),
      ]);
      setCourts(courtRes.data);
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

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const res = await CourtService.getAllCourts();
      setCourts(res.data);
    } catch (error) {
      message.error("Lỗi khi tải danh sách sân");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await CourtService.deleteCourt(id);
      message.success("Xóa sân thành công");
      fetchCourts();
    } catch (error) {
      message.error("Lỗi xóa sân");
    }
  };

  const filteredCourts = courts.filter((court) => {
    const matchName = court.name.toLowerCase().includes(searchText.toLowerCase());

    const matchFacility = filterFacilityId ? court.facility_id === filterFacilityId : true;

    return matchName && matchFacility;
  });

  const columns: ColumnsType<Court> = [
    { title: "Mã", dataIndex: "id", key: "id", width: 80, render: (id) => <b>#{id}</b> },
    { 
      title: "Tên Sân", 
      dataIndex: "name", 
      key: "name", 
      render: (name) => <span className="font-semibold text-blue-600">{name}</span> 
    },
    { 
      title: "Thuộc Cơ sở", 
      key: "facility", 
      render: (_, record) => record.facility?.name || <span className="text-gray-400">N/A</span> 
    },
    { 
      title: "Loại sân", 
      dataIndex: "court_type", 
      key: "court_type",
      render: (type: string) => <Tag color="geekblue">{COURT_TYPE_LABELS[type] || type}</Tag>
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) => active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tạm ngưng</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" className="text-green-500" onClick={() => {
            setEditingCourt(record);
            setOpenModal(true);
          }}>
            Sửa
          </Button>
          <Popconfirm title="Xóa sân này?" okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
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
          <Title level={3} className="!mb-0!">Quản lý Sân</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingCourt(null);
            setOpenModal(true);
          }}>
            Thêm Sân mới
          </Button>
        </div>

        <div className="flex gap-4 mb-5 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <Input
            placeholder="Tìm kiếm theo tên sân..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e: any) => setSearchText(e.target.value)}
            className="w-64"
            allowClear
          />

          <Select
            placeholder="Lọc theo Cơ sở"
            value={filterFacilityId}
            onChange={(value: number) => setFilterFacilityId(value)}
            className="w-64"
            allowClear // Cho phép bấm nút (x) để xóa bộ lọc
            showSearch // Cho phép gõ để tìm kiếm cơ sở cho nhanh
            optionFilterProp="label"
            options={[
              // Cấu hình danh sách option từ mảng facilities đã gọi API
              ...facilities.map(f => ({ label: f.name, value: f.id }))
            ]}
          />
        </div>

        <Table rowKey="id" columns={columns} dataSource={filteredCourts} loading={loading} />
      </Card>

      <CourtModal
        open={openModal}
        court={editingCourt}
        facilities={facilities}
        onClose={() => { setOpenModal(false); setEditingCourt(null); }}
        onSuccess={fetchCourts}
      />
    </>
  );
};

export default CourtPage;