import axiosClient from "../../../config/axios"; // Đường dẫn này lấy theo chuẩn file booking của bạn
import type { ApiResponse } from "../../../types/api.type";
import type { Staff, CreateStaffPayload, GetStaffsParams } from "../types/staff.types";

// 🎯 ĐIỀN ĐƯỜNG DẪN GỐC CỦA BẠN VÀO ĐÂY
// Ví dụ Backend cấu hình: app.use('/admin/users', router);
const BASE_URL = '/admin/users';

export const StaffService = {
  /**
   * 1. Lấy danh sách nhân viên
   * @api GET /
   */
  getAllStaffs: async (params?: GetStaffsParams) => {
    // Lưu ý: Tùy backend của bạn trả về mảng Staff[] trực tiếp hay bọc trong object phân trang (VD: { data: Staff[], total: number })
    // Nếu có phân trang, bạn nhớ đổi ApiResponse<Staff[]> thành cấu trúc tương ứng nhé.
    return await axiosClient.get<any, ApiResponse<Staff[]>>(BASE_URL, { params });
  },

  /**
   * 2. Thêm mới nhân viên (Staff)
   * @api POST /staff
   */
  createStaff: async (payload: CreateStaffPayload) => {
    return await axiosClient.post<any, ApiResponse<Staff>>(`${BASE_URL}/staff`, payload);
  },

  /**
   * 3. Khóa / Mở khóa tài khoản nhân viên
   * @api PATCH /:id/status-lock
   */
  toggleStatus: async (id: number) => {
    // API dạng PATCH thường dùng để cập nhật 1 trường.
    // Nếu Backend của bạn tự động đảo ngược trạng thái (đang khóa -> mở, đang mở -> khóa) thì không cần truyền payload (body).
    return await axiosClient.patch<any, ApiResponse<Staff>>(`${BASE_URL}/${id}/status-lock`);
  }
};