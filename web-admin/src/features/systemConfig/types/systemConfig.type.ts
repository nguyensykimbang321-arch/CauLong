export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description: string | null;
  data_type: 'number' | 'string' | 'boolean';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateSystemConfigPayload {
  key: string;
  value: string;
  description?: string;
  data_type: 'number' | 'string' | 'boolean';
}

export interface UpdateSystemConfigPayload {
  value: string;
  description?: string;
}
