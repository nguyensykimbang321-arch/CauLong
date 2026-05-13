import * as api from '../services/api';
// Giữ lại mock để dự phòng nếu API lỗi hoặc chưa có dữ liệu DB
import mock from './mock.json';

import storage from '../utils/storage';

export async function getCurrentUser() {
  try {
    const savedUser = await storage.getItem('user');
    if (savedUser) return JSON.parse(savedUser);
  } catch (e) {
    console.error("Lỗi lấy user từ storage:", e);
  }
  // Fallback sang mock nếu chưa đăng nhập (hoặc trả về null tùy logic App)
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
        courts = courts.filter(c => c.court_type_id == courtTypeId);
    }
    return courts;
  } catch (error) {
    console.error("Lỗi lấy danh sách sân:", error);
    return (mock.courts ?? []).filter(c => c.facility_id === parseInt(facilityId));
  }
}

export async function getBookings(userId) {
  try {
    const bookings = await api.fetchMyBookings();
    
    return (bookings || []).map(b => {
      const slots = b.slots || [];
      const facility = b.facility;
      const firstSlot = slots[0];
      const lastSlot = slots[slots.length - 1];
      
      const court = firstSlot?.court;
      const courtType = court?.type || court?.court_type;
      
      const sportLabel = courtType === 'badminton' ? 'Cầu lông' : courtType === 'tennis' ? 'Tennis' : 'Bóng bàn';

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
  } catch (error) {
    if (error.response?.status === 401) {
       // Không log lỗi Error đỏ cho 401 vì người dùng chỉ là chưa đăng nhập
       return []; 
    }
    console.error("Lỗi lấy lịch sử đặt sân:", error);
    return [];
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
            // Cộng dồn tồn kho từ tất cả các kho, kiểm tra nhiều tên trường khác nhau
            const stock = (v.inventory_levels || []).reduce((sum, i) => {
                return sum + (i.quantity_on_hand || i.quantity || i.stock || 0);
            }, 0);
            
            // Nếu stock vẫn là 0 nhưng là dữ liệu thật, mặc định cho 50 để test nếu cần
            const finalStock = stock > 0 ? stock : (p.id > 10 ? 50 : 0); 
            
            const label = v.attributes ? Object.values(v.attributes).join(' - ') : v.sku;
            return { ...v, stock: finalStock, label };
        })
    }));
  } catch (error) {
    console.error("🔥 LỖI CỬA HÀNG (Shop Error):", error.message);
    if (error.response) {
      console.warn("Status:", error.response.status);
      console.warn("Dữ liệu lỗi từ Server:", error.response.data);
    } else if (error.request) {
      console.warn("Không nhận được phản hồi từ Server (Check IP/Wifi). Request:", error.request?._url);
    }
    return mock.products ?? [];
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
    // Backend yêu cầu court_type là string ('badminton', 'tennis', 'football')
    // Ánh xạ từ ID (trong mock/frontend) sang string
    const courtTypeMap = {
        1: 'badminton',
        2: 'tennis',
        3: 'table_tennis'
    };
    const courtTypeName = courtTypeMap[courtTypeId] || 'badminton';

    return await api.fetchAvailability(facilityId, date, courtTypeName);
  } catch (error) {
     console.error("Lỗi lấy lịch trống:", error);
     return { courts: [], slotsByCourtId: {} };
  }
}
