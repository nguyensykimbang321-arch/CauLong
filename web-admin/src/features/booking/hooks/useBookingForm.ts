import { useState, useEffect, useRef } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { BookingService } from '../services/booking.service';
import { FacilityService } from '../../facility/services/facility.service';
import { useAuthStore } from '../../auth/store/auth.store';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api.type';
import type { BookedSlotDTO, CreateBookingPayload, FacilityLite, CourtLite, BookingFormValues } from '../types/booking.types';

dayjs.extend(isBetween);

interface UseBookingFormProps {
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
  initialData?: {
    facility_id?: number;
    court_type?: string;
    court_id?: number;
    play_date?: dayjs.Dayjs | string;
    start_time?: string;
    open_time?: string;
    close_time?: string;
    min_gap_minutes?: number;
  } | null;
}

export const useBookingForm = ({ open, onSuccess, onClose, initialData }: UseBookingFormProps) => {
  const [form] = Form.useForm<BookingFormValues>();
  
  const [loading, setLoading] = useState(false);
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<{
    id: number;
    full_name: string | null;
    phone: string | null;
    membership_type: 'standard' | 'student' | 'vip';
    loyalty_points: number;
  } | null>(null);
  
  const [bookedSlots, setBookedSlots] = useState<BookedSlotDTO[]>([]);
  const [facilities, setFacilities] = useState<FacilityLite[]>([]);
  const [facilityCourts, setFacilityCourts] = useState<CourtLite[]>([]);
  const [availableCourtTypes, setAvailableCourtTypes] = useState<string[]>([]);
  const [courts, setCourts] = useState<CourtLite[]>([]);
  
  const [operatingHours, setOperatingHours] = useState<{
    open_time: string;
    close_time: string;
  }>({
    open_time: '06:00:00',
    close_time: '22:00:00'
  });

  const isInitialMountRef = useRef(false);

  const { user } = useAuthStore();
  const staffFacilityId = (user as any)?.staff_profile?.facility_id;

  const selectedDate = Form.useWatch('play_date', form);
  const selectedCourtId = Form.useWatch('court_id', form);
  const selectedFacilityId = Form.useWatch('facility_id', form);
  const selectedCourtType = Form.useWatch('court_type', form);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setIsExistingUser(false);
      setFoundCustomer(null);
      isInitialMountRef.current = true;

      FacilityService.getAllFacilities()
        .then(res => setFacilities(res.data))
        .catch(err => console.error("Lỗi lấy cơ sở:", err));

      if (initialData) {
         const playDateVal = initialData.play_date ? dayjs(initialData.play_date) : undefined;
         const startTimeVal = initialData.start_time ? dayjs(initialData.start_time, 'HH:mm') : undefined;
         const endTimeVal = startTimeVal ? startTimeVal.add(1, 'hour') : undefined;

         form.setFieldsValue({
            facility_id: initialData.facility_id,
            court_type: initialData.court_type,
            court_id: initialData.court_id,
            play_date: playDateVal,
            start_time: startTimeVal,
            end_time: endTimeVal
         });
         
         if (initialData.open_time && initialData.close_time) {
           setOperatingHours({
             open_time: initialData.open_time,
             close_time: initialData.close_time
           });
         } else {
           setOperatingHours({
             open_time: '06:00:00',
             close_time: '22:00:00'
           });
         }
      } else {
         setOperatingHours({
           open_time: '06:00:00',
           close_time: '22:00:00'
         });
         if (staffFacilityId) {
           form.setFieldValue('facility_id', staffFacilityId);
         }
      }

      setTimeout(() => {
        isInitialMountRef.current = false;
      }, 0);
    }
  }, [open, staffFacilityId, form, initialData]);

  useEffect(() => {
    if (selectedFacilityId) {
      if (isInitialMountRef.current && initialData && initialData.facility_id === selectedFacilityId) {
        // Skip reset on initial load if matches initialData
      } else {
        form.setFieldsValue({ court_type: undefined, court_id: undefined } as any); 
      }
      
      FacilityService.getCourtsByFacility(selectedFacilityId)
        .then(res => {
          const courtsData = res.data.courts || [];
          setFacilityCourts(courtsData);

          const uniqueTypes = Array.from(
            new Set(
              courtsData.map((c: any) => {
                if (c.court_type && typeof c.court_type === 'object') {
                  return c.court_type.name;
                }
                return c.court_type;
              }).filter(Boolean)
            )
          ) as string[];
          setAvailableCourtTypes(uniqueTypes);

          if (isInitialMountRef.current && initialData && initialData.facility_id === selectedFacilityId) {
            if (initialData.court_type && uniqueTypes.includes(initialData.court_type)) {
              form.setFieldValue('court_type', initialData.court_type);
            }
          } else if (uniqueTypes.length === 1) {
            form.setFieldValue('court_type', uniqueTypes[0]);
          }
        })
        .catch(err => console.error("Lỗi lấy sân:", err));
    } else {
      setFacilityCourts([]);
      setAvailableCourtTypes([]);
      setCourts([]);
    }
  }, [selectedFacilityId, form, initialData]);

  useEffect(() => {
    if (selectedCourtType && facilityCourts.length > 0) {
      if (isInitialMountRef.current && initialData && initialData.court_type === selectedCourtType && initialData.facility_id === selectedFacilityId) {
        if (initialData.court_id) {
          form.setFieldValue('court_id', initialData.court_id);
        }
      } else {
        form.setFieldValue('court_id', undefined);
      }
      const filteredCourts = facilityCourts.filter(c => c.court_type === selectedCourtType);
      setCourts(filteredCourts);
    } else {
      setCourts([]);
    }
  }, [selectedCourtType, facilityCourts, form, initialData, selectedFacilityId]);

  useEffect(() => {
    if (selectedDate && selectedFacilityId && selectedCourtType && open) {
      const fetchBookedSlots = async () => {
        try {
          const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
          const res = await BookingService.getDailySlots(selectedFacilityId, dateStr, selectedCourtType); 
          
          // --- ADMIN CHỈ LẤY ĐÚNG RAW DATA, BỎ QUA CÁI GRID CỦA APP ---
          if (res.data) {
            if (res.data.rawBookedSlots) {
              setBookedSlots(res.data.rawBookedSlots);
            } else {
              setBookedSlots([]); 
            }
            if (res.data.open_time && res.data.close_time) {
              setOperatingHours({
                open_time: res.data.open_time,
                close_time: res.data.close_time
              });
            }
          }
          
        } catch (error) {
          console.error("Lỗi lấy lịch:", error);
          setBookedSlots([]); 
        }
      };
      fetchBookedSlots();
    }
  }, [selectedDate, selectedFacilityId, selectedCourtType, open]);

  const currentCourtBookedSlots = bookedSlots.filter(slot => slot.court_id === selectedCourtId);

  const handleSearchPhone = async (phoneStr: string) => {
    const phone = phoneStr.trim();
    if (!phone || phone.length < 9) return; 

    try {
      setSearchingPhone(true);
      const res = await BookingService.searchCustomerByPhone(phone);
      if (res.data && res.data.phone) {
        const user = res.data;
        form.setFieldsValue({
          full_name: user.full_name || '',
          membership_type: user.membership_type || 'standard'
        });
        setIsExistingUser(true);
        setFoundCustomer(user);
        message.success(`Tìm thấy khách quen: ${user.full_name || 'Khách vãng lai'} (${user.membership_type})`);
      } else {
        form.setFieldsValue({ full_name: '', membership_type: 'standard' });
        setIsExistingUser(false);
        setFoundCustomer(null);
        message.info('Khách hàng mới. Vui lòng nhập thông tin');
      }
    } catch (error: any) {
      form.setFieldsValue({ full_name: '', membership_type: 'standard' });
      setIsExistingUser(false);
      setFoundCustomer(null);
      if (error.response?.status === 404) {
        message.info('Khách hàng mới. Vui lòng nhập thông tin');
      } else {
        console.error("Lỗi gọi API tìm SĐT:", error);
      }
    } finally {
      setSearchingPhone(false);
    }
  };

  const checkBookingTimes = (_: any, value: any) => {
    if (!value) return Promise.resolve();
    
    const startTimeVal = form.getFieldValue('start_time');
    const endTimeVal = form.getFieldValue('end_time');
    if (!startTimeVal || !endTimeVal) return Promise.resolve();

    // 1. Duration check
    const start = dayjs(startTimeVal);
    const end = dayjs(endTimeVal);
    
    if (end.isBefore(start) || end.isSame(start)) {
      return Promise.reject(new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu!'));
    }

    const durationMinutes = end.diff(start, 'minute');
    if (durationMinutes < 60) {
      return Promise.reject(new Error('Thời lượng đặt sân tối thiểu là 1 tiếng (60 phút)!'));
    }

    // 2. Operating hours check
    const openStr = operatingHours.open_time.slice(0, 5); // e.g. "06:00"
    const closeStr = operatingHours.close_time.slice(0, 5); // e.g. "22:00"
    
    const startStr = start.format('HH:mm');
    const endStr = end.format('HH:mm');
    
    if (startStr < openStr || endStr > closeStr) {
      return Promise.reject(new Error(`Giờ đặt sân phải nằm trong giờ hoạt động (${openStr} - ${closeStr})!`));
    }

    // 3. Overlap check
    if (selectedCourtId && currentCourtBookedSlots.length > 0) {
      const isOverlap = currentCourtBookedSlots.some(slot => {
        return (startStr < slot.end_time && endStr > slot.start_time);
      });
      if (isOverlap) {
        return Promise.reject(new Error('Khung giờ này đã bị trùng khách khác!'));
      }

      // 4. Smart Gap client check (as a warning / soft block)
      // Get all booked slots sorted by start time
      const sortedSlots = [...currentCourtBookedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      // Find adjacent booking before
      const previousSlot = [...sortedSlots].reverse().find(s => s.end_time <= startStr);
      let gapBeforeBoundary = openStr;
      if (previousSlot) {
        gapBeforeBoundary = previousSlot.end_time;
      }
      
      const gapBefore = start.diff(dayjs(`${start.format('YYYY-MM-DD')} ${gapBeforeBoundary}`, 'YYYY-MM-DD HH:mm'), 'minute');
      if (gapBefore > 0 && gapBefore < 60) {
        return Promise.reject(new Error(`Sẽ tạo ra khoảng trống ${gapBefore} phút (từ ${gapBeforeBoundary} đến ${startStr}) không đủ để người khác thuê!`));
      }

      // Find adjacent booking after
      const nextSlot = sortedSlots.find(s => s.start_time >= endStr);
      let gapAfterBoundary = closeStr;
      if (nextSlot) {
        gapAfterBoundary = nextSlot.start_time;
      }
      
      const gapAfter = dayjs(`${end.format('YYYY-MM-DD')} ${gapAfterBoundary}`, 'YYYY-MM-DD HH:mm').diff(end, 'minute');
      if (gapAfter > 0 && gapAfter < 60) {
        return Promise.reject(new Error(`Sẽ tạo ra khoảng trống ${gapAfter} phút (từ ${endStr} đến ${gapAfterBoundary}) không đủ để người khác thuê!`));
      }
    } else {
      // If there are no bookings, we check gap with opening/closing bounds
      const gapBefore = start.diff(dayjs(`${start.format('YYYY-MM-DD')} ${openStr}`, 'YYYY-MM-DD HH:mm'), 'minute');
      if (gapBefore > 0 && gapBefore < 60) {
        return Promise.reject(new Error(`Sẽ tạo ra khoảng trống ${gapBefore} phút (từ ${openStr} đến ${startStr}) không đủ để người khác thuê!`));
      }

      const gapAfter = dayjs(`${end.format('YYYY-MM-DD')} ${closeStr}`, 'YYYY-MM-DD HH:mm').diff(end, 'minute');
      if (gapAfter > 0 && gapAfter < 60) {
        return Promise.reject(new Error(`Sẽ tạo ra khoảng trống ${gapAfter} phút (từ ${endStr} đến ${closeStr}) không đủ để người khác thuê!`));
      }
    }

    return Promise.resolve();
  };

  const handleSubmit = async (values: BookingFormValues) => {
    try {
      setLoading(true);
      const payload: CreateBookingPayload = {
        customer_phone: values.phone,
        customer_name: values.full_name,
        membership_type: values.membership_type,
        facility_id: values.facility_id,
        court_id: values.court_id,
        date: values.play_date.format('YYYY-MM-DD'),
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
        status: 'confirmed' as const,
        payment_method: 'cash' as const
      };
      await BookingService.createBooking(payload);
      message.success('Tạo đơn đặt sân thành công!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      message.error(err.response?.data?.message || err.message || 'Lỗi khi tạo đơn');
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    searchingPhone,
    isExistingUser,
    foundCustomer,
    facilities,
    availableCourtTypes,
    courts,
    staffFacilityId,
    selectedCourtId,
    selectedDate,
    selectedFacilityId,
    selectedCourtType,
    currentCourtBookedSlots,
    handleSearchPhone,
    checkBookingTimes,
    handleSubmit
  };
};