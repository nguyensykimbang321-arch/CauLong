export interface PriceConfig {
  id: number;
  facility_id: number;
  court_type: 'badminton' | 'tennis' | 'football' | 'table_tennis';
  start_time: string; // VD: "05:00:00"
  end_time: string;   // VD: "17:00:00"
  price_per_hour: number;
  facility?: {
    name: string;
  };
}

export interface PriceConfigPayload {
  facility_id: number;
  court_type: 'badminton' | 'tennis' | 'football' | 'table_tennis';
  start_time: string;
  end_time: string;
  price_per_hour: number;
}