import axiosClient from "../../../config/axios";
import type { ApiResponse } from "../../../types/api.type";
import type { PriceConfig, PriceConfigPayload } from "../types/priceConfig.type";

export const PriceConfigService = {
  getAllConfigs: async (facilityId?: number) => {
    // Có hỗ trợ truyền query params để lọc nếu cần
    const params = facilityId ? { facilityId } : {};
    return await axiosClient.get<any, ApiResponse<PriceConfig[]>>("/admin/price-configs", { params });
  },

  createConfig: async (payload: PriceConfigPayload) => {
    return await axiosClient.post<any, ApiResponse<PriceConfig>>("/admin/price-configs", payload);
  },

  updateConfig: async (id: number, payload: PriceConfigPayload) => {
    return await axiosClient.put<any, ApiResponse<PriceConfig>>(`/admin/price-configs/${id}`, payload);
  },

  deleteConfig: async (id: number) => {
    return await axiosClient.delete<any, ApiResponse<any>>(`/admin/price-configs/${id}`);
  },
};