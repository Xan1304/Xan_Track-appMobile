import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { DashboardService } from '../services/dashboard.service';

const TARGET_KPI = 2000000000;

export function useManageDashboard() {
  const [managerData, setManagerData] = useState<any>(null);
  const [stats, setStats] = useState({ teamRevenue: 0, kpiPercent: 0, totalStaff: 0, pendingLeaves: 0 });
  const [kpiToday, setKpiToday] = useState({ donHomNay: 0, saleDangLam: 0, shopChuaGhe: 0, doanhThuThang: 0 });
  const [rescueCount, setRescueCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await DashboardService.fetchManageDashboardData(user.email!);
      
      setManagerData(data.profile);
      setChartData(data.chartData);
      setStats({
        teamRevenue: data.stats.teamRevenue,
        kpiPercent: Math.min((data.stats.teamRevenue / TARGET_KPI) * 100, 100),
        totalStaff: data.stats.totalStaff,
        pendingLeaves: data.stats.pendingLeaves,
      });
      setKpiToday(data.kpiToday);
      setRescueCount(data.rescueCount);

    } catch (error) {
      console.error('Lỗi Admin:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminData().then(() => setRefreshing(false));
  }, [fetchAdminData]);

  return {
    managerData,
    stats,
    kpiToday,
    rescueCount,
    chartData,
    loading,
    refreshing,
    fetchAdminData,
    onRefresh
  };
}
