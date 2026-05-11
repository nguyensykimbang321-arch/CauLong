import axiosClient from '../../../config/axios';
import type { ApiResponse } from '../../../types/api.type';
import type { FacilityWithCourtsResponse } from '../../booking/types/booking.types';
import type { CreateFacilityPayload, Facility, UpdateFacilityPayload } from '../types/facility.type';

export const FacilityService = {

  getAllFacilities: async () => {
    return await axiosClient.get<any, ApiResponse<Facility[]>>('/admin/facilities');
  },

  getCourtsByFacility: async (facilityId: number) => {
    return await axiosClient.get<any, ApiResponse<FacilityWithCourtsResponse>>(`/admin/facilities/${facilityId}/courts`);
  },

  createFacility: async (data: CreateFacilityPayload) => {
    return await axiosClient.post<any, ApiResponse<Facility>>('/admin/facilities', data);
  },

  updateFacility: async (facilityId: number, data: UpdateFacilityPayload) => {
    return await axiosClient.put<any, ApiResponse<Facility>>(`/admin/facilities/${facilityId}`, data);
  },

  deleteFacility: async (facilityId: number) => {
    return await axiosClient.delete<any, ApiResponse<null>>(`/admin/facilities/${facilityId}`)
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await axiosClient.post<any, ApiResponse<{ url: string }>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getDeletedFacilities: async () => {
        return await axiosClient.get<any, ApiResponse<Facility[]>>('/admin/facilities/trash');
    },

  // Khôi phục
  restoreFacility: async (id: number) => {
      return await axiosClient.post<any, ApiResponse<any>>(`/admin/facilities/${id}/restore`);
  },
};