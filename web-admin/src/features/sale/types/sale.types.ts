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

export interface CartItem {
    variantId: number;
    productId: number;
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    stock: number;
}

export interface Facility {
  id: number;
  name: string;
  address: string;
}

export interface CreateOrderPayload {
  facilityId: number;

  paymentMethod: string;

  note?: string;

  items: {
    variantId: number;
    quantity: number;
  }[];
}

export interface OrderItem {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price_cents: number;
  discount_cents: number;
}

export interface Order {
  id: number;
  user_id: number | null;
  facility_id: number;
  status: 'pending_payment' | 'pending_pickup' | 'completed' | 'cancelled' | 'refunded' | 'expired';
  total_cents: number;
  pickup_type: 'immediate' | 'pickup_store';
  pickup_time: string | null;
  created_at: string;
  items?: OrderItem[]; // Trả về khi xem chi tiết
}