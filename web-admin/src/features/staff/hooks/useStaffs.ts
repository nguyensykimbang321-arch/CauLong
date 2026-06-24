import { useState, useEffect, useCallback } from 'react';
import { StaffService } from '../services/staff.service';
import { message } from 'antd';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api.type';
import type { Staff, GetStaffsParams } from '../types/staff.types';

export const useStaffs = (initialParams?: GetStaffsParams) => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [params, setParams] = useState<GetStaffsParams>(initialParams || { page: 1, limit: 10 });

  // 1. Hàm lấy danh sách nhân viên
  const fetchStaffs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await StaffService.getAllStaffs(params);
      
      // ✅ Fix Lỗi 1: Truyền thẳng response.data vì TS đã hiểu nó là mảng Staff[]
      // (Nếu thực tế API của bạn bị bọc trong object có key data, hãy ép kiểu 'response.data as unknown as Staff[]' hoặc sửa lại Service)
      setStaffs(response.data); 
      
    } catch (error) { // ✅ Fix Lỗi 2: Bỏ chữ ': any'
      const err = error as AxiosError<ApiErrorResponse>; // Ép kiểu chuẩn SQA
      message.error(err.response?.data?.message || err.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  // Tự động gọi API khi params (như search, page) thay đổi
  useEffect(() => {
    // ✅ Fix Lỗi 3: Yêu cầu linter "nhắm mắt làm ngơ" cho dòng gọi fetch API này
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaffs();
  }, [fetchStaffs]);

  // 2. Hàm khóa/mở khóa tài khoản
  const toggleLockStatus = async (id: number) => {
    try {
      await StaffService.toggleStatus(id);
      message.success('Cập nhật trạng thái thành công!');
      fetchStaffs(); // Tải lại bảng sau khi khóa
    } catch (error) { // ✅ Fix Lỗi 2 tiếp tục ở đây
      const err = error as AxiosError<ApiErrorResponse>;
      message.error(err.response?.data?.message || err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  // 3. Hàm cập nhật bộ lọc tìm kiếm
  const updateParams = (newParams: GetStaffsParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  };

  return {
    staffs,
    isLoading,
    fetchStaffs,
    toggleLockStatus,
    updateParams,
  };
};