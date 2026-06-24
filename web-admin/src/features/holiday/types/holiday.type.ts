export interface Holiday {
  id: number;
  name: string;
  holiday_date: string; // YYYY-MM-DD
  surcharge_percent: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HolidayPayload {
  name: string;
  holiday_date: string;
  surcharge_percent: number;
}
