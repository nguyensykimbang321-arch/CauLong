import type dayjs from "dayjs";

export interface BookingUser {
  id: number;
  email: string;
  phone: string;
  full_name?: string;
}

export interface BookingSlot {
  id: number;
  booking_id: number;
  court_id: number;
  start_at: string;
  end_at: string;
  price_cents: number;
  court: {
    name: string;
  };
}

export interface Booking {
  id: number;
  total_cents: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'paid' | 'unpaid';
  created_at: string;
  
  user?: BookingUser;
  facility?: {
    name: string;
  };
  slots?: BookingSlot[];
}

export interface CreateBookingPayload {
  customer_phone: string;
  customer_name?: string;
  facility_id: number;
  court_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed'; 
  payment_method?: 'cash' | 'vnpay';
}

export interface BookedSlotDTO {
  court_id: number;
  court_name: string;
  start_time: string;
  end_time: string;
}


export interface CourtLite {
  id: number;
  name: string;
  court_type: string;
}

export interface BookingFormValues {
  phone: string;
  full_name?: string;
  facility_id: number;
  court_type: string;
  court_id: number;
  play_date: dayjs.Dayjs;   
  start_time: dayjs.Dayjs;
  end_time: dayjs.Dayjs;
}

export interface FacilityWithCourtsResponse {
  id: number;
  name: string;
  courts: CourtLite[];
}
export interface DailySlotGridResponse {
  courts: any[]; // Có thể để CourtLite[] nếu em muốn chặt chẽ hơn
  slotsByCourtId: Record<string, {
    start: string;
    end: string;
    available: boolean;
    price_cents: number;
  }[]>;
  rawBookedSlots: BookedSlotDTO[];
}