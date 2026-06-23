import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Tag, Space, message, Modal, Radio } from 'antd';
import { QRCode } from "react-qr-code";
import type { Order } from '../types/sale.types';
import { PosService } from '../services/sale.api';
import { socket } from '../../../config/socket';

const getStatusText = (status?: string) => {
  switch (status) {
    case 'completed': return 'Hoàn thành';
    case 'pending_payment': return 'Chờ thanh toán';
    case 'pending_pickup': return 'Chờ lấy hàng';
    case 'cancelled': return 'Đã hủy';
    case 'expired': return 'Hết hạn';
    case 'refunded': return 'Hoàn tiền';
    default: return status || 'Không xác định';
  }
};

const OrderManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending_pickup');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // States for Detail View
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // States for Payment
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vnpay'>('cash');
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // States for Refund
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundOrderTarget, setRefundOrderTarget] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefundLoading, setIsRefundLoading] = useState(false);

  // Hàm "Bắt cầu" - Lấy dữ liệu theo Tab hiện tại
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let res;
      if (activeTab === 'pending_pickup') {
        res = await PosService.getPendingPickup();
        setOrders(res.data);
      } else if (activeTab === 'pending_payment') {
        res = await PosService.getPendingPayment();
        setOrders(res.data);
      } else if (activeTab === 'cancelled') {
        res = await PosService.getAllOrders();
        // Lọc ra các đơn bị hủy hoặc hết hạn
        setOrders(res.data.filter((o: Order) => o.status === 'cancelled' || o.status === 'expired'));
      } else {
        res = await PosService.getAllOrders();
        setOrders(res.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Cứ mỗi khi đổi Tab thì gọi lại API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [activeTab]);

  // Lắng nghe Socket để realtime tải lại danh sách
  useEffect(() => {
    const handleOrderUpdate = () => {
      fetchOrders();
    };

    socket.on('order', handleOrderUpdate); // Nhận đơn mới từ app
    socket.on('order_changed', handleOrderUpdate); // Đơn bị cập nhật trạng thái

    return () => {
      socket.off('order', handleOrderUpdate);
      socket.off('order_changed', handleOrderUpdate);
    };
  }, [activeTab]);

  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const res = await PosService.getOrderById(order.id);
      setOrderDetails(res.data);
    } catch (err) {
      message.error("Lỗi khi tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenPayment = (order: Order) => {
    setPaymentOrder(order);
    setPaymentMethod('cash');
    setPaymentModalVisible(true);
  };

  const handleProcessPayment = async () => {
    if (!paymentOrder) return;
    setIsCheckoutLoading(true);
    try {
      if (paymentMethod === 'cash') {
        await PosService.payCash(paymentOrder.id);
        message.success('Đã xác nhận thu tiền mặt!');
        setPaymentModalVisible(false);
        setPaymentOrder(null);
        fetchOrders();
      } else {
        const res = await PosService.getVNPayUrl(paymentOrder.id);
        setPaymentUrl(res.data.paymentUrl);
        setPaymentModalVisible(false);
        setQrVisible(true);
        message.info("Vui lòng quét QR để thanh toán");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi xử lý thanh toán");
    } finally {
      if (paymentMethod === 'cash') setIsCheckoutLoading(false);
    }
  };

  // POLLING VNPay
  useEffect(() => {
    if (!qrVisible || !paymentOrder) return;

    const interval = setInterval(async () => {
      try {
        const res = await PosService.getOrderById(paymentOrder.id);
        const order = res.data;

        if (order.status === "pending_pickup") {
          setQrVisible(false);
          setPaymentOrder(null);
          setPaymentUrl("");
          message.success("Thanh toán VNPay thành công");
          setIsCheckoutLoading(false);
          clearInterval(interval);
          fetchOrders();
        }
      } catch (error) {
        console.error(error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [qrVisible, paymentOrder]);

  const handleComplete = async (orderId: number) => {
    try {
      await PosService.completeOrder(orderId);
      message.success('Đơn hàng đã được giao thành công!');
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi hoàn thành đơn');
    }
  };

  const handleRefundClick = (orderId: number) => {
    setRefundOrderTarget(orderId);
    setRefundReason("");
    setRefundModalVisible(true);
  };

  const handleProcessRefund = async () => {
    if (!refundOrderTarget) return;
    if (!refundReason.trim()) {
      message.error("Vui lòng nhập lý do hoàn tiền!");
      return;
    }

    setIsRefundLoading(true);
    try {
      await PosService.refundOrder(refundOrderTarget, refundReason.trim());
      message.success('Đã hoàn tiền đơn hàng!');
      setRefundModalVisible(false);
      setRefundOrderTarget(null);
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi hoàn tiền đơn hàng');
    } finally {
      setIsRefundLoading(false);
    }
  };



  // Cấu hình các cột của Bảng (Table)
  const columns = [
    { title: 'Mã ĐH', dataIndex: 'id', key: 'id', render: (id: number) => `#${id}` },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';

        if (status === 'completed') color = 'green';
        else if (status === 'pending_payment') color = 'orange';
        else if (status === 'pending_pickup') color = 'blue';
        else if (status === 'cancelled' || status === 'expired') color = 'red';
        else if (status === 'refunded') color = 'purple';

        return <Tag color={color}>{getStatusText(status)}</Tag>;
      }
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_cents',
      key: 'total_cents',
      render: (cents: number) => `${(cents).toLocaleString('vi-VN')} VNĐ`
    },
    {
      title: 'Kiểu nhận',
      dataIndex: 'pickup_type',
      key: 'pickup_type',
      render: (type: string) => type === 'immediate' ? 'Nhận tại chỗ' : (type === 'pickup_store' ? 'Lấy tại quầy' : type)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Space size="middle">

          <Button onClick={() => handleViewDetail(record)}>
            Xem chi tiết
          </Button>

          {/* Nút hành động thay đổi linh hoạt theo trạng thái đơn */}
          {record.status === 'pending_payment' && (
            <Button type="primary" danger onClick={() => handleOpenPayment(record)}>
              Thanh toán
            </Button>
          )}

          {record.status === 'pending_pickup' && (
            <>
              <Button type="primary" onClick={() => handleComplete(record.id)}>
                Giao hàng
              </Button>
              <Button danger onClick={() => handleRefundClick(record.id)}>
                Hoàn tiền
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Xử lý Đơn hàng (App)</h1>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key); // THAY ĐỔI TAB (Lúc này useEffect sẽ tự chạy fetchOrders ở chế độ ẩn)
        }}
        items={[
          { key: 'pending_pickup', label: 'Chờ lấy hàng' },
          { key: 'pending_payment', label: 'Chờ thanh toán' },
          { key: 'cancelled', label: 'Đơn bị hủy' },
          { key: 'all', label: 'Lịch sử' },
        ]}
      />

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?.id}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setOrderDetails(null);
        }}
        footer={null}
      >
        {detailLoading ? <p>Đang tải dữ liệu...</p> : (
          <div>
            <p><strong>Trạng thái:</strong> {getStatusText(orderDetails?.status)}</p>
            <p><strong>Thời gian đặt:</strong> {orderDetails?.created_at ? new Date(orderDetails.created_at).toLocaleString('vi-VN') : 'Không xác định'}</p>
            <p><strong>Kiểu nhận:</strong> {orderDetails?.pickup_type === 'immediate' ? 'Nhận tại chỗ' : (orderDetails?.pickup_type === 'pickup_store' ? 'Lấy tại quầy' : orderDetails?.pickup_type)}</p>
            <p><strong>Thời gian nhận hàng:</strong> {orderDetails?.pickup_time ? new Date(orderDetails.pickup_time).toLocaleString('vi-VN') : 'Không có'}</p>
            <p><strong>Hạn chót giữ hàng:</strong> {orderDetails?.reservation_expires_at ? new Date(orderDetails.reservation_expires_at).toLocaleString('vi-VN') : 'Không có'}</p>
            <p><strong>Tổng tiền:</strong> {orderDetails?.total_cents?.toLocaleString('vi-VN')} đ</p>
            <p><strong>Ghi chú:</strong> {orderDetails?.note || 'Không có'}</p>
            <h4 className="font-bold mt-4 mb-2">Sản phẩm:</h4>
            <ul className="list-disc pl-5">
              {orderDetails?.items?.map((item: any) => {
                const variant = item.variant;
                const product = variant?.product;
                const attributes = Object.entries(variant?.attributes || {})
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(", ");

                return (
                  <li key={item.id} className="mb-3 border-b border-gray-100 pb-2 last:border-b-0">
                    <div className="font-semibold text-blue-600">
                      {product?.name || `Variant ID: ${item.variant_id}`}
                    </div>
                    {variant && (
                      <div className="text-sm text-gray-500 my-1">
                        {variant.sku && <span className="mr-3">SKU: {variant.sku}</span>}
                        {attributes && <span>({attributes})</span>}
                      </div>
                    )}
                    <div className="mt-1">
                      Số lượng: <strong>{item.quantity}</strong>
                      <span className="mx-2">|</span>
                      Đơn giá: <strong>{item.unit_price_cents?.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Modal>

      <Modal
        title="Thanh toán đơn hàng"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleProcessPayment}
        confirmLoading={isCheckoutLoading}
        okText="Thanh toán"
        cancelText="Hủy"
      >
        <p className="mb-4">Chọn phương thức thanh toán cho đơn hàng <strong>#{paymentOrder?.id}</strong>:</p>
        <Radio.Group value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <Radio value="cash">Tiền mặt</Radio>
          <Radio value="vnpay">VNPay</Radio>
        </Radio.Group>
      </Modal>

      <Modal
        open={qrVisible}
        footer={null}
        centered
        destroyOnClose
        onCancel={() => {
          setQrVisible(false);
          setIsCheckoutLoading(false);
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3 className="mb-2 font-bold text-lg">Quét mã VNPay để thanh toán đơn #{paymentOrder?.id}</h3>
          <div className="flex justify-center my-4">
            <QRCode value={paymentUrl} size={250} />
          </div>
          <p className="mt-4 text-gray-500">Dùng ứng dụng ngân hàng hoặc ví điện tử quét mã QR</p>
        </div>
      </Modal>

      <Modal
        title="Nhập lý do hoàn tiền"
        open={refundModalVisible}
        onCancel={() => {
          setRefundModalVisible(false);
          setRefundReason("");
        }}
        onOk={handleProcessRefund}
        confirmLoading={isRefundLoading}
        okText="Xác nhận hoàn tiền"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p className="mb-2 text-gray-600">Vui lòng ghi rõ lý do để dễ dàng đối soát sau này. Tồn kho sẽ được tự động hoàn trả.</p>
        <div className="mt-2">
          <textarea
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="VD: Khách không đến lấy, Khách đổi ý..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default OrderManagementPage;