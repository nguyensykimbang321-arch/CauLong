import axiosClient from "../../../config/axios";
import type { ApiResponse } from "../../../types/api.type";
import type { Holiday, HolidayPayload } from "../types/holiday.type";

export const HolidayService = {
  getAllHolidays: async () => {
    return await axiosClient.get<unknown, ApiResponse<Holiday[]>>("/admin/holidays");
  },

  createHoliday: async (payload: HolidayPayload) => {
    return await axiosClient.post<unknown, ApiResponse<Holiday>>("/admin/holidays", payload);
  },

  updateHoliday: async (id: number, payload: Partial<HolidayPayload>) => {
    return await axiosClient.put<unknown, ApiResponse<Holiday>>(`/admin/holidays/${id}`, payload);
  },

  deleteHoliday: async (id: number) => {
    return await axiosClient.delete<unknown, ApiResponse<unknown>>(`/admin/holidays/${id}`);
  },

  restoreHoliday: async (id: number) => {
    return await axiosClient.post<unknown, ApiResponse<Holiday>>(`/admin/holidays/${id}/restore`);
  },
};
