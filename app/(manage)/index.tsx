import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useManageDashboard } from '../../src/hooks/useManageDashboard';

const { width } = Dimensions.get('window');
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
  const router = useRouter();
  const {
    managerData,
    stats,
    kpiToday,
    rescueCount,
    chartData,
    loading,
    refreshing,
    fetchAdminData,
    onRefresh
  } = useManageDashboard();

  useFocusEffect(
    useCallback(() => { fetchAdminData(); }, [fetchAdminData])
  );

  const adminTools = [
    { name: 'Giám sát Checkin', icon: 'map-search-outline', color: NAVY, route: '/(manage)/features/checkin-history' },
    { name: 'Quản lý nhân viên', icon: 'account-group-outline', color: '#7c3aed', route: '/(manage)/features/staff' },
    { name: 'Điều phối khẩn cấp', icon: 'flash-outline', color: '#b45309', route: '/(manage)/features/rescue-dispatch' },
    { name: 'Tồn kho shop', icon: 'clipboard-list-outline', color: '#475569', route: '/(manage)/features/inventory-report' },
    { name: 'Tuyến & Cửa hàng', icon: 'map-marker-path', color: '#0891b2', route: '/(manage)/features/manage-routes-stores' },
    { name: 'Duyệt đơn phép', icon: 'calendar-check-outline', color: '#db2777', route: '/(manage)/features/leave-requests' },
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
          onPress={() => router.push('/(manage)/features/leave-requests' as any)}
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

      <View style={styles.dateBar}>
        <Text style={styles.dateText}>{getTodayLabel()}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 18 }}>
          {/* Cột trái */}
          <View style={{ flex: 1, marginRight: 5, gap: 10 }}>
            <View style={[styles.newKpiCard, { borderColor: 'rgba(5,150,105,0.15)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="walk-outline" size={16} color="#059669" />
                <Text style={{ fontSize: 12, color: '#64748b' }}>Sale đang làm</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#059669' }}>{kpiToday?.saleDangLam || 0}</Text>
            </View>
            <View style={[styles.newKpiCard, { borderColor: 'rgba(180,83,9,0.15)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MaterialCommunityIcons name="storefront-outline" size={16} color="#b45309" />
                <Text style={{ fontSize: 12, color: '#64748b' }}>Shop chưa ghé</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#b45309' }}>{kpiToday?.shopChuaGhe || 0}</Text>
            </View>
          </View>

          {/* Cột phải */}
          <View style={{ flex: 1, marginLeft: 5, gap: 10 }}>
            <View style={[styles.newKpiCard, { borderColor: 'rgba(26,58,107,0.15)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="receipt-outline" size={16} color={NAVY} />
                <Text style={{ fontSize: 12, color: '#64748b' }}>Đơn hôm nay</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: NAVY }}>{kpiToday?.donHomNay || 0}</Text>
            </View>
            <View style={[styles.newKpiCard, { borderColor: 'rgba(124,58,237,0.15)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="trending-up-outline" size={16} color="#7c3aed" />
                <Text style={{ fontSize: 12, color: '#64748b' }}>Doanh thu</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#7c3aed' }}>
                {kpiToday?.doanhThuThang >= 1_000_000_000
                    ? (kpiToday?.doanhThuThang / 1_000_000_000).toFixed(1) + ' tỷ'
                    : kpiToday?.doanhThuThang >= 1_000_000
                      ? (kpiToday?.doanhThuThang / 1_000_000).toFixed(0) + ' tr'
                      : (kpiToday?.doanhThuThang || 0).toLocaleString() + ' đ'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Trung tâm điều hành</Text>
        <View style={styles.toolGrid}>
          {adminTools.map((tool, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.toolCard, { position: 'relative' }]}
              activeOpacity={0.7}
              onPress={() => router.push(tool.route as any)}
            >
              <View style={[styles.toolIconBox, { backgroundColor: tool.color + '12' }]}>
                <MaterialCommunityIcons name={tool.icon as any} size={22} color={tool.color} />
              </View>
              <Text style={styles.toolLabel}>{tool.name}</Text>
              
              {tool.name === 'Điều phối khẩn cấp' && rescueCount > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -4,
                  backgroundColor: '#dc2626', borderRadius: 8,
                  minWidth: 18, height: 18,
                  justifyContent: 'center', alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{rescueCount}</Text>
                </View>
              )}
              {tool.name === 'Duyệt đơn phép' && stats.pendingLeaves > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -4,
                  backgroundColor: '#dc2626', borderRadius: 8,
                  minWidth: 18, height: 18,
                  justifyContent: 'center', alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{stats.pendingLeaves}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  newKpiCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, padding: 14 },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 42, height: 42, borderRadius: 10, backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(26,58,107,0.25)' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  statusDot: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  routeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NAVY },
  routeText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  notifBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#f8fafc', position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  dateBar: { paddingHorizontal: 18, paddingVertical: 7, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  dateText: { fontSize: 11, color: '#94a3b8' },
  scrollContent: { paddingBottom: 36 },
  kpiRow: { flexDirection: 'row', gap: 10, padding: 14 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  kpiLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, color: '#94a3b8', marginBottom: 6 },
  kpiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  kpiValue: { fontSize: 22, fontWeight: '600', color: '#0f172a' },
  kpiDenom: { fontSize: 12, color: '#94a3b8', fontWeight: '400' },
  progressBar: { height: 3, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginBottom: 4 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', alignItems: 'center' },
  quickIcon: { width: 38, height: 38, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickValue: { fontSize: 20, fontWeight: '600', color: '#0f172a' },
  quickLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7, color: '#94a3b8', marginHorizontal: 14, marginTop: 14, marginBottom: 10 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 8, justifyContent: 'space-between' },
  toolCard: { width: (width - 36) / 3, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', marginBottom: 2 },
  toolIconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  toolLabel: { fontSize: 11, fontWeight: '500', color: '#334155', textAlign: 'center', lineHeight: 15 },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 14, padding: 18, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', minHeight: 160 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130 },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '35%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barValue: { fontSize: 9, fontWeight: '600', color: NAVY, marginBottom: 5 },
  barLabel: { fontSize: 9, marginTop: 8, color: '#94a3b8', fontWeight: '500' },
  barLabelActive: { color: NAVY, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 40 },
});
