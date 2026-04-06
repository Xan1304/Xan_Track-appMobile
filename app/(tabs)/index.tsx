import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

interface TuyenInfo {
  ten_tuyen: string;
}

export default function EmployeeHome() {
  const [userData, setUserData] = useState<any>(null);
  const [mainStores, setMainStores] = useState<any[]>([]);
  const [rescueStores, setRescueStores] = useState<any[]>([]);
  const [activeRouteName, setActiveRouteName] = useState<string>('Đang tải địa bàn...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [stats, setStats] = useState({ visited: 0, total: 0, revenue: 0 });
  const [todayStr, setTodayStr] = useState('');
  const router = useRouter();

  const formatDistance = (m: number) => {
    if (!m || m === 0) return '0m';
    if (m >= 1000) return (m / 1000).toFixed(1) + 'km';
    return Math.round(m) + 'm';
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'NV';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getTodayLabel = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1} · ${now.getFullYear()}`;
  };

  useFocusEffect(
    useCallback(() => {
      initData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    initData().then(() => setRefreshing(false));
  }, []);

  async function initData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileErr } = await supabase
        .from('ho_so_nhan_vien')
        .select('ho_ten, chuc_vu, tuyen_id, tuyen_ban_hang(ten_tuyen)')
        .eq('email', user.email)
        .single();

      if (profileErr) throw profileErr;
      setUserData(profile);

      const tuyenData = profile.tuyen_ban_hang as unknown as TuyenInfo | TuyenInfo[];
      const routeName = Array.isArray(tuyenData) ? tuyenData[0]?.ten_tuyen : tuyenData?.ten_tuyen;
      setActiveRouteName(routeName || 'Chưa gán tuyến cố định');

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setTodayStr(today);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const { data: leaveData } = await supabase
        .from('don_nghi_phep')
        .select('*')
        .eq('nhan_vien_email', user.email)
        .eq('trang_thai', 'da_duyet')
        .lte('ngay_bat_dau', today)
        .gte('ngay_ket_thuc', today);

      const checkingOnLeave = !!leaveData && leaveData.length > 0;
      setIsOnLeave(checkingOnLeave);

      const { data: latestAction } = await supabase
        .from('lich_su_checkin')
        .select('*, danh_sach_cua_hang(*)')
        .eq('nhan_vien_email', user.email)
        .gte('thoi_gian', startOfToday)
        .order('thoi_gian', { ascending: false })
        .limit(1);

      if (latestAction && latestAction.length > 0 && latestAction[0].loai_hinh !== 'checkout') {
        const store = latestAction[0].danh_sach_cua_hang;
        if (store) {
          router.replace({
            pathname: '/route/store-detail',
            params: { id: store.id, name: store.ten_cua_hang, addr: store.dia_chi, dist: 0 }
          } as any);
          return;
        }
      }

      const { data: checkouts } = await supabase.from('lich_su_checkin')
        .select('cua_hang_id, thoi_gian')
        .eq('nhan_vien_email', user.email)
        .eq('loai_hinh', 'checkout')
        .gte('thoi_gian', startOfToday);
      const finishedIds = checkouts?.map(c => c.cua_hang_id) || [];
      // Map store id -> checkout time for display
      const checkoutTimeMap: Record<string, string> = {};
      checkouts?.forEach(c => { checkoutTimeMap[c.cua_hang_id] = c.thoi_gian; });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: orders } = await supabase.from('don_hang_doanh_thu')
        .select('tong_tien').eq('nhan_vien_email', user.email)
        .gte('created_at', startOfMonth.toISOString());
      const totalRevenue = orders?.reduce((sum, item) => sum + (Number(item.tong_tien) || 0), 0) || 0;

      let currentLoc: any = null;
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        currentLoc = await Location.getCurrentPositionAsync({});
      }

      const processStore = (s: any, isRescue: boolean) => ({
        ...s,
        distance: currentLoc
          ? calculateDistance(currentLoc.coords.latitude, currentLoc.coords.longitude, s.lat, s.lng)
          : 0,
        isDone: finishedIds.includes(s.id),
        checkoutTime: checkoutTimeMap[s.id] || null,
        isRescue,
      });

      let mainData: any[] = [];
      if (profile.tuyen_id) {
        const { data: shops } = await supabase.from('danh_sach_cua_hang').select('*').eq('tuyen_id', profile.tuyen_id);
        if (shops) mainData = shops.map(s => processStore(s, false)).sort((a, b) => a.distance - b.distance);
      }
      setMainStores(mainData);

      const { data: tempJobs } = await supabase.from('dieu_phoi_tam_thoi')
        .select('cua_hang_id, danh_sach_cua_hang(*)')
        .eq('nhan_vien_email', user.email)
        .eq('ngay_dieu_dong', today);

      const rawRescue = tempJobs?.map(j => processStore(j.danh_sach_cua_hang, true)).filter(s => s) || [];
      const rescueData = rawRescue
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        .sort((a, b) => a.distance - b.distance);
      setRescueStores(rescueData);

      setStats({
        visited: finishedIds.length,
        total: mainData.length + rescueData.length,
        revenue: totalRevenue,
      });

    } catch (error: any) {
      console.error('Lỗi trang chủ:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatCheckoutTime = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} ${h < 12 ? 'SA' : 'CH'}`;
  };

  const progressPct = stats.total > 0 ? (stats.visited / stats.total) * 100 : 0;

  // ─── StoreCard ───────────────────────────────────────────────────────────
  const StoreCard = ({ item }: { item: any }) => {
    const iconBg = item.isDone ? '#f0fdf4' : item.isRescue ? '#fffbeb' : '#f8fafc';
    const iconColor = item.isDone ? '#16a34a' : item.isRescue ? '#b45309' : '#475569';

    return (
      <TouchableOpacity
        style={[styles.storeCard, item.isDone && styles.storeCardDone]}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: item.isDone ? '/route/store-detail' : '/route/checkin',
            params: { id: item.id, name: item.ten_cua_hang, dist: Math.round(item.distance), addr: item.dia_chi },
          } as any)
        }
      >
        {/* Icon */}
        <View style={[styles.storeIconBox, { backgroundColor: iconBg }]}>
          {item.isDone ? (
            <Ionicons name="checkmark" size={18} color="#16a34a" />
          ) : item.isRescue ? (
            <MaterialCommunityIcons name="flash" size={18} color="#b45309" />
          ) : (
            <MaterialCommunityIcons name="storefront-outline" size={18} color="#475569" />
          )}
        </View>

        {/* Info */}
        <View style={styles.storeMeta}>
          <Text
            style={[styles.storeName, item.isDone && styles.storeNameDone]}
            numberOfLines={1}
          >
            {item.ten_cua_hang}
          </Text>
          <Text style={styles.storeAddr} numberOfLines={1}>{item.dia_chi}</Text>
        </View>

        {/* Right */}
        <View style={styles.storeRight}>
          {item.isDone ? (
            <>
              <Text style={styles.distDone}>Hoàn thành</Text>
              {item.checkoutTime && (
                <Text style={styles.checkoutTime}>{formatCheckoutTime(item.checkoutTime)}</Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.distText, item.isRescue && styles.distRescue]}>
                {formatDistance(item.distance)}
              </Text>
              {item.isRescue && <Text style={styles.rescueSub}>Hỗ trợ</Text>}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a6b" />
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Avatar với chữ tắt */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userData?.ho_ten)}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isOnLeave ? '#f59e0b' : '#22c55e' }]} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>
              Chào, {userData?.ho_ten?.split(' ').pop() || 'Sale'}
            </Text>
            <View style={styles.routeTag}>
              <View style={[styles.routeDot, { backgroundColor: isOnLeave ? '#f59e0b' : '#1a3a6b' }]} />
              <Text style={styles.routeText}>
                {isOnLeave ? 'ĐANG NGHỈ PHÉP' : activeRouteName}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={() => router.push('/route/request-leave' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color="#475569" />
          <Text style={styles.leaveBtnText}>Xin nghỉ phép</Text>
        </TouchableOpacity>
      </View>

      {/* Ngày tháng */}
      <View style={styles.dateBar}>
        <Text style={styles.dateText}>{getTodayLabel()}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a3a6b" />}
      >

        {/* ── KPI Cards ── */}
        <View style={styles.kpiRow}>
          {/* Tiến độ */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tiến độ hôm nay</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{stats.visited}</Text>
              <Text style={styles.kpiDenom}>/{stats.total} shop</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: '#1a3a6b' }]} />
            </View>
          </View>

          {/* Doanh thu */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Doanh thu tháng {new Date().getMonth() + 1}</Text>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: '#16a34a' }]}>
                {stats.revenue >= 1_000_000
                  ? (stats.revenue / 1_000_000).toFixed(1) + 'tr'
                  : stats.revenue.toLocaleString() + 'đ'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '56%', backgroundColor: '#16a34a' }]} />
            </View>
          </View>
        </View>

        {/* ── Nút lộ trình (ẩn khi nghỉ phép) ── */}
        {!isOnLeave && (
          <>
            <Text style={styles.sectionLabel}>Lộ trình</Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/route/list' as any)}
            >
              <Ionicons name="navigate-outline" size={18} color="#fff" />
              <Text style={styles.ctaBtnText}>Bắt đầu lộ trình</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── Nội dung chính ── */}
        {isOnLeave ? (
          /* Nghỉ phép */
          <View style={styles.leaveCard}>
            <MaterialCommunityIcons name="island" size={52} color="#1a3a6b" />
            <Text style={styles.leaveTitle}>Tận hưởng ngày nghỉ!</Text>
            <Text style={styles.leaveSub}>
              Đơn nghỉ phép đã được phê duyệt. Chúc bạn nghỉ ngơi thật thoải mái và nạp đầy năng lượng.
            </Text>
          </View>
        ) : (
          <>
            {/* Địa bàn chính */}
            <Text style={styles.sectionLabel}>Các Shop gần đây · {activeRouteName}</Text>

            {mainStores.length > 0
              ? mainStores.map(s => <StoreCard key={`main-${s.id}`} item={s} />)
              : <Text style={styles.emptyText}>Chưa có shop địa bàn.</Text>
            }

            {/* Tuyến hỗ trợ */}
            {rescueStores.length > 0 && (
              <>
                <View style={styles.rescueDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.rescueDividerLabel}>Hỗ trợ hôm nay</Text>
                  <View style={styles.dividerLine} />
                </View>
                {rescueStores.map(s => <StoreCard key={`res-${s.id}`} item={s} />)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const NAVY = '#1a3a6b';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f8' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: NAVY,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(26,58,107,0.25)',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  statusDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: '#fff',
  },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#f8fafc',
  },
  leaveBtnText: { fontSize: 11, fontWeight: '500', color: '#475569' },

  // Date bar
  dateBar: {
    paddingHorizontal: 18, paddingVertical: 7,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  dateText: { fontSize: 11, color: '#94a3b8' },

  scrollContent: { paddingBottom: 36 },

  // KPI
  kpiRow: { flexDirection: 'row', gap: 10, padding: 14 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  kpiLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.6, color: '#94a3b8', marginBottom: 6,
  },
  kpiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  kpiValue: { fontSize: 22, fontWeight: '600', color: '#0f172a' },
  kpiDenom: { fontSize: 12, color: '#94a3b8', fontWeight: '400' },
  progressBar: {
    height: 3, backgroundColor: '#f1f5f9',
    borderRadius: 2, marginTop: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.7, color: '#94a3b8',
    marginHorizontal: 14, marginTop: 6, marginBottom: 8,
  },

  // CTA
  ctaBtn: {
    marginHorizontal: 14, marginBottom: 10,
    height: 48, backgroundColor: NAVY,
    borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  ctaArrow: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },

  // Store card
  storeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginHorizontal: 14, marginBottom: 8,
  },
  storeCardDone: { opacity: 0.55 },
  storeIconBox: {
    width: 38, height: 38, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, flexShrink: 0,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  storeMeta: { flex: 1, minWidth: 0 },
  storeName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  storeNameDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  storeAddr: { fontSize: 11, color: '#64748b', marginTop: 2 },
  storeRight: { alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 },
  distText: { fontSize: 12, fontWeight: '600', color: NAVY },
  distRescue: { color: '#b45309' },
  distDone: { fontSize: 11, fontWeight: '500', color: '#16a34a' },
  checkoutTime: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  rescueSub: { fontSize: 10, color: '#b45309', marginTop: 2 },

  // Rescue divider
  rescueDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 16, marginBottom: 10, gap: 10,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.1)' },
  rescueDividerLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.6, color: '#b45309',
  },

  // Leave card
  leaveCard: {
    margin: 14, backgroundColor: '#fff',
    borderRadius: 20, padding: 32,
    alignItems: 'center',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  leaveTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  leaveSub: {
    fontSize: 13, color: '#64748b', textAlign: 'center',
    marginTop: 8, lineHeight: 20,
  },

  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10, marginBottom: 10 },
});