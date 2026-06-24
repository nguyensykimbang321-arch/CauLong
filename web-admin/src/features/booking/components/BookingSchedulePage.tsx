import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Card, Spin, message, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { FacilityService } from '../../facility/services/facility.service';
import { BookingService } from '../services/booking.service';
// import CreateBookingModal from './CreateBookingModal'; // Tí nữa mở comment cái này ra
import type { FacilityLite } from '../types/booking.types';
import BookingScheduleGrid from './BookingScheduleGrid';
import CreateBookingModal from './CreateBookingModal';
import BookingDetailDrawer from './BookingDetailDrawer';

const BookingSchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [selectedCourtType, setSelectedCourtType] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<FacilityLite[]>([]);
  const [availableCourtTypes, setAvailableCourtTypes] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  
  const [gridData, setGridData] = useState<{
    courts: any[];
    rawBookedSlots: any[];
    open_time?: string;
    close_time?: string;
    min_booking_minutes?: number;
    min_gap_minutes?: number;
  }>({
    courts: [],
    rawBookedSlots: [] // Hứng dữ liệu thô từ Backend
  });
  const [loadingGrid, setLoadingGrid] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    FacilityService.getAllFacilities()
      .then(res => {
        setFacilities(res.data);
        if (res.data.length > 0) {
          setSelectedFacilityId(res.data[0].id);
        }
      })
      .catch(() => message.error("Không thể tải danh sách cơ sở"));
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      setSelectedCourtType(null); // Reset loại sân
      FacilityService.getCourtsByFacility(selectedFacilityId)
        .then(res => {
          const courtsData = res.data.courts || [];
          const uniqueTypes = Array.from(new Set(courtsData.map((c: any) => c.court_type))) as string[];
          setAvailableCourtTypes(uniqueTypes);
          
          if (uniqueTypes.length > 0) {
            setSelectedCourtType(uniqueTypes[0]);
          }
        });
    }
  }, [selectedFacilityId]);

  useEffect(() => {
    if (selectedDate && selectedFacilityId && selectedCourtType) {
      setLoadingGrid(true);
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
      BookingService.getDailySlots(selectedFacilityId, dateStr, selectedCourtType)
        .then(res => {
          if (res.data) {
             setGridData({
               courts: res.data.courts || [],
               rawBookedSlots: res.data.rawBookedSlots || [],
               open_time: res.data.open_time,
               close_time: res.data.close_time,
               min_booking_minutes: res.data.min_booking_minutes,
               min_gap_minutes: res.data.min_gap_minutes
             });
          }
        })
        .catch(() => message.error("Lỗi lấy dữ liệu lịch sân"))
        .finally(() => setLoadingGrid(false));
    }
  }, [selectedDate, selectedFacilityId, selectedCourtType, refreshTrigger]);

  // 6. XỬ LÝ SỰ KIỆN KHI LỄ TÂN BẤM VÀO 1 Ô TRÊN BẢNG
  const handleSlotClick = (court: any, slot: any) => {
    console.log("Dữ liệu slot khi click:", slot);
    if (slot.available) {
      // Ô TRỐNG: Lưu thông tin và mở Modal
      setModalInitialData({
         facility_id: selectedFacilityId,
         court_type: selectedCourtType,
         court_id: court.id,
         play_date: selectedDate.format('YYYY-MM-DD'),
         start_time: slot.start,
         open_time: gridData.open_time,
         close_time: gridData.close_time,
         min_gap_minutes: gridData.min_gap_minutes
      });
      setIsModalOpen(true);
    } else {
      setSelectedBookingId(slot.booking_id);
      setIsDrawerOpen(true);
    }
  };


  // Hàm helper format tên loại sân cho đẹp
  const formatCourtTypeLabel = (type: string) => {
    switch (type) {
      case 'badminton': return 'Sân Cầu Lông';
      case 'tennis': return 'Sân Tennis';
      case 'football': return 'Sân Bóng Đá';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      {/* KHU VỰC BỘ LỌC */}
      <Card className="shadow-sm rounded-lg" bodyStyle={{ padding: '16px 24px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <div className="font-medium text-gray-500 mb-1">Ngày xem lịch</div>
            <DatePicker 
              className="w-full" 
              value={selectedDate} 
              onChange={(date) => date && setSelectedDate(date)} 
              allowClear={false}
            />
          </Col>
          <Col span={8}>
            <div className="font-medium text-gray-500 mb-1">Cơ sở / Chi nhánh</div>
            <Select 
              className="w-full" 
              value={selectedFacilityId} 
              onChange={setSelectedFacilityId}
              placeholder="Chọn cơ sở"
            >
              {facilities.map(fac => (
                <Select.Option key={fac.id} value={fac.id}>{fac.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div className="font-medium text-gray-500 mb-1">Loại sân</div>
            <Select 
              className="w-full" 
              value={selectedCourtType} 
              onChange={setSelectedCourtType}
              placeholder="Chọn loại sân"
              disabled={!selectedFacilityId || availableCourtTypes.length === 0}
            >
              {availableCourtTypes.map(type => (
                <Select.Option key={type} value={type}>{formatCourtTypeLabel(type)}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* KHU VỰC SA BÀN LƯỚI */}
      <Spin spinning={loadingGrid} tip="Đang tải sa bàn...">
        <BookingScheduleGrid 
           loading={false} 
           courts={gridData.courts}
           rawBookedSlots={gridData.rawBookedSlots} // Đổi tên prop ở đây
           onSlotClick={handleSlotClick}
           openTime={gridData.open_time}
           closeTime={gridData.close_time}
        />
      </Spin>
      
      {/* KHOẢNG TRỐNG ĐỂ CHỨA MODAL SAU NÀY */}
      <CreateBookingModal 
         open={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         onSuccess={() => {
            // 🔥 CHỈ CẦN TĂNG BIẾN NÀY, useEffect SẼ TỰ CHẠY LẠI
            setRefreshTrigger(prev => prev + 1); 
         }}
         initialData={modalInitialData}
      />

      {selectedBookingId && (
        <BookingDetailDrawer 
           bookingId={selectedBookingId}
           open={isDrawerOpen}
           onClose={() => {
              setIsDrawerOpen(false);
              setSelectedBookingId(null);
           }}
           onRefresh={() => setRefreshTrigger(prev => prev + 1)} // Nếu trong drawer có hủy đơn thì cũng phải refresh lại lưới
        />
      )}
    </div>
  );
};

export default BookingSchedulePage;