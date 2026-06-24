// ============================================================================
// 1. CÁC TYPE HIỂN THỊ DỮ LIỆU (GET) - KHỚP 100% VỚI DATABASE BACKEND
// ============================================================================

// Type cho bảng Tồn kho (Nằm trong Variant)
export interface InventoryLevel {
  id: number;
  facility_id: number;
  quantity_on_hand: number;

  facility?: {
    id: number;
    name: string;
  };
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  attributes: Record<string, unknown> | null;
  price_cents: number;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  inventory_levels?: InventoryLevel[];
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
  qty_delta: number;
  reason:
  | 'import'
  | 'sale'
  | 'return'
  | 'adjustment';
  note?: string;
}

export interface PosProduct {
  id: number;
  quantity_on_hand: number;

  variant: {
    id: number;
    sku: string;
    price_cents: number;

    attributes: Record<
      string,
      string
    >;

    product: {
      id: number;
      name: string;
      category: string;
      thumbnail_url: string | null;
    };
  };
}

export interface Facility {
  id: number;
  name: string;
  address: string;
}

export type FormVariant = {
  sku: string;
  price_cents: number;
  attributes?: Record<string, unknown>;
  barcode?: string;
};

export interface FormData {
  name: string;
  slug: string;
  category:
  | 'racket'
  | 'shuttlecock'
  | 'shoes'
  | 'apparel'
  | 'accessory'
  description: string;
  thumbnail_url: string;

  sku: string;
  price_cents: number;

  size: string;
  color: string;

  hasVariants: boolean;
  variants: VariantPayload[];
}

export interface ProductFilter {
  search?: string;
  category?: string;

  min_price?: number;
  max_price?: number;

  rating?: number;

  page?: number;
  limit?: number;

  sort?:
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "rating";

  attrs?: Record<string, string>;
}