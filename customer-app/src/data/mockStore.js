import mock from './mock.json';

export function getMock() {
  return mock;
}

export function getCurrentUser() {
  // Giả lập lấy user đầu tiên làm user hiện tại
  return mock.users?.[0] ?? null;
}

export function getFacilities() {
  return mock.facilities ?? [];
}

export function getCourtTypes() {
  return mock.court_types ?? [];
}

export function getCourts({ facilityId, courtTypeId } = {}) {
  let courts = mock.courts ?? [];
  if (facilityId) courts = courts.filter((c) => c.facility_id === parseInt(facilityId));
  if (courtTypeId) courts = courts.filter((c) => c.court_type_id === parseInt(courtTypeId));
  return courts;
}

export function getBookings(userId) {
  let bookings = mock.bookings ?? [];
  if (userId) bookings = bookings.filter((b) => b.user_id === parseInt(userId));
  
  return bookings.map(b => {
    const slots = (mock.booking_slots ?? []).filter(s => s.booking_id === b.id);
    const facility = (mock.facilities ?? []).find(f => f.id === b.facility_id);
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    
    let court = null;
    let courtType = null;
    if (firstSlot) {
      court = (mock.courts ?? []).find(c => c.id === firstSlot.court_id);
      courtType = (mock.court_types ?? []).find(ct => ct.id === court?.court_type_id);
    }

    const sportLabel = courtType?.name === 'badminton' ? 'Cầu lông' : courtType?.name === 'tennis' ? 'Tennis' : 'Bóng bàn';

    return {
      ...b,
      slots,
      facility,
      court_name: court?.name ?? '—',
      court_type_label: sportLabel,
      start_at: firstSlot?.start_at,
      end_at: lastSlot?.end_at,
      date: firstSlot?.start_at ? new Date(firstSlot.start_at).toLocaleDateString('vi-VN') : '—'
    };
  });
}

export function getProducts() {
  return (mock.products ?? []).map(p => {
    const variants = (mock.product_variants ?? []).filter(v => v.product_id === p.id).map(v => {
      // Tính toán stock từ inventory_levels
      const stock = (mock.inventory_levels ?? [])
        .filter(i => i.variant_id === v.id)
        .reduce((sum, i) => sum + i.quantity_on_hand, 0);

      // Tạo nhãn hiển thị từ attributes
      const label = v.attributes 
        ? Object.values(v.attributes).join(' - ')
        : v.sku;

      return { ...v, stock, label };
    });

    const categoryLabels = {
      racket: 'Vợt',
      shuttlecock: 'Cầu',
      shoes: 'Giày',
      apparel: 'Quần áo',
      accessory: 'Phụ kiện'
    };

    return {
      ...p,
      category_label: categoryLabels[p.category] ?? 'Sản phẩm',
      rating: p.rating ?? 5.0,
      review_count: p.review_count ?? 0,
      variants
    };
  });
}

export function getCartItems(userId) {
  const items = (mock.cart_items ?? []).filter(i => i.user_id === parseInt(userId));
  return items.map(item => {
    const variant = (mock.product_variants ?? []).find(v => v.id === item.variant_id);
    const product = (mock.products ?? []).find(p => p.id === variant?.product_id);
    return { ...item, variant, product };
  });
}

export function getNotifications(userId) {
  return (mock.notifications ?? []).filter(n => n.user_id === parseInt(userId));
}

/**
 * Giả lập lấy danh sách slot trống (Availability)
 * Trong thực tế, cái này sẽ được tính toán từ price_rules và booking_slots
 */
export function getAvailability({ facilityId, courtId, date } = {}) {
  // Logic đơn giản cho mock: lấy price_rules áp dụng cho sân này 
  // và kiểm tra xem slot đó đã có trong booking_slots chưa.
  const court = (mock.courts ?? []).find(c => c.id === parseInt(courtId));
  if (!court) return null;

  const rules = (mock.price_rules ?? []).filter(r => r.court_id === court.id && r.active);
  const slots = [];

  // Giả lập các slot từ 6h đến 22h
  for (let h = 6; h < 22; h++) {
    const start = `${date}T${h.toString().padStart(2, '0')}:00:00Z`;
    const end = `${date}T${(h + 1).toString().padStart(2, '0')}:00:00Z`;
    
    // Tìm giá phù hợp
    const rule = rules.find(r => h >= r.start_hour && h < r.end_hour) || { price_cents: 100000 };
    
    // Kiểm tra xem đã bị đặt chưa
    const isBooked = (mock.booking_slots ?? []).some(s => 
      s.court_id === court.id && 
      s.start_at === start
    );

    slots.push({
      id: `slot_${court.id}_${h}`,
      start: `${h.toString().padStart(2, '0')}:00`,
      end: `${(h + 1).toString().padStart(2, '0')}:00`,
      price_cents: rule.price_cents,
      available: !isBooked
    });
  }

  return {
    facility_id: parseInt(facilityId),
    court_id: court.id,
    date,
    slots
  };
}

export function getAvailabilitiesFor({ facilityId, courtTypeId, date } = {}) {
  const courts = getCourts({ facilityId, courtTypeId }).filter((c) => c.status === 'active');
  const slotsByCourtId = {};
  for (const c of courts) {
    slotsByCourtId[c.id] = (getAvailability({ facilityId, courtId: c.id, date })?.slots ?? []);
  }
  return { courts, slotsByCourtId };
}

