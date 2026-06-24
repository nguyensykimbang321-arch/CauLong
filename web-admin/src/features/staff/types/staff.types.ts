export type UserRole = 'admin' | 'staff' | 'customer';

export interface Staff {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean; // true: Hoạt động, false: Đã khóa
  created_at: string;
}

export interface CreateStaffPayload {
  full_name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
}

export interface StaffFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
}

export interface GetStaffsParams {
  page?: number;
  limit?: number;
  search?: string;
}