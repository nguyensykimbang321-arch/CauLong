import { timeToMins, minsToTime } from './bookingGapUtils';

const SLOT_STEP = 30;

/** Tạo nhãn mốc 30 phút cho header timeline */
export function buildTimeLabels(openMins, closeMins) {
  const labels = [];
  for (let t = openMins; t < closeMins; t += SLOT_STEP) {
    labels.push(minsToTime(t));
  }
  return labels;
}

/**
 * Dựng lưới 30 phút từ rawBookedSlots (giờ chính xác từ DB),
 * thay vì chia khối 1 giờ — tránh tô đỏ cả giờ khi chỉ bận 30 phút.
 */
export function buildTimelineSlots({
  courts = [],
  rawBookedSlots = [],
  openTime = '06:00:00',
  closeTime = '22:00:00',
}) {
  const openMins = timeToMins(openTime);
  const closeMins = timeToMins(closeTime);
  const slotsByCourtId = {};

  for (const court of courts) {
    const bookings = rawBookedSlots
      .filter((b) => Number(b.court_id) === Number(court.id))
      .map((b) => ({
        start: timeToMins(b.start_time),
        end: timeToMins(b.end_time),
      }));

    const slots = [];
    for (let t = openMins; t < closeMins; t += SLOT_STEP) {
      const end = Math.min(t + SLOT_STEP, closeMins);
      const isBooked = bookings.some((b) => t < b.end && end > b.start);

      slots.push({
        start: minsToTime(t),
        end: minsToTime(end),
        available: !isBooked,
      });
    }

    slotsByCourtId[court.id] = slots;
  }

  return {
    slotsByCourtId,
    timeLabels: buildTimeLabels(openMins, closeMins),
  };
}
