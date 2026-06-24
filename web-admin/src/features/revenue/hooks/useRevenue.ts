import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { RevenueService } from '../services/revenue.service';
import type {
  RevenueSummary,
  RevenueChartItem,
  RevenueBreakdownResponse,
  RevenueTransactionItem,
  RevenueGroupBy,
  RevenueProvider,
  RevenueSource,
} from '../types/revenue.types';

export const useRevenue = () => {
  const [fromDate, setFromDate] = useState<string>(
    dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  );
  const [toDate, setToDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>('day');
  const [provider, setProvider] = useState<RevenueProvider | 'all'>('all');
  const [source, setSource] = useState<RevenueSource | 'all'>('all');
  const [facilityId, setFacilityId] = useState<number | undefined>(undefined);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Dữ liệu states
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartItem[]>([]);
  const [breakdown, setBreakdown] = useState<RevenueBreakdownResponse | null>(null);
  const [transactions, setTransactions] = useState<RevenueTransactionItem[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        from: fromDate,
        to: toDate,
        facility_id: facilityId,
      };

      const chartParams = {
        ...queryParams,
        group_by: groupBy,
      };

      const transParams = {
        ...queryParams,
        provider,
        source,
        page,
        limit,
      };

      const [summaryRes, chartRes, breakdownRes, transRes] = await Promise.all([
        RevenueService.getRevenueSummary(queryParams),
        RevenueService.getRevenueChart(chartParams),
        RevenueService.getRevenueBreakdown(queryParams),
        RevenueService.getRevenueTransactions(transParams),
      ]);

      setSummary(summaryRes);
      setChartData(chartRes?.data || []);
      setBreakdown(breakdownRes);
      setTransactions(transRes?.items || []);
      setTotalTransactions(transRes?.pagination?.total || 0);
    } catch (err) {
      console.error('Lỗi tải dữ liệu doanh thu:', err);
      const errMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      setError(errMsg);
      message.error('Lỗi tải dữ liệu doanh thu!');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, facilityId, groupBy, provider, source, page, limit]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const handleDateRangeChange = (dates: [string, string]) => {
    setFromDate(dates[0]);
    setToDate(dates[1]);
    setPage(1);
  };

  const handleGroupByChange = (group: RevenueGroupBy) => {
    setGroupBy(group);
  };

  const handleProviderChange = (prov: RevenueProvider | 'all') => {
    setProvider(prov);
    setPage(1);
  };

  const handleSourceChange = (src: RevenueSource | 'all') => {
    setSource(src);
    setPage(1);
  };

  const handleFacilityChange = (id: number | undefined) => {
    setFacilityId(id);
    setPage(1);
  };

  const handlePageChange = (p: number, l?: number) => {
    setPage(p);
    if (l) setLimit(l);
  };

  return {
    filters: {
      from: fromDate,
      to: toDate,
      groupBy,
      provider,
      source,
      facilityId,
    },
    pagination: {
      page,
      limit,
      total: totalTransactions,
    },
    summary,
    chartData,
    breakdown,
    transactions,
    loading,
    error,
    refresh: fetchRevenueData,
    handleDateRangeChange,
    handleGroupByChange,
    handleProviderChange,
    handleSourceChange,
    handleFacilityChange,
    handlePageChange,
  };
};
