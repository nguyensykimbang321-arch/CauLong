import { useEffect, useRef } from 'react';
import { socket } from '../config/socket';

export interface OrderSocketPayload {
  message?: string;
  orderId?: number;
  status?: string;
  updatedCount?: number;
}

export interface BookingSocketPayload {
  message?: string;
  bookingId?: number;
  status?: string;
  payment_status?: string;
  facilityId?: number;
  updatedCount?: number;
}

type OrderHandler = (payload: OrderSocketPayload) => void;
type BookingHandler = (payload: BookingSocketPayload) => void;

export interface StaffRealtimeHandlers {
  onOrder?: OrderHandler;
  onOrderChanged?: OrderHandler;
  onBooking?: BookingHandler;
  onBookingChanged?: BookingHandler;
}

export function useStaffRealtime(handlers: StaffRealtimeHandlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleOrder = (payload: OrderSocketPayload) => {
      handlersRef.current.onOrder?.(payload);
    };

    const handleOrderChanged = (payload: OrderSocketPayload) => {
      handlersRef.current.onOrderChanged?.(payload);
    };

    const handleBooking = (payload: BookingSocketPayload) => {
      handlersRef.current.onBooking?.(payload);
    };

    const handleBookingChanged = (payload: BookingSocketPayload) => {
      handlersRef.current.onBookingChanged?.(payload);
    };

    socket.on('order', handleOrder);
    socket.on('order_changed', handleOrderChanged);
    socket.on('booking', handleBooking);
    socket.on('booking_changed', handleBookingChanged);

    return () => {
      socket.off('order', handleOrder);
      socket.off('order_changed', handleOrderChanged);
      socket.off('booking', handleBooking);
      socket.off('booking_changed', handleBookingChanged);
    };
  }, [enabled]);
}

export function useStaffOrderRealtime(
  onOrder?: OrderHandler,
  onOrderChanged?: OrderHandler,
  enabled = true
) {
  useStaffRealtime({ onOrder, onOrderChanged }, enabled);
}
