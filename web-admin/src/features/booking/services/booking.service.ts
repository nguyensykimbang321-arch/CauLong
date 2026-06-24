import axiosClient from "../../../config/axios";
import type { ApiResponse } from "../../../types/api.type";
import type { Booking, CreateBookingPayload, DailySlotGridResponse } from "../types/booking.types";

export const BookingService = {
  getAllBookings: async (params?: any) => {
    return await axiosClient.get<any,ApiResponse<Booking[]>>('/admin/bookings', { params });
  },

 updateBooking: async (id: number, payload: { status?: string, payment_status?: string }) => {
    return await axiosClient.put<any, ApiResponse<Booking>>(`/admin/bookings/${id}/status`, payload);
  },

  createBooking: async (payload: CreateBookingPayload) => {
    return await axiosClient.post<any, ApiResponse<Booking>>('/admin/bookings/hotline', payload);
  },

  getDailySlots: async (facility_id: number, date: string, court_type: string) => {
    return await axiosClient.get<any, ApiResponse<DailySlotGridResponse>>('/app/bookings/daily-booked-slots', {
      params: { facility_id, date, court_type }
    });
  },

  getUserByPhone: async (phone: string) => {
    return await axiosClient.get<any, ApiResponse<any>>('/admin/users/search-phone', {
      params: { phone }
    });
  },

  searchCustomerByPhone: async (phone: string) => {
    return await axiosClient.get<any, ApiResponse<{
      id: number;
      full_name: string | null;
      phone: string | null;
      membership_type: 'standard' | 'student' | 'vip';
      loyalty_points: number;
    }>>('/admin/users/search-phone', {
      params: { phone }
    });
  },

  getBookingDetail: async (id: number) => {
    return await axiosClient.get<any, ApiResponse<Booking>>(`/admin/bookings/${id}`);
  },

  generateVNPayUrl: async (bookingId: number) => {
    return await axiosClient.get<any, ApiResponse<{ paymentUrl: string }>>(`/admin/bookings/${bookingId}/vnpay-url`);
  },
  
};