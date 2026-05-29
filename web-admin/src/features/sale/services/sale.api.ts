// src/features/pos/services/pos.service.ts
import axiosClient from '../../../config/axios';
import type { ApiResponse } from '../types/sale.types';
import type { PosProduct, CreateOrderPayload } from '../types/sale.types';

export const PosService = {
  // Lấy sản phẩm kèm tồn kho theo cơ sở (Facility)
  getProductsByFacility: async (facilityId: number) => {
    return await axiosClient.get<any, ApiResponse<PosProduct[]>>(`/inventory/facility/${facilityId}`);
  },

  // Tạo đơn hàng mới
  createOrder: async (payload: CreateOrderPayload) => {
    return await axiosClient.post<any, ApiResponse<any>>('/orders', payload);
  }
};