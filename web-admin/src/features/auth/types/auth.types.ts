export interface UserAttributes {
  id: number;
  email: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'receptionist' | 'customer';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}