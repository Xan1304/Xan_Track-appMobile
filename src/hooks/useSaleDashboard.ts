import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { DashboardService } from '../services/dashboard.service';

interface TuyenInfo {
  ten_tuyen: string;
}

export function useSaleDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [mainStores, setMainStores] = useState<any[]>([]);
  const [rescueStores, setRescueStores] = useState<any[]>([]);
  const [activeRouteName, setActiveRouteName] = useState<string>('Đang tải địa bàn...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [stats, setStats] = useState({ visited: 0, total: 0, revenue: 0, kpiTarget: 0 });
  const [todayStr, setTodayStr] = useState('');

  const initData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      setTodayStr(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      
      let currentLoc: any = null;
      if (status === 'granted') {
        currentLoc = await Location.getLastKnownPositionAsync();
        if (!currentLoc) {
          currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
      }

      const data = await DashboardService.fetchSaleDashboardData(user.email!, currentLoc);

      if (data.ongoingStore) {
        router.replace({
          pathname: '/(sale)/features/store-detail',
          params: { 
            id: data.ongoingStore.id, 
            name: data.ongoingStore.ten_cua_hang, 
            addr: data.ongoingStore.dia_chi, 
            dist: 0 
          }
        } as any);
        return;
      }

      setUserData(data.profile);
      const tuyenData = data.profile.tuyen_ban_hang as unknown as TuyenInfo | TuyenInfo[];
      const routeName = Array.isArray(tuyenData) ? tuyenData[0]?.ten_tuyen : tuyenData?.ten_tuyen;
      setActiveRouteName(routeName || 'Chưa gán tuyến cố định');
      
      setIsOnLeave(data.isOnLeave);
      setMainStores(data.mainStores);
      setRescueStores(data.rescueStores);
      setStats(data.stats);
    } catch (error: any) {
      console.error('Lỗi trang chủ:', error.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    initData().then(() => setRefreshing(false));
  }, [initData]);

  return {
    userData,
    mainStores,
    rescueStores,
    activeRouteName,
    loading,
    refreshing,
    isOnLeave,
    stats,
    todayStr,
    initData,
    onRefresh
  };
}
