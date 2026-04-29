import { supabase } from './supabase';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export class DashboardService {
  /**
   * Fetches data for the Sale Dashboard
   */
  static async fetchSaleDashboardData(userEmail: string, currentLoc: any) {
    const { data: profile, error: profileErr } = await supabase
      .from('ho_so_nhan_vien')
      .select('ho_ten, chuc_vu, tuyen_id, tuyen_ban_hang(ten_tuyen)')
      .eq('email', userEmail)
      .single();

    if (profileErr) throw profileErr;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Check leave
    const { data: leaveData } = await supabase
      .from('don_nghi_phep')
      .select('*')
      .eq('nhan_vien_email', userEmail)
      .eq('trang_thai', 'da_duyet')
      .lte('ngay_bat_dau', today)
      .gte('ngay_ket_thuc', today);
    const checkingOnLeave = !!leaveData && leaveData.length > 0;

    // Check ongoing checkin
    const { data: latestAction } = await supabase
      .from('lich_su_checkin')
      .select('*, danh_sach_cua_hang(*)')
      .eq('nhan_vien_email', userEmail)
      .gte('thoi_gian', startOfToday)
      .order('thoi_gian', { ascending: false })
      .limit(1);

    let ongoingStore = null;
    if (latestAction && latestAction.length > 0 && latestAction[0].loai_hinh !== 'checkout') {
      ongoingStore = latestAction[0].danh_sach_cua_hang;
    }

    // Checkouts
    const { data: checkouts } = await supabase.from('lich_su_checkin')
      .select('cua_hang_id, thoi_gian')
      .eq('nhan_vien_email', userEmail)
      .eq('loai_hinh', 'checkout')
      .gte('thoi_gian', startOfToday);
      
    const finishedIds = checkouts?.map(c => c.cua_hang_id) || [];
    const checkoutTimeMap: Record<string, string> = {};
    checkouts?.forEach(c => { checkoutTimeMap[c.cua_hang_id] = c.thoi_gian; });

    // Revenue
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = new Date(currentYear, now.getMonth(), 1);
    const monthEnd = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);

    const { data: orders } = await supabase.from('don_hang_doanh_thu')
      .select('tong_tien').eq('nhan_vien_email', userEmail)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());
    const totalRevenue = orders?.reduce((sum, item) => sum + (Number(item.tong_tien) || 0), 0) || 0;

    // KPI Target
    const { data: kpi } = await supabase.from('kpi_muc_tieu')
      .select('muc_tieu_doanh_thu')
      .eq('nhan_vien_email', userEmail)
      .eq('thang', currentMonth)
      .eq('nam', currentYear)
      .maybeSingle();
    const kpiTarget = kpi?.muc_tieu_doanh_thu || 0;

    const processStore = (s: any, isRescue: boolean) => ({
      ...s,
      distance: currentLoc
        ? calculateDistance(currentLoc.coords.latitude, currentLoc.coords.longitude, s.lat, s.lng)
        : 0,
      isDone: finishedIds.includes(s.id),
      checkoutTime: checkoutTimeMap[s.id] || null,
      isRescue,
    });

    // Main stores
    let mainData: any[] = [];
    if (profile.tuyen_id) {
      const { data: shops } = await supabase.from('danh_sach_cua_hang').select('*').eq('tuyen_id', profile.tuyen_id);
      if (shops) mainData = shops.map(s => processStore(s, false)).sort((a, b) => a.distance - b.distance);
    }

    // Rescue stores
    const { data: tempJobs } = await supabase.from('dieu_phoi_tam_thoi')
      .select('cua_hang_id, danh_sach_cua_hang(*)')
      .eq('nhan_vien_email', userEmail)
      .eq('ngay_dieu_dong', today);

    const rawRescue = tempJobs?.map(j => processStore(j.danh_sach_cua_hang, true)).filter(s => s) || [];
    const rescueData = rawRescue
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      .sort((a, b) => a.distance - b.distance);

    return {
      profile,
      isOnLeave: checkingOnLeave,
      ongoingStore,
      mainStores: mainData,
      rescueStores: rescueData,
      stats: {
        visited: finishedIds.length,
        total: mainData.length + rescueData.length,
        revenue: totalRevenue,
        kpiTarget,
      }
    };
  }

  /**
   * Fetches data for the Manage Dashboard
   */
  static async fetchManageDashboardData(userEmail: string) {
    const { data: profile } = await supabase.from('ho_so_nhan_vien')
      .select('ho_ten, chuc_vu, ma_nhan_vien')
      .eq('email', userEmail)
      .maybeSingle();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // KPI 1: Đơn hôm nay
    const { count: donHomNay } = await supabase.from('don_hang_doanh_thu').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday);

    // KPI 2: Sale đang đi làm
    const { data: activeStaff } = await supabase.from('ho_so_nhan_vien').select('email').eq('trang_thai', 'dang_lam');
    let saleDangLam = 0;
    if (activeStaff) {
      for (const staff of activeStaff) {
        const { data: latestAction } = await supabase.from('lich_su_checkin')
          .select('loai_hinh').eq('nhan_vien_email', staff.email)
          .gte('thoi_gian', startOfToday).order('thoi_gian', { ascending: false }).limit(1);
        if (latestAction && latestAction.length > 0 && latestAction[0].loai_hinh !== 'checkout') saleDangLam++;
      }
    }

    // KPI 3: Shop chưa ghé
    const { count: totalShops } = await supabase.from('danh_sach_cua_hang').select('*', { count: 'exact', head: true });
    const { data: visitedShops } = await supabase.from('lich_su_checkin').select('cua_hang_id').eq('loai_hinh', 'checkout').gte('thoi_gian', startOfToday);
    const visitedSet = new Set(visitedShops?.map(s => s.cua_hang_id) || []);
    const shopChuaGhe = Math.max(0, (totalShops || 0) - visitedSet.size);

    // KPI 4: Doanh thu tháng
    const { data: ordersMonth } = await supabase.from('don_hang_doanh_thu').select(`tong_tien, nhan_vien_email, ho_so_nhan_vien ( ho_ten )`).gte('created_at', startOfMonth);
    const doanhThuThang = ordersMonth?.reduce((sum, item) => sum + (Number(item.tong_tien) || 0), 0) || 0;

    // Rescue count: absent staff today
    const { count: rescueCount } = await supabase.from('don_nghi_phep')
      .select('*', { count: 'exact', head: true })
      .eq('trang_thai', 'da_duyet')
      .lte('ngay_bat_dau', todayStr).gte('ngay_ket_thuc', todayStr);

    const { count: staffCount } = await supabase.from('ho_so_nhan_vien').select('*', { count: 'exact', head: true }).eq('vai_tro', 'nhan_vien');
    const { count: leaveCount } = await supabase.from('don_nghi_phep').select('*', { count: 'exact', head: true }).eq('trang_thai', 'cho_duyet');

    const groupedData = (ordersMonth || []).reduce((acc: any, curr) => {
      const profileData = Array.isArray(curr.ho_so_nhan_vien) ? curr.ho_so_nhan_vien[0] : curr.ho_so_nhan_vien;
      const displayName = profileData?.ho_ten || curr.nhan_vien_email.split('@')[0];
      acc[displayName] = (acc[displayName] || 0) + Number(curr.tong_tien);
      return acc;
    }, {});

    const chartData = Object.keys(groupedData).map(name => ({ name, value: groupedData[name] })).sort((a, b) => b.value - a.value).slice(0, 4);

    return {
      profile, chartData,
      stats: { teamRevenue: doanhThuThang, totalStaff: staffCount || 0, pendingLeaves: leaveCount || 0 },
      kpiToday: { donHomNay: donHomNay || 0, saleDangLam, shopChuaGhe, doanhThuThang },
      rescueCount: rescueCount || 0,
    };
  }
}
