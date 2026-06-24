export type RevenueProvider = 'cash' | 'vnpay';
export type RevenueGroupBy = 'day' | 'month';
export type RevenueSource = 'booking' | 'order';

export interface RevenueSummary {
  total_amount_cents: number;
  total_transactions: number;
  booking_amount_cents: number;
  order_amount_cents: number;
  booking_transactions: number;
  order_transactions: number;
  cash_amount_cents: number;
  vnpay_amount_cents: number;
  average_transaction_amount_cents: number;
  from: string | null;
  to: string | null;
}

export interface RevenueChartItem {
  label: string;
  total_amount_cents: number;
  booking_amount_cents: number;
  order_amount_cents: number;
  total_transactions: number;
}

export interface RevenueChartResponse {
  group_by: RevenueGroupBy;
  data: RevenueChartItem[];
}

export interface RevenueProviderBreakdownItem {
  provider: RevenueProvider;
  total_amount_cents: number;
  total_transactions: number;
}

export interface RevenueSourceBreakdownItem {
  source: RevenueSource;
  total_amount_cents: number;
  total_transactions: number;
}

export interface RevenueBreakdownResponse {
  by_provider: RevenueProviderBreakdownItem[];
  by_source: RevenueSourceBreakdownItem[];
}

export interface RevenueTransactionItem {
  payment_id: number;
  booking_id: number | null;
  order_id: number | null;
  source: RevenueSource;
  provider: RevenueProvider;
  status: 'paid';
  amount_cents: number;
  paid_at: string | null;
  created_at: string;
  facility_id?: number | null;
  facility_name?: string | null;
}

export interface RevenueTransactionsResponse {
  items: RevenueTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface RevenueQueryParams {
  from?: string;
  to?: string;
  facility_id?: number;
}

export interface RevenueChartQueryParams extends RevenueQueryParams {
  group_by?: RevenueGroupBy;
}

export interface RevenueTransactionQueryParams extends RevenueQueryParams {
  provider?: RevenueProvider | 'all';
  source?: RevenueSource | 'all';
  page?: number;
  limit?: number;
  sortBy?: 'paidAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}
