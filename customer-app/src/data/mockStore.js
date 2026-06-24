import * as api from '../services/api';
import storage from '../utils/storage';

export async function getCurrentUser() {
  try {
    const savedUser = await storage.getItem('user');
    if (savedUser) return JSON.parse(savedUser);
  } catch (e) {
    console.error("Lỗi lấy user từ storage:", e);
  }
  return null;
}

export async function getFacilities() {
  try {
    return await api.fetchFacilities();
  } catch (error) {
    console.error("Lỗi lấy danh sách cơ sở:", error);
    return [];
  }
}

export async function getCourtTypes(facilityId = null) {
  try {
    if (facilityId) {
        return await api.fetchCourtTypes(facilityId);
    }
    return [];
  } catch (error) {
    console.error("Lỗi lấy loại sân:", error);
    return [];
  }
}

export async function getCourts({ facilityId, courtTypeId } = {}) {
  try {
    const facility = await api.fetchFacilityDetail(facilityId);
    let courts = facility.courts || [];
    if (courtTypeId) {
        courts = courts.filter(c => c.court_type == courtTypeId);
    }
    return courts;
  } catch (error) {
    console.error("Lỗi lấy danh sách sân:", error);
    return [];
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
      const courtType = court?.type_info?.name;

      const sportLabels = {
        badminton: 'Cầu lông',
        tennis: 'Tennis',
        football: 'Bóng đá',
        table_tennis: 'Bóng bàn',
      };
      const sportLabel = sportLabels[courtType] || '—';

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
       return []; 
    }
    console.error("Lỗi lấy lịch sử đặt sân:", error);
    return [];
  }
}

export async function getProducts(facilityId) {
  try {
    const products = await api.fetchProducts(facilityId);
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
            const stock = (v.inventory_levels || []).reduce((sum, i) => {
                return sum + (i.quantity_on_hand || i.quantity || i.stock || 0);
            }, 0);
            
            const label = v.attributes ? Object.values(v.attributes).join(' - ') : v.sku;
            return { ...v, stock, label };
        })
    }));
  } catch (error) {
    console.error("🔥 LỖI CỬA HÀNG (Shop Error):", error.message);
    return [];
  }
}

export async function getAvailableCourts({ facilityId, courtType, date, startTime, endTime }) {
    try {
        return await api.fetchCheckAvailability({
            facility_id: facilityId,
            date,
            start_time: startTime,
            end_time: endTime,
            court_type: courtType
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách sân trống:", error);
        throw error;
    }
}
