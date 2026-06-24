import { create } from 'zustand';
import type { UserAttributes } from '../types/auth.types';
import { AuthService } from '../services/auth.service';

// Định nghĩa hình thù của kho lưu trữ
interface AuthState {
  user: Partial<UserAttributes> | null;
  isAuthenticated: boolean;
  // Hàm cập nhật thông tin sau khi login thành công
  setAuth: (user: Partial<UserAttributes>, token: string) => void;
  // Hàm xóa sạch thông tin khi logout
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Khởi tạo giá trị mặc định bằng cách đọc từ localStorage (nếu có)
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
        await AuthService.logout();
    } catch (error) {
        console.error("Lỗi khi logout:", error);
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
    }
  },
}));