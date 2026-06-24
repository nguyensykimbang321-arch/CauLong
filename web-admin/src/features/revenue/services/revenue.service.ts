import axiosClient from '../../../config/axios';
import type { ApiResponse } from '../../../types/api.type';
import type {
  RevenueQueryParams,
  RevenueChartQueryParams,
  RevenueTransactionQueryParams,
  RevenueSummary,
  RevenueChartResponse,
  RevenueBreakdownResponse,
  RevenueTransactionsResponse,
} from '../types/revenue.types';

export const RevenueService = {
  getRevenueSummary: async (params?: RevenueQueryParams) => {
    const res = await axiosClient.get<unknown, ApiResponse<RevenueSummary>>('/admin/revenue/summary', { params });
    return res.data;
  },

  getRevenueChart: async (params?: RevenueChartQueryParams) => {
    const res = await axiosClient.get<unknown, ApiResponse<RevenueChartResponse>>('/admin/revenue/chart', { params });
    return res.data;
  },

  getRevenueBreakdown: async (params?: RevenueQueryParams) => {
    const res = await axiosClient.get<unknown, ApiResponse<RevenueBreakdownResponse>>('/admin/revenue/breakdown', { params });
    return res.data;
  },

  getRevenueTransactions: async (params?: RevenueTransactionQueryParams) => {
    const res = await axiosClient.get<unknown, ApiResponse<RevenueTransactionsResponse>>('/admin/revenue/transactions', { params });
    return res.data;
  },
};
