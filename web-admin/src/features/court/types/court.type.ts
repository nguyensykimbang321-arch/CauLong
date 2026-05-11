export interface FacilityShort {
  id: number;
  name: string;
  address: string;
}

export interface Court {
  id: number;
  facility_id: number;
  name: string;
  court_type: 'badminton' | 'tennis' | 'football' | 'table_tennis';
  is_active: boolean;
  facility?: FacilityShort; // Dữ liệu join từ backend
}

export interface CourtPayload {
  name: string;
  facility_id: number;
  court_type: 'badminton' | 'tennis' | 'football' | 'table_tennis';
  is_active: boolean;
}