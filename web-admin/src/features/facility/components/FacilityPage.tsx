import { useEffect, useState } from "react"
import type { Facility } from "../types/facility.type";
import { FacilityService } from "../services/facility.service";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../../types/api.type";
import { Button, Card, Image, message, Popconfirm, Radio, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import FacilityModal from "./FacilityModal";

const FacilityPage = () => {
    const [facility, setFacility] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

    const fetchFacility = async () => {
        try {
            setLoading(true);
            let response;
            if (viewMode === 'active') {
                response = await FacilityService.getAllFacilities();
            } else {
                response = await FacilityService.getDeletedFacilities();
            }
            setFacility(response.data)
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            message.error(err.message);
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFacility();
    }, [viewMode])

    const handleDelete = async (id: number) => {
        try {
            await FacilityService.deleteFacility(id);
            message.success("Xóa cơ sở thành công")

            fetchFacility();
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>
            message.error(err.message || "Lỗi xóa cơ sở")
        }
    }

    const handleRestore = async (id: number) => {
        try {
            await FacilityService.restoreFacility(id);
            message.success("Đã khôi phục cơ sở thành công!");
            fetchFacility(); // Tải lại bảng thùng rác
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            message.error(err.message || "Lỗi khôi phục cơ sở");
        }
    }


    const columns: ColumnsType<Facility> = [
        {
        title: "Mã cơ sở",
        dataIndex: "id",
        key: "id",
        width: 120,
        render: (id: number) => <b>#{id}</b>,
        },

        {
        title: "Tên cơ sở",
        dataIndex: "name",
        key: "name",
        render: (name: string) => (
            <span className="font-semibold text-blue-600">
            {name}
            </span>
        ),
        },

        {
        title: "Ảnh cơ sở",
        dataIndex: "avatar_url",
        key: "avatar_url",
        width: 140,
        render: (url: string | null) => (
            <Image
            src={
                url ||
                "https://placehold.co/100x70?text=No+Image"
            }
            width={100}
            height={70}
            className="rounded object-cover"
            />
        ),
        },

        {
        title: "Địa chỉ",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
        },

        {
        title: "Giờ mở cửa",
        dataIndex: "open_time",
        key: "open_time",
        width: 100,
        render: (time: string) => time.slice(0, 5),
        },

        {
        title: "Giờ đóng cửa",
        dataIndex: "close_time",
        key: "close_time",
        width: 100,
        render: (time: string) => time.slice(0, 5),
        },

        {
        title: "Trạng thái",
        dataIndex: "is_active",
        key: "is_active",
        width: 120,
        render: (active: boolean, record: Facility) => {
            // Nếu đang ở thùng rác, báo đỏ luôn
            if (record.deleted_at) return <Tag color="default">Đã xóa</Tag>;
            return active ? <Tag color="green">Đang hoạt động</Tag> : <Tag color="red">Ngưng hoạt động</Tag>;
        },
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record: Facility) => {
                // 🔥 NẾU ĐANG Ở THÙNG RÁC -> CHỈ HIỆN NÚT KHÔI PHỤC
                if (viewMode === 'trash') {
                    return (
                        <Popconfirm
                            title="Khôi phục cơ sở"
                            description="Khôi phục cơ sở này cùng với các sân và kho liên quan?"
                            okText="Khôi phục"
                            cancelText="Hủy"
                            onConfirm={() => handleRestore(record.id)}
                        >
                            <Button type="primary" ghost icon={<ReloadOutlined />}>
                                Khôi phục
                            </Button>
                        </Popconfirm>
                    )
                }

                // 🔥 NẾU Ở DANH SÁCH BÌNH THƯỜNG -> HIỆN SỬA & XÓA
                return (
                    <Space size="middle">
                        <Button type="text" className="text-green-500" onClick={() => { setEditingFacility(record); setOpenModal(true); }}>
                            Sửa
                        </Button>

                        <Popconfirm title="Xóa cơ sở" description="Bạn có chắc muốn xóa cơ sở này?" okText="Xóa" cancelText="Hủy" okButtonProps={{danger: true}} onConfirm={() => handleDelete(record.id)}>
                            <Button danger type="text" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                )
            }
        }
    ];

    return(
        <>
        <Card>
            <div className="flex items-center justify-between mb-5">
            <Title level={3} className="!mb-0!">
                Danh sách cơ sở
            </Title>

            <Space>
                    <Radio.Group 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="active">Danh sách</Radio.Button>
                        <Radio.Button value="trash">Thùng rác</Radio.Button>
                    </Radio.Group>

                    {/* Chỉ hiện nút Thêm mới khi ở tab Danh sách */}
                    {viewMode === 'active' && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingFacility(null); setOpenModal(true); }}>
                            Thêm cơ sở
                        </Button>
                    )}
                </Space>
            </div>

        <Table
            rowKey="id"
            columns={columns}
            dataSource={facility}
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{
            pageSize: 10,
            showSizeChanger: true,
            }}
        />
        </Card>

        <FacilityModal
            open={openModal}
            facility={editingFacility}
            onClose={() => {
            setOpenModal(false);
            setEditingFacility(null);
            }}
            onSuccess={fetchFacility}
        />
        </>
    )
}
export default FacilityPage