import axiosClient from "../../../config/axios";
import type { LoginPayload } from "../types/auth.types";



export const AuthService = {
  login: async (data: LoginPayload) => {
    return await axiosClient.post('/admin/auth/login', data);
  },
  logout: async () => {
    return await axiosClient.post('/admin/auth/logout');
  },
};