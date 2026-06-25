/** Chuyển "HH:mm" thành số phút */
export function timeToMins(t) {
  const [h, m] = (t || '00:00').slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

/** Chuyển số phút thành "HH:mm" */
export function minsToTime(mins) {
  return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
}

export function getCourtBookings(courtId, rawBookedSlots = []) {
  return rawBookedSlots
    .filter((b) => Number(b.court_id) === Number(courtId))
    .map((b) => ({
      start: timeToMins(b.start_time),
      end: timeToMins(b.end_time),
    }))
    .sort((a, b) => a.start - b.start);
}

/** Validate range — khớp logic backend BookingService.createBooking */
export function getBookingRangeError({
  courtId,
  startTime,
  endTime,
  rawBookedSlots = [],
  openTime = '06:00',
  closeTime = '22:00',
  minBookingMinutes = 30,
}) {
  const openMins = timeToMins(openTime);
  const closeMins = timeToMins(closeTime);
  const start = timeToMins(startTime);
  const end = timeToMins(endTime);

  if (end <= start) {
    return 'Giờ kết thúc phải sau giờ bắt đầu.';
  }

  const duration = end - start;
  if (duration < minBookingMinutes) {
    return `Thời lượng đặt sân tối thiểu là ${minBookingMinutes} phút.`;
  }

  if (start < openMins || end > closeMins) {
    return `Giờ đặt phải nằm trong giờ hoạt động (${minsToTime(openMins)} - ${minsToTime(closeMins)}).`;
  }

  const bookings = getCourtBookings(courtId, rawBookedSlots);
  const overlaps = bookings.some((b) => start < b.end && end > b.start);
  if (overlaps) {
    return 'Khung giờ này đã có người đặt.';
  }

  return null;
}
