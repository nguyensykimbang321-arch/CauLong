import axiosClient from '../../../config/axios';
import type { ApiResponse } from '../../../types/api.type';
import type { AdjustInventoryPayload } from '../types/product.types';

export const InventoryService = {
  // Cập nhật tồn kho (Cộng/Trừ)
  adjustInventory: async (payload: AdjustInventoryPayload) => {
    return await axiosClient.post<unknown, ApiResponse<unknown>>('/admin/inventory/adjust', payload);
  },

  // Lấy danh sách sắp hết hàng để cảnh báo
  getLowStockAlerts: async () => {
    return await axiosClient.get<unknown, ApiResponse<unknown>>('/admin/inventory/low-stock');
  },

  getVariantStock: async (facilityId: number, variantId: number) => {
    return await axiosClient.get<unknown, ApiResponse<unknown>>(`/admin/inventory/facility/${facilityId}/variant/${variantId}`);
  }
};