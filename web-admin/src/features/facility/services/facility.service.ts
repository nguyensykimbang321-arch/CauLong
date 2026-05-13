import axiosClient from '../../../config/axios';
import type { ApiResponse } from '../../../types/api.type';
import type { FacilityLite, FacilityWithCourtsResponse } from '../../booking/types/booking.types';

export const FacilityService = {

  getAllFacilities: async () => {
    return await axiosClient.get<any, ApiResponse<FacilityLite[]>>('/admin/facilities');
  },

  getCourtsByFacility: async (facilityId: number) => {
    return await axiosClient.get<any, ApiResponse<FacilityWithCourtsResponse>>(`/admin/facilities/${facilityId}/courts`);
  }
};