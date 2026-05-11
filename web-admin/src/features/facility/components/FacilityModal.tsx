import { useForm } from "antd/es/form/Form";
import type { CreateFacilityPayload, Facility, FacilityFormValues } from "../types/facility.type";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FacilityService } from "../services/facility.service";
import { Button, Form, Input, message, Modal, Switch, TimePicker, Upload } from "antd";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../../types/api.type";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";

interface FacilityModalProps {
    open: boolean;
    facility?: Facility | null;

    onClose: () => void;
    onSuccess: () => void;
}

const FacilityModal: React.FC<FacilityModalProps> = ({
    open,
    facility,
    onClose,
    onSuccess
}) => {
    const [form] = useForm();

    const [loading, setLoading] = useState(false);

    const [uploadingImage,setUploadingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const isEdit = !! facility;

    useEffect(() => {
        if(open) {
            if(facility) {
                form.setFieldsValue({
                    ...facility,
                    open_time: facility.open_time ? dayjs(facility.open_time, "HH:mm:ss") : null,
                    close_time: facility.close_time ? dayjs(facility.close_time, "HH:mm:ss") : null,
                });
                setImageUrl(facility.avatar_url || "")
            }else{
                form.resetFields();
                setImageUrl("");
            }
        }
    },[open, facility])

    const handleSubmit = async (values: FacilityFormValues)=> {
        try {
            setLoading(true);
            const payload: CreateFacilityPayload = {
                name: values.name,

                address: values.address,

                avatar_url: imageUrl,

                open_time:values.open_time.format("HH:mm:ss"),

                close_time:values.close_time.format("HH:mm:ss"),

                is_active: values.is_active,
            };

            if(isEdit && facility) {
                await FacilityService.updateFacility(facility.id, payload)
                message.success("Cập nhật cơ sở thành công");
            }else{
                await FacilityService.createFacility(payload);
                message.success("Tạo cơ sở thành công");
            }
            form.resetFields();
            setImageUrl("");
            onSuccess();
            onClose();
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;

            message.error(
                err.response?.data?.message ||
                err.message ||
                "Có lỗi xảy ra"
            );
        }finally{
            setLoading(false);
        }
    }

    return(
        <>
        <Modal
            title={isEdit ? "Chỉnh sửa cơ sở" : "Thêm cơ sở mới"}
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Tên cơ sở"
                    name="name"
                    rules={[
                        {
                        required: true,
                        message: "Vui lòng nhập tên cơ sở",
                        },
                    ]}
                >
                    <Input placeholder="Nhập tên cơ sở..." />
                </Form.Item>

                <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[
                        {
                        required: true,
                        message: "Vui lòng nhập địa chỉ",
                        },
                    ]}
                >
                <Input.TextArea
                    rows={3}
                    placeholder="Nhập địa chỉ..."
                />
                </Form.Item>

                <Form.Item label="Ảnh cơ sở" name="avatar_url">
                <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    customRequest={async (options) => {
                    const { file, onSuccess, onError } = options;
                    try {
                        setUploadingImage(true);
                        const res = await FacilityService.uploadImage(file as File);
                        
                        const newImageUrl = res.data.url;
                        setImageUrl(newImageUrl);
                        
                        form.setFieldValue('avatar_url', newImageUrl);
                        
                        if (onSuccess) onSuccess("ok");
                        message.success('Upload ảnh thành công!');
                    } catch (err) {
                        if (onError) onError(new Error('Upload thất bại'));
                        message.error('Lỗi khi upload ảnh');
                    } finally {
                        setUploadingImage(false);
                    }
                    }}
                    beforeUpload={(file) => {
                        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                        if (!isJpgOrPng) message.error('Chỉ hỗ trợ file JPG/PNG!');
                        const isLt2M = file.size / 1024 / 1024 < 2;
                        if (!isLt2M) message.error('Ảnh phải nhỏ hơn 2MB!');
                        return isJpgOrPng && isLt2M;
                    }}
                >
                    {imageUrl ? (
                    <img src={imageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                    <div>
                        {uploadingImage ? <LoadingOutlined /> : <PlusOutlined />}
                        <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                    </div>
                    )}
                </Upload>
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        label="Giờ mở cửa"
                        name="open_time"
                        rules={[
                        {
                            required: true,
                            message: "Chọn giờ mở cửa",
                        },
                        ]}
                    >
                        <TimePicker
                            className="w-full"
                            format="HH:mm"
                        />
                    </Form.Item>
                    
                    <Form.Item
                        label="Giờ đóng cửa"
                        name="close_time"
                        rules={[
                        {
                            required: true,
                            message: "Chọn giờ đóng cửa",
                        },
                        ]}
                    >
                        <TimePicker
                            className="w-full"
                            format="HH:mm"
                        />
                    </Form.Item>

                     <Form.Item
                        label="Trạng thái hoạt động"
                        name="is_active"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch />
                    </Form.Item>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button onClick={onClose}>
                        Hủy
                    </Button>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                    >
                        {isEdit ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </div>

            </Form>
        </Modal>
        </>
    )
}


export default FacilityModal;