import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatPrice(cents) {
  const value = typeof cents === 'number' ? cents : Number(cents);
  if (!Number.isFinite(value)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export function formatDatetime(iso) {
  if (!iso) return '';
  return format(parseISO(String(iso)), 'dd/MM/yyyy HH:mm');
}

export function formatDate(iso) {
  if (!iso) return '';
  return format(parseISO(String(iso)), 'dd/MM/yyyy');
}

export function formatRelativeTime(iso) {
  if (!iso) return '';
  return formatDistanceToNow(parseISO(String(iso)), { addSuffix: true, locale: vi });
}

export function calcCartTotal(cartItems) {
  return (cartItems ?? []).reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
}

export function getBookingStatusMeta(status) {
  const map = {
    pending: { label: 'Chờ xác nhận', color: '#FF9F43' },
    confirmed: { label: 'Đã xác nhận', color: '#00C17C' },
    completed: { label: 'Hoàn thành', color: '#4A90E2' },
    cancelled: { label: 'Đã hủy', color: '#E84855' },
  };
  return map[status] ?? { label: String(status ?? ''), color: '#A0AABC' };
}

export function getPaymentStatusMeta(status) {
  const map = {
    unpaid: { label: 'Chưa thanh toán', color: '#E84855' },
    partial: { label: 'Thanh toán 1 phần', color: '#FFB020' },
    paid: { label: 'Đã thanh toán', color: '#12B981' },
    refunded: { label: 'Đã hoàn tiền', color: '#94A3B8' },
  };
  return map[status] ?? { label: 'Chưa thanh toán', color: '#E84855' };
}

export function getUnifiedBookingStatus(booking) {
  if (booking?.status === 'cancelled') {
    return { label: 'Đã hủy', color: '#E84855' }; // Đỏ
  }
  if (booking?.status === 'completed') {
    return { label: 'Hoàn thành', color: '#4A90E2' }; // Xanh dương
  }
  if (booking?.payment_status === 'paid') {
    return { label: 'Đã thanh toán', color: '#12B981' }; // Xanh lá
  }
  return { label: 'Chưa thanh toán', color: '#FF9F43' }; // Cam
}

