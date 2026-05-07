import React, { useState, useEffect, useRef } from 'react';
import { Modal, Spin, message } from 'antd';
import { BookingService } from '../services/booking.service';
import { QRCodeSVG } from 'qrcode.react';

interface VNPayQRModalProps {
  bookingId: number;
  totalCents: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Gọi khi khách quét mã xong
}

const VNPayQRModal: React.FC<VNPayQRModalProps> = ({ bookingId, totalCents, open, onClose, onSuccess }) => {
  const [vnpayUrl, setVnpayUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Khi mở Modal -> Gọi API lấy Link VNPay
  useEffect(() => {
    if (open && bookingId) {
      setLoading(true);
      BookingService.generateVNPayUrl(bookingId) // Lát nữa ta sẽ viết API này
        .then(res => {
          setVnpayUrl(res.data.paymentUrl);
          startPolling(); // Bắt đầu vòng lặp hỏi thăm Backend
        })
        .catch(() => message.error('Không thể tạo mã VNPay'))
        .finally(() => setLoading(false));
    }
    
    // Cleanup khi đóng
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [open, bookingId]);

  // 2. Vòng lặp kiểm tra thanh toán
  const startPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await BookingService.getBookingDetail(bookingId);
        if (res.data.payment_status === 'paid') {
          clearInterval(pollingIntervalRef.current!);
          message.success('Khách đã thanh toán thành công!');
          onSuccess(); // Đóng Modal và báo cho Drawer refresh
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  };

  return (
    <Modal
      title={<div className="text-center text-blue-600 text-xl font-bold">Quét mã VNPay để thanh toán</div>}
      open={open}
      footer={null}
      onCancel={onClose}
      centered
    >
      <div className="flex flex-col items-center justify-center py-6">
        {loading || !vnpayUrl ? (
          <Spin tip="Đang khởi tạo mã thanh toán..." />
        ) : (
          <>
            <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-blue-100 mb-4">
              <QRCodeSVG value={vnpayUrl} size={256} level="H" />
            </div>
            <div className="text-lg font-bold text-red-500 mb-2">
               Số tiền: {(totalCents).toLocaleString('vi-VN')} VNĐ
            </div>
            <p className="text-gray-500 font-medium animate-pulse">
              Đang chờ khách thanh toán trên ứng dụng ngân hàng...
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default VNPayQRModal;