export interface PosVariant {
  id: number;
  sku: string;
  price_cents: number;
  attributes: Record<string, any>;
  inventory_level?: {
    quantity_on_hand: number;
  };
}

export interface PosProduct {
  id: number;
  name: string;
  thumbnail_url: string | null;
  variants: PosVariant[];
}

export interface CartItem {
  variantId: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  maxQuantity: number; // Tồn kho tối đa
}

export interface CreateOrderPayload {
  facility_id: number;
  payment_method: 'cash' | 'vnpay';
  items: { variant_id: number; quantity: number }[];
}