import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const TARGET_KPI = 2000000000;
const NAVY = '#1a3a6b';

const formatShortValue = (val: number) => {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + ' Tỷ';
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(0) + ' Tr';
  return val.toLocaleString();
};

const getInitials = (fullName: string) => {
  if (!fullName) return 'AD';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function AdminDashboard() {
  const [managerData, setManagerData] = useState<any>(null);
  const [stats, setStats] = useState({ teamRevenue: 0, kpiPercent: 0, totalStaff: 0, pendingLeaves: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => { fetchAdminData(); }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminData().then(() => setRefreshing(false));
  }, []);

  async function fetchAdminData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('ho_so_nhan_vien')
        .select('ho_ten, chuc_vu, ma_nhan_vien')
        .eq('email', user.email)
        .maybeSingle();
      if (profile) setManagerData(profile);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase.from('don_hang_doanh_thu')
        .select(`tong_tien, nhan_vien_email, ho_so_nhan_vien ( ho_ten )`)
        .gte('created_at', startOfMonth.toISOString());

      processOrders(orders || []);

      const { count: staffCount } = await supabase.from('ho_so_nhan_vien')
        .select('*', { count: 'exact', head: true }).eq('vai_tro', 'nhan_vien');

      const { count: leaveCount } = await supabase.from('don_nghi_phep')
        .select('*', { count: 'exact', head: true })
        .eq('trang_thai', 'cho_duyet');

      setStats(prev => ({
        ...prev,
        totalStaff: staffCount || 0,
        pendingLeaves: leaveCount || 0
      }));
    } catch (error) {
      console.error('Lỗi Admin:', error);
    } finally {
      setLoading(false);
    }
  }

  function processOrders(orders: any[]) {
    const totalRev = orders.reduce((sum, item) => sum + (Number(item.tong_tien) || 0), 0);
    const groupedData = orders.reduce((acc: any, curr) => {
      const profileData = Array.isArray(curr.ho_so_nhan_vien) ? curr.ho_so_nhan_vien[0] : curr.ho_so_nhan_vien;
      const displayName = profileData?.ho_ten || curr.nhan_vien_email.split('@')[0];
      acc[displayName] = (acc[displayName] || 0) + Number(curr.tong_tien);
      return acc;
    }, {});

    const chartArr = Object.keys(groupedData).map(name => ({
      name, value: groupedData[name]
    })).sort((a, b) => b.value - a.value).slice(0, 4);

    setStats(prev => ({
      ...prev,
      teamRevenue: totalRev,
      kpiPercent: Math.min((totalRev / TARGET_KPI) * 100, 100)
    }));
    setChartData(chartArr);
  }

  const adminTools = [
    { name: 'Giám sát Checkin', icon: 'map-search-outline', color: NAVY, route: '/route-admin/checkin-history' },
    { name: 'Quản lý nhân viên', icon: 'account-group-outline', color: '#7c3aed', route: '/route-admin/staff' },
    { name: 'Điều phối khẩn cấp', icon: 'flash-outline', color: '#b45309', route: '/route-admin/rescue-dispatch' },
    { name: 'Quản lý cửa hàng', icon: 'storefront-outline', color: '#059669', route: '/route-admin/manage-stores' },
    { name: 'Tồn kho shop', icon: 'clipboard-list-outline', color: '#475569', route: '/route-admin/inventory-report' },
    { name: 'Quản lý tuyến', icon: 'map-marker-path', color: '#0891b2', route: '/route-admin/manage-routes' },
  ];

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
  );

  const getTodayLabel = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1} · ${now.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(managerData?.ho_ten)}</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Chào, {managerData?.ho_ten?.split(' ').pop() || 'Sup Sale'}</Text>
            <View style={styles.routeTag}>
              <View style={styles.routeDot} />
              <Text style={styles.routeText}>HỆ THỐNG XAN MILK</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/route-admin/leave-requests' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={18} color="#475569" />
          {stats.pendingLeaves > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingLeaves}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Date bar */}
      <View style={styles.dateBar}>
        <Text style={styles.dateText}>{getTodayLabel()}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
      >
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Doanh số đội tháng {new Date().getMonth() + 1}</Text>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: '#16a34a' }]}>
                {stats.teamRevenue >= 1_000_000_000
                  ? (stats.teamRevenue / 1_000_000_000).toFixed(1) + 'tỷ'
                  : stats.teamRevenue >= 1_000_000
                  ? (stats.teamRevenue / 1_000_000).toFixed(0) + 'tr'
                  : stats.teamRevenue.toLocaleString() + 'đ'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.kpiPercent}%`, backgroundColor: '#16a34a' }]} />
            </View>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tiến độ KPI (2 Tỷ)</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{stats.kpiPercent.toFixed(1)}</Text>
              <Text style={styles.kpiDenom}>%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.kpiPercent}%`, backgroundColor: NAVY }]} />
            </View>
          </View>
        </View>

        {/* Staff + Leave quick stats */}
        <View style={styles.quickRow}>
          <View style={styles.quickCard}>
            <View style={[styles.quickIcon, { backgroundColor: '#f0f4ff' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color={NAVY} />
            </View>
            <Text style={styles.quickValue}>{stats.totalStaff}</Text>
            <Text style={styles.quickLabel}>Nhân viên</Text>
          </View>
          <View style={styles.quickCard}>
            <View style={[styles.quickIcon, { backgroundColor: '#fffbeb' }]}>
              <Ionicons name="calendar-outline" size={20} color="#b45309" />
            </View>
            <Text style={[styles.quickValue, stats.pendingLeaves > 0 && { color: '#b45309' }]}>{stats.pendingLeaves}</Text>
            <Text style={styles.quickLabel}>Chờ duyệt phép</Text>
          </View>
        </View>

        {/* Admin Tools */}
        <Text style={styles.sectionLabel}>Trung tâm điều hành</Text>
        <View style={styles.toolGrid}>
          {adminTools.map((tool, index) => (
            <TouchableOpacity
              key={index}
              style={styles.toolCard}
              activeOpacity={0.7}
              onPress={() => router.push(tool.route as any)}
            >
              <View style={[styles.toolIconBox, { backgroundColor: tool.color + '12' }]}>
                <MaterialCommunityIcons name={tool.icon as any} size={22} color={tool.color} />
              </View>
              <Text style={styles.toolLabel}>{tool.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top chart */}
        <Text style={styles.sectionLabel}>Top chiến thần doanh số</Text>
        <View style={styles.chartCard}>
          {chartData.length > 0 ? (
            <View style={styles.chartBars}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.barGroup}>
                  <Text style={styles.barValue}>{formatShortValue(item.value)}</Text>
                  <View style={[styles.bar, {
                    height: `${(item.value / (chartData[0]?.value || 1)) * 80}%`,
                    backgroundColor: index === 0 ? NAVY : 'rgba(26,58,107,0.15)'
                  }]} />
                  <Text style={[styles.barLabel, index === 0 && styles.barLabelActive]} numberOfLines={1}>
                    {item.name.split(' ').pop()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Tháng này chưa có đơn hàng nào.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f8' },

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
    backgroundColor: '#22c55e',
    borderWidth: 2, borderColor: '#fff',
  },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  routeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NAVY },
  routeText: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  notifBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#f8fafc', position: 'relative',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#ef4444', minWidth: 16, height: 16,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },

  dateBar: {
    paddingHorizontal: 18, paddingVertical: 7,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  dateText: { fontSize: 11, color: '#94a3b8' },

  scrollContent: { paddingBottom: 36 },

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

  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginBottom: 4 },
  quickCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  quickIcon: {
    width: 38, height: 38, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  quickValue: { fontSize: 20, fontWeight: '600', color: '#0f172a' },
  quickLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginTop: 2 },

  sectionLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.7, color: '#94a3b8',
    marginHorizontal: 14, marginTop: 14, marginBottom: 10,
  },

  toolGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10, gap: 8,
    justifyContent: 'space-between',
  },
  toolCard: {
    width: (width - 36) / 3,
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 2,
  },
  toolIconBox: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  toolLabel: {
    fontSize: 11, fontWeight: '500', color: '#334155',
    textAlign: 'center', lineHeight: 15,
  },

  chartCard: {
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 14, padding: 18,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    minHeight: 160,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130 },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '35%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barValue: { fontSize: 9, fontWeight: '600', color: NAVY, marginBottom: 5 },
  barLabel: { fontSize: 9, marginTop: 8, color: '#94a3b8', fontWeight: '500' },
  barLabelActive: { color: NAVY, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 40 },
});