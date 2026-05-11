import type { Dayjs } from "dayjs";

export interface Facility {
  id: number;
  name: string;
  address: string;
  timezone: string;
  open_time: string;
  close_time: string;
  avatar_url: string | null;
  cancel_policy: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateFacilityPayload {
  name: string;

  address: string;

  avatar_url?: string;

  open_time: string;

  close_time: string;

  is_active: boolean;
}

export type UpdateFacilityPayload =
  Partial<CreateFacilityPayload>;

export interface FacilityFormValues {
  name: string;

  address: string;

  avatar_url?: string;

  open_time: Dayjs;

  close_time: Dayjs;

  is_active: boolean;
}