import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Col, List, Row, Space, Statistic, Tag, Typography, message } from 'antd';
import {
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { PosService } from '../../sale/services/sale.api';
import { BookingService } from '../../booking/services/booking.service';
import type { Order } from '../../sale/types/sale.types';
import type { Booking } from '../../booking/types/booking.types';
import { socket } from '../../../config/socket';
import {
  useStaffRealtime,
  type BookingSocketPayload,
  type OrderSocketPayload,
} from '../../../hooks/useStaffRealtime';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

type ActivityType = 'new_order' | 'order_changed' | 'new_booking' | 'booking_changed';

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  time: Date;
}

const getOrderStatusText = (status?: string) => {
  switch (status) {
    case 'completed': return 'Hoàn thành';
    case 'pending_payment': return 'Chờ thanh toán';
    case 'pending_pickup': return 'Chờ lấy hàng';
    case 'cancelled': return 'Đã hủy';
    case 'expired': return 'Hết hạn';
    case 'refunded': return 'Hoàn tiền';
    default: return status || 'Cập nhật';
  }
};

const getBookingStatusText = (status?: string) => {
  switch (status) {
    case 'pending': return 'Chờ xử lý';
    case 'confirmed': return 'Đã xác nhận';
    case 'cancelled': return 'Đã hủy';
    case 'completed': return 'Hoàn thành';
    case 'no_show': return 'Không đến';
    default: return status || 'Cập nhật';
  }
};

const getOrderStatusColor = (status?: string) => {
  switch (status) {
    case 'pending_payment': return 'orange';
    case 'pending_pickup': return 'blue';
    case 'completed': return 'green';
    case 'cancelled':
    case 'expired': return 'red';
    case 'refunded': return 'purple';
    default: return 'default';
  }
};

const getBookingStatusColor = (status?: string) => {
  switch (status) {
    case 'pending': return 'orange';
    case 'confirmed': return 'green';
    case 'cancelled':
    case 'no_show': return 'red';
    case 'completed': return 'blue';
    default: return 'default';
  }
};

const isBookingNeedingAttention = (booking: Booking) =>
  booking.status === 'pending'
  || (booking.status === 'confirmed' && booking.payment_status === 'unpaid');

const formatBookingSlot = (booking: Booking) => {
  const slot = booking.slots?.[0];
  if (!slot) return 'Chưa có khung giờ';
  return `${dayjs(slot.start_at).format('DD/MM HH:mm')} - ${dayjs(slot.end_at).format('HH:mm')}`;
};

const speakAlert = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const getActivityTag = (type: ActivityType) => {
  switch (type) {
    case 'new_order': return { color: 'green', label: 'Đơn mới' };
    case 'order_changed': return { color: 'blue', label: 'Đơn hàng' };
    case 'new_booking': return { color: 'cyan', label: 'Đặt sân mới' };
    case 'booking_changed': return { color: 'geekblue', label: 'Đặt sân' };
    default: return { color: 'default', label: 'Cập nhật' };
  }
};

const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingPayment, setPendingPayment] = useState<Order[]>([]);
  const [pendingPickup, setPendingPickup] = useState<Order[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [connected, setConnected] = useState(socket.connected);

  const pushActivity = useCallback((item: Omit<ActivityItem, 'id' | 'time'> & { time?: Date }) => {
    setActivities((prev) => [
      {
        ...item,
        id: `${Date.now()}-${Math.random()}`,
        time: item.time ?? new Date(),
      },
      ...prev,
    ].slice(0, 40));
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [paymentRes, pickupRes, bookingsRes] = await Promise.all([
        PosService.getPendingPayment(),
        PosService.getPendingPickup(),
        BookingService.getAllBookings(),
      ]);
      setPendingPayment(paymentRes.data);
      setPendingPickup(pickupRes.data);
      setPendingBookings(bookingsRes.data.filter(isBookingNeedingAttention));
      setLastUpdated(new Date());
    } catch {
      if (!silent) message.error('Không thể tải dữ liệu vận hành');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleNewOrder = useCallback((payload: OrderSocketPayload) => {
    speakAlert('Có đơn hàng mới từ ứng dụng');
    pushActivity({
      type: 'new_order',
      message: payload.message || `Đơn hàng mới #${payload.orderId}`,
    });
    fetchAll(true);
  }, [fetchAll, pushActivity]);

  const handleOrderChanged = useCallback((payload: OrderSocketPayload) => {
    const label = payload.updatedCount
      ? `${payload.updatedCount} đơn hết hạn đã được xử lý`
      : `Đơn #${payload.orderId} — ${getOrderStatusText(payload.status)}`;

    pushActivity({ type: 'order_changed', message: label });
    fetchAll(true);
  }, [fetchAll, pushActivity]);

  const handleNewBooking = useCallback((payload: BookingSocketPayload) => {
    speakAlert('Có đơn đặt sân mới từ ứng dụng');
    pushActivity({
      type: 'new_booking',
      message: payload.message || `Đặt sân mới #${payload.bookingId}`,
    });
    fetchAll(true);
  }, [fetchAll, pushActivity]);

  const handleBookingChanged = useCallback((payload: BookingSocketPayload) => {
    const label = payload.updatedCount
      ? `${payload.updatedCount} đơn đặt sân hết hạn đã được xử lý`
      : `Đặt sân #${payload.bookingId} — ${getBookingStatusText(payload.status)}`;

    pushActivity({ type: 'booking_changed', message: label });
    fetchAll(true);
  }, [fetchAll, pushActivity]);

  useStaffRealtime({
    onOrder: handleNewOrder,
    onOrderChanged: handleOrderChanged,
    onBooking: handleNewBooking,
    onBookingChanged: handleBookingChanged,
  });

  const renderOrderItem = (order: Order) => (
    <List.Item
      key={order.id}
      actions={[
        <Button type="link" key="view" onClick={() => navigate('/employee/orders')}>
          Xử lý
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space>
            <Text strong>#{order.id}</Text>
            <Tag color={getOrderStatusColor(order.status)}>{getOrderStatusText(order.status)}</Tag>
          </Space>
        }
        description={
          <Space split="|" size="small" wrap>
            <Text type="secondary">{order.facility?.name || 'Chưa rõ cơ sở'}</Text>
            <Text>{order.total_cents.toLocaleString('vi-VN')} đ</Text>
            <Text type="secondary">{dayjs(order.created_at).fromNow()}</Text>
          </Space>
        }
      />
    </List.Item>
  );

  const renderBookingItem = (booking: Booking) => (
    <List.Item
      key={booking.id}
      actions={[
        <Button type="link" key="view" onClick={() => navigate('/booking/list')}>
          Xử lý
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space>
            <Text strong>#{booking.id}</Text>
            <Tag color={getBookingStatusColor(booking.status)}>{getBookingStatusText(booking.status)}</Tag>
            {booking.payment_status === 'unpaid' && <Tag color="warning">Chưa thanh toán</Tag>}
          </Space>
        }
        description={
          <Space split="|" size="small" wrap>
            <Text type="secondary">{booking.facility?.name || 'Chưa rõ cơ sở'}</Text>
            <Text>{booking.user?.full_name || booking.user?.phone || 'Khách vãng lai'}</Text>
            <Text>{formatBookingSlot(booking)}</Text>
            <Text>{booking.total_cents.toLocaleString('vi-VN')} đ</Text>
          </Space>
        }
      />
    </List.Item>
  );

  const totalNeedAction =
    pendingPayment.length + pendingPickup.length + pendingBookings.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Title level={3} className="!mb-1">Trung tâm vận hành</Title>
          <Text type="secondary">
            Theo dõi realtime đơn hàng và đặt sân — không cần mở nhiều tab
          </Text>
        </div>
        <Space wrap>
          <Badge status={connected ? 'success' : 'error'} text={connected ? 'Đang kết nối realtime' : 'Mất kết nối'} />
          <Button icon={<SyncOutlined spin={loading} />} onClick={() => fetchAll()} loading={loading}>
            Làm mới
          </Button>
          <Button icon={<ShoppingCartOutlined />} onClick={() => navigate('/employee/orders')}>
            Đơn hàng
          </Button>
          <Button type="primary" icon={<CalendarOutlined />} onClick={() => navigate('/booking/schedule')}>
            Lịch sân
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Đơn chờ thanh toán"
              value={pendingPayment.length}
              valueStyle={{ color: pendingPayment.length > 0 ? '#fa8c16' : undefined }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Đơn chờ lấy hàng"
              value={pendingPickup.length}
              valueStyle={{ color: pendingPickup.length > 0 ? '#1677ff' : undefined }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Đặt sân cần xử lý"
              value={pendingBookings.length}
              valueStyle={{ color: pendingBookings.length > 0 ? '#13c2c2' : undefined }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Tổng cần xử lý"
              value={totalNeedAction}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Cập nhật lần cuối"
              value={lastUpdated ? dayjs(lastUpdated).format('HH:mm:ss') : '—'}
              suffix={lastUpdated ? dayjs(lastUpdated).fromNow() : undefined}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={8}>
          <Card
            title={<Badge count={pendingPayment.length} offset={[8, 0]}>Đơn chờ thanh toán</Badge>}
            extra={<Button type="link" onClick={() => navigate('/employee/orders')}>Xem tất cả</Button>}
            className="h-full"
          >
            <List
              dataSource={pendingPayment}
              locale={{ emptyText: 'Không có đơn chờ thanh toán' }}
              renderItem={renderOrderItem}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Badge count={pendingPickup.length} offset={[8, 0]}>Đơn chờ lấy hàng</Badge>}
            extra={<Button type="link" onClick={() => navigate('/employee/orders')}>Xem tất cả</Button>}
            className="h-full"
          >
            <List
              dataSource={pendingPickup}
              locale={{ emptyText: 'Không có đơn chờ lấy hàng' }}
              renderItem={renderOrderItem}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Badge count={pendingBookings.length} offset={[8, 0]}>Đặt sân cần xử lý</Badge>}
            extra={<Button type="link" onClick={() => navigate('/booking/list')}>Xem tất cả</Button>}
            className="h-full"
          >
            <List
              dataSource={pendingBookings}
              locale={{ emptyText: 'Không có đơn đặt sân cần xử lý' }}
              renderItem={renderBookingItem}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Nhật ký realtime">
        <List
          dataSource={activities}
          locale={{ emptyText: 'Chưa có sự kiện — hãy giữ tab này mở để theo dõi' }}
          size="small"
          renderItem={(item) => {
            const tag = getActivityTag(item.type);
            return (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={tag.color}>{tag.label}</Tag>
                      <Text>{item.message}</Text>
                    </Space>
                  }
                  description={dayjs(item.time).format('HH:mm:ss — DD/MM/YYYY')}
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default StaffDashboardPage;
