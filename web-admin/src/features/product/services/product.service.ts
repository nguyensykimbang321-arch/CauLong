import axiosClient from '../../../config/axios';
import type { ApiResponse, ApiListResponse } from '../../../types/api.type'; // Đảm bảo bạn đã có type này trong dự án
import type { 
  Product, 
  ProductVariant, 
  CreateProductPayload, 
  UpdateProductPayload, 
  VariantPayload,
  Facility,
  PosProduct,
  ProductFilter
} from '../types/product.types';

const BASE_URL = '/admin/products';

export const ProductService = {
  // ==========================================
  // --- A. CÁC API QUẢN LÝ SẢN PHẨM CHUNG ---
  // ==========================================

  // 1. Lấy toàn bộ danh sách sản phẩm (Bao gồm cả variants và inventory bên trong)
  getAllProducts: async (params?: unknown) => {
    return await axiosClient.get<unknown, ApiResponse<Product[]>>(BASE_URL, { params });
  },

  // 2. Lấy chi tiết 1 sản phẩm
  getProductById: async (id: number) => {
    return await axiosClient.get<unknown, ApiResponse<Product>>(`${BASE_URL}/${id}`);
  },

  // 3. Tạo sản phẩm mới (có thể chèn luôn mảng variants vào payload)
  createProduct: async (payload: CreateProductPayload) => {
    return await axiosClient.post<unknown, ApiResponse<Product>>(BASE_URL, payload);
  },

  // 4. Sửa thông tin chung của sản phẩm
  updateProduct: async (id: number, payload: UpdateProductPayload) => {
    return await axiosClient.put<unknown, ApiResponse<Product>>(`${BASE_URL}/${id}`, payload);
  },

  // 5. Bật/Tắt trạng thái Xóa mềm (Đưa vào thùng rác hoặc Khôi phục)
  toggleDeleteProduct: async (id: number) => {
    return await axiosClient.patch<unknown, ApiResponse<unknown>>(`${BASE_URL}/${id}/toggle-delete`);
  },

  // ==========================================
  // --- B. CÁC API QUẢN LÝ BIẾN THỂ (VARIANTS) ---
  // ==========================================

  // 6. Lấy danh sách biến thể của 1 sản phẩm (Dùng khi bấm mở rộng dòng Bảng 1)
  getVariants: async (productId: number) => {
    return await axiosClient.get<unknown, ApiResponse<ProductVariant[]>>(`${BASE_URL}/${productId}/variants`);
  },

  // 7. Thêm danh sách biến thể mới cho cây vợt/đôi giày đã có
  addVariants: async (productId: number, payload: { variants: VariantPayload[] }) => {
    return await axiosClient.post<unknown, ApiResponse<ProductVariant[]>>(`${BASE_URL}/${productId}/variants`, payload);
  },

  // 8. Cập nhật thông tin 1 biến thể (Giá, SKU, Size, Màu...)
  updateVariant: async (productId: number, variantId: number, payload: Partial<VariantPayload>) => {
    return await axiosClient.put<unknown, ApiResponse<ProductVariant>>(`${BASE_URL}/${productId}/variants/${variantId}`, payload);
  },

  // 9. Xóa mềm / Khôi phục 1 biến thể
  toggleDeleteVariant: async (productId: number, variantId: number) => {
    return await axiosClient.patch<unknown, ApiResponse<unknown>>(`${BASE_URL}/${productId}/variants/${variantId}/toggle-delete`);
  },

  getFacilities: async () => {
    return axiosClient.get<Facility[]>(
      "/admin/facilities"
    );
  },

  getProductsByFacility: async (
    facilityId: number
  ) => {
    return axiosClient.get<PosProduct[]>(
      `/admin/inventory/facility/${facilityId}`
    );
  },

  searchProducts: async (filters?: ProductFilter) => {
    return await axiosClient.get<unknown, ApiListResponse<Product[]>>(`${BASE_URL}/search`, {params: filters});
  }
};