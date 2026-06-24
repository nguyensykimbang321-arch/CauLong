import axiosClient from "../../../config/axios";
import type { ApiResponse } from "../../../types/api.type";
import type { SystemConfig, CreateSystemConfigPayload, UpdateSystemConfigPayload } from "../types/systemConfig.type";

export const SystemConfigService = {
  getAllConfigs: async () => {
    return await axiosClient.get<unknown, ApiResponse<SystemConfig[]>>("/admin/system-configs");
  },

  createConfig: async (payload: CreateSystemConfigPayload) => {
    return await axiosClient.post<unknown, ApiResponse<SystemConfig>>("/admin/system-configs", payload);
  },

  updateConfig: async (id: number, payload: UpdateSystemConfigPayload) => {
    return await axiosClient.put<unknown, ApiResponse<SystemConfig>>(`/admin/system-configs/${id}`, payload);
  },

  deleteConfig: async (id: number) => {
    return await axiosClient.delete<unknown, ApiResponse<unknown>>(`/admin/system-configs/${id}`);
  },
};
