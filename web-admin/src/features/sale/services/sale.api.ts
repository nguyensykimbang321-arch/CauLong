import axiosClient from "../../../config/axios";

import type {
  PosProduct,
  Facility,
  Order,
} from "../types/sale.types";
import type { ApiResponse } from "../../../types/api.type";

export const PosService = {
  // Danh sách cơ sở
  getFacilities: async () => {
    return axiosClient.get<Facility[]>(
      "/admin/facilities"
    );
  },

  // Variant của sản phẩm
  getVariants: async (
    productId: number
  ) => {
    return axiosClient.get(
      `/admin/products/${productId}/variants`
    );
  },

  // Tồn kho theo cơ sở
  getProductsByFacility: async (
    facilityId: number
  ) => {
    return axiosClient.get<PosProduct[]>(
      `/admin/inventory/facility/${facilityId}`
    );
  },

  createPosOrder: async (payload: {
    facility_id: number;

    payment_method: "cash" | "vnpay";

    note?: string;

    items: {
      variant_id: number;
      quantity: number;
    }[];
  }) => {
    return axiosClient.post(
      "/admin/orders/pos",
      payload
    );
  },

  getAllOrders: async () => {
    return await axiosClient.get<unknown, ApiResponse<Order[]>>('/admin/orders');
  },

  // Lấy đơn hàng CHỜ THANH TOÁN
  getPendingPayment: async () => {
    return await axiosClient.get<unknown, ApiResponse<Order[]>>('/admin/orders/pending-payment');
  },

  // Lấy đơn hàng CHỜ NHẬN HÀNG
  getPendingPickup: async () => {
    return await axiosClient.get<unknown, ApiResponse<Order[]>>('/admin/orders/pending-pickup');
  },

  // Xem chi tiết 1 đơn hàng
  getOrderById: async (id: number) => {
    return await axiosClient.get<unknown, ApiResponse<Order>>(`/admin/orders/${id}`);
  },

  // Staff Xác nhận đơn hàng
  confirmOrder: async (id: number) => {
    return await axiosClient.patch<unknown, ApiResponse<unknown>>(`/admin/orders/${id}/confirm`);
  },

  // Staff Xác nhận đã thu tiền mặt
  payCash: async (id: number) => {
    return await axiosClient.patch<unknown, ApiResponse<unknown>>(`/admin/orders/${id}/pay-cash`);
  },

  // Staff Xác nhận đã giao hàng (Hoàn thành đơn)
  completeOrder: async (id: number) => {
    return await axiosClient.patch<unknown, ApiResponse<unknown>>(`/admin/orders/${id}/complete`);
  }
};