// ============================================================================
// 1. CÁC TYPE HIỂN THỊ DỮ LIỆU (GET) - KHỚP 100% VỚI DATABASE BACKEND
// ============================================================================

// Type cho bảng Tồn kho (Nằm trong Variant)
export interface InventoryLevel {
  id: number;
  facility_id: number;
  available_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
}

// Type cho bảng Biến thể (Nằm trong Product)
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  attributes: Record<string, unknown> | null; // Chứa JSON như { size: '4U', color: 'Red' }
  price_cents: number;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Cực kỳ quan trọng để FE biết trạng thái Xóa mềm (Thùng rác)
  
  // Mối quan hệ: 1 Biến thể có 1 mức tồn kho (Alias khớp với Backend)
  inventory_levels?: InventoryLevel; 
}

// Type cho bảng Sản phẩm (Cha)
export interface Product {
  id: number;
  name: string;
  slug: string;
  category: 'racket' | 'shuttlecock' | 'shoes' | 'apparel' | 'accessory' | string;
  description: string | null;
  thumbnail_url: string | null;
  rating: string | number; // Decimal từ DB thường trả về string, ép kiểu nếu cần
  review_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Để hiển thị nút "Khôi phục" hoặc "Xóa mềm"
  
  // Mối quan hệ: 1 Sản phẩm có nhiều Biến thể
  variants: ProductVariant[];
}


// ============================================================================
// 2. CÁC TYPE DÙNG CHO FORM / GỬI DỮ LIỆU LÊN API (POST, PUT)
// ============================================================================

// Payload để tạo Biến thể mới (Lúc tạo mới chưa có ID)
export interface VariantPayload {
  sku: string;
  price_cents: number;
  attributes?: Record<string, unknown>;
  barcode?: string;
}

// Payload khi Admin bấm "Thêm Sản Phẩm Mới"
export interface CreateProductPayload {
  name: string;
  slug: string;
  category: string;
  description?: string;
  thumbnail_url?: string;
  // Cho phép chèn luôn danh sách biến thể ngay lúc tạo sản phẩm cha
  variants?: VariantPayload[]; 
}

// Payload khi Admin sửa thông tin chung của Sản phẩm
export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  thumbnail_url?: string;
}

// Payload khi Cập nhật (Cộng/Trừ) Tồn Kho từ Inventory Service
export interface AdjustInventoryPayload {
  variant_id: number;
  facility_id: number;
  quantity_change: number; // Số dương để nhập thêm, số âm để trừ đi
  reason: 'restock' | 'sale' | 'damage' | 'adjustment';
  notes?: string;
}