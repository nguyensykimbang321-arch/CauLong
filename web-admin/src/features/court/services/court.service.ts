import axiosClient from "../../../config/axios";
import type { ApiResponse } from "../../../types/api.type";
import type { Court, CourtPayload } from "../types/court.type";

export const CourtService = {
  getAllCourts: async () => {
    return await axiosClient.get<any, ApiResponse<Court[]>>("/admin/courts");
  },

  createCourt: async (payload: CourtPayload) => {
    return await axiosClient.post<any, ApiResponse<Court>>("/admin/courts", payload);
  },

  updateCourt: async (id: number, payload: CourtPayload) => {
    return await axiosClient.put<any, ApiResponse<Court>>(`/admin/courts/${id}`, payload);
  },

  deleteCourt: async (id: number) => {
    return await axiosClient.delete<any, ApiResponse<any>>(`/admin/courts/${id}`);
  },
};