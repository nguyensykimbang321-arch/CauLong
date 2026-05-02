import * as api from '../services/api';
// Giữ lại mock để dự phòng nếu API lỗi hoặc chưa có dữ liệu DB
import mock from './mock.json';

export async function getCurrentUser() {
  // Tạm thời lấy user từ mock cho đến khi hoàn thiện logic Login hoàn chỉnh
  return mock.users?.[0] ?? null;
}

export async function getFacilities() {
  try {
    return await api.fetchFacilities();
  } catch (error) {
    console.error("Lỗi lấy danh sách cơ sở:", error);
    return mock.facilities ?? [];
  }
}

export async function getCourtTypes() {
  // Hiện tại backend dùng enum trong Court model, mock vẫn hữu ích cho UI labels
  return mock.court_types ?? [];
}

export async function getCourts({ facilityId, courtTypeId } = {}) {
  try {
    const facility = await api.fetchFacilityDetail(facilityId);
    let courts = facility.courts || [];
    if (courtTypeId) {
        // Ánh xạ id từ mock sang string enum của backend nếu cần
        const typeMap = { 1: 'badminton', 2: 'tennis', 3: 'football' };
        const typeName = typeMap[courtTypeId];
        if (typeName) courts = courts.filter(c => c.court_type === typeName);
    }
    return courts;
  } catch (error) {
    console.error("Lỗi lấy danh sách sân:", error);
    return (mock.courts ?? []).filter(c => c.facility_id === parseInt(facilityId));
  }
}

export async function getBookings(userId) {
  try {
    // Lưu ý: userId thường được lấy từ token ở backend
    const bookings = await api.fetchMyBookings();
    
    return bookings.map(b => {
      const slots = b.slots || [];
      const facility = b.facility;
      const firstSlot = slots[0];
      const lastSlot = slots[slots.length - 1];
      
      const sportLabel = b.court_type === 'badminton' ? 'Cầu lông' : b.court_type === 'tennis' ? 'Tennis' : 'Bóng bàn';

      return {
        ...b,
        slots,
        facility,
        court_name: b.court?.name ?? '—',
        court_type_label: sportLabel,
        start_at: firstSlot?.start_at,
        end_at: lastSlot?.end_at,
        date: firstSlot?.start_at ? new Date(firstSlot.start_at).toLocaleDateString('vi-VN') : '—'
      };
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đặt sân:", error);
    return []; // Hoặc dùng mock nếu muốn
  }
}

export async function getProducts() {
  try {
    const products = await api.fetchProducts();
    const categoryLabels = {
        racket: 'Vợt',
        shuttlecock: 'Cầu',
        shoes: 'Giày',
        apparel: 'Quần áo',
        accessory: 'Phụ kiện'
      };

    return products.map(p => ({
        ...p,
        category_label: categoryLabels[p.category] ?? 'Sản phẩm',
        variants: (p.variants || []).map(v => {
            const stock = (v.inventory_levels || []).reduce((sum, i) => sum + i.quantity_on_hand, 0);
            const label = v.attributes ? Object.values(v.attributes).join(' - ') : v.sku;
            return { ...v, stock, label };
        })
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    return [];
  }
}

export async function getCartItems(userId) {
  // Cart items vẫn có thể quản lý local trong AppStore hoặc gọi API nếu backend hỗ trợ
  const items = (mock.cart_items ?? []).filter(i => i.user_id === parseInt(userId));
  return items.map(item => {
    const variant = (mock.product_variants ?? []).find(v => v.id === item.variant_id);
    const product = (mock.products ?? []).find(p => p.id === variant?.product_id);
    return { ...item, variant, product };
  });
}

/**
 * Slot trống sẽ cần logic backend phức tạp hơn. 
 * Tạm thời giữ logic mock hoặc gọi endpoint availability nếu đã viết.
 */
export async function getAvailability({ facilityId, courtId, date } = {}) {
    // Tạm thời giữ mock logic cho phần Availability vì nó yêu cầu logic tính toán giờ phức tạp
    // ... logic tương tự mock cũ ...
    const courts = (mock.courts ?? []); // Giả lập
    const court = courts.find(c => c.id === parseInt(courtId));
    if (!court) return null;

    const slots = [];
    for (let h = 6; h < 22; h++) {
        slots.push({
            id: `slot_${courtId}_${h}`,
            start: `${h.toString().padStart(2, '0')}:00`,
            end: `${(h + 1).toString().padStart(2, '0')}:00`,
            price_cents: 100000,
            available: Math.random() > 0.3 // Mock ngẫu nhiên
        });
    }
    return { facility_id: parseInt(facilityId), court_id: parseInt(courtId), date, slots };
}

export async function getAvailabilitiesFor({ facilityId, courtTypeId, date } = {}) {
  try {
    const facility = await api.fetchFacilityDetail(facilityId);
    let courts = facility.courts || [];
    
    // Ánh xạ id từ mock sang string enum của backend (badminton, tennis, football)
    const typeMap = { 1: 'badminton', 2: 'tennis', 3: 'football' };
    const typeName = typeMap[courtTypeId];
    if (typeName) {
        courts = courts.filter(c => c.court_type === typeName);
    }

    const slotsByCourtId = {};
    for (const c of courts) {
        // Tạm thời mock slots cho từng sân nếu backend chưa có endpoint chi tiết availability
        const rules = mock.price_rules?.filter(r => r.active) || [];
        const slots = [];
        for (let h = 6; h < 22; h++) {
            const start = `${date}T${h.toString().padStart(2, '0')}:00:00Z`;
            const rule = rules[0] || { price_cents: 100000 };
            slots.push({
                start: `${h.toString().padStart(2, '0')}:00`,
                end: `${(h + 1).toString().padStart(2, '0')}:00`,
                price_cents: rule.price_cents,
                available: Math.random() > 0.2 // Mock ngẫu nhiên
            });
        }
        slotsByCourtId[c.id] = slots;
    }
    return { courts, slotsByCourtId };
  } catch (error) {
     console.error("Lỗi lấy lịch trống:", error);
     return { courts: [], slotsByCourtId: {} };
  }
}
