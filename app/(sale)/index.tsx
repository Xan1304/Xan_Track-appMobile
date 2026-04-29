import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSaleDashboard } from '../../src/hooks/useSaleDashboard';

export default function EmployeeHome() {
  const router = useRouter();
  const {
    userData,
    mainStores,
    rescueStores,
    activeRouteName,
    loading,
    refreshing,
    isOnLeave,
    stats,
    initData,
    onRefresh
  } = useSaleDashboard();

  useFocusEffect(
    useCallback(() => { initData(); }, [initData])
  );

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

  const formatCompact = (num: number) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + 'tỷ';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'tr';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + 'k';
    return num.toLocaleString() + 'đ';
  };

  const getTodayLabel = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1} · ${now.getFullYear()}`;
  };

  const formatCheckoutTime = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} ${h < 12 ? 'SA' : 'CH'}`;
  };

  const progressPct = stats.total > 0 ? (stats.visited / stats.total) * 100 : 0;

  const StoreCard = ({ item }: { item: any }) => {
    const iconBg = item.isDone ? '#f0fdf4' : item.isRescue ? '#fffbeb' : '#f8fafc';
    const iconColor = item.isDone ? '#16a34a' : item.isRescue ? '#b45309' : '#475569';

    return (
      <TouchableOpacity
        style={[styles.storeCard, item.isDone && styles.storeCardDone]}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: item.isDone ? '/(sale)/features/store-detail' : '/(sale)/features/checkin',
            params: { id: item.id, name: item.ten_cua_hang, dist: Math.round(item.distance), addr: item.dia_chi },
          } as any)
        }
      >
        <View style={[styles.storeIconBox, { backgroundColor: iconBg }]}>
          {item.isDone ? (
            <Ionicons name="checkmark" size={18} color="#16a34a" />
          ) : item.isRescue ? (
            <MaterialCommunityIcons name="flash" size={18} color="#b45309" />
          ) : (
            <MaterialCommunityIcons name="storefront-outline" size={18} color="#475569" />
          )}
        </View>
        <View style={styles.storeMeta}>
          <Text style={[styles.storeName, item.isDone && styles.storeNameDone]} numberOfLines={1}>{item.ten_cua_hang}</Text>
          <Text style={styles.storeAddr} numberOfLines={1}>{item.dia_chi}</Text>
        </View>
        <View style={styles.storeRight}>
          {item.isDone ? (
            <>
              <Text style={styles.distDone}>Hoàn thành</Text>
              {item.checkoutTime && <Text style={styles.checkoutTime}>{formatCheckoutTime(item.checkoutTime)}</Text>}
            </>
          ) : (
            <>
              <Text style={[styles.distText, item.isRescue && styles.distRescue]}>{formatDistance(item.distance)}</Text>
              {item.isRescue && <Text style={styles.rescueSub}>Hỗ trợ</Text>}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  const pendingMainStores = mainStores.filter(s => !s.isDone);
  const pendingRescueStores = rescueStores.filter(s => !s.isDone);
  const visitedStores = [
    ...mainStores.filter(s => s.isDone),
    ...rescueStores.filter(s => s.isDone)
  ];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a3a6b" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userData?.ho_ten)}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isOnLeave ? '#f59e0b' : '#22c55e' }]} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Chào, {userData?.ho_ten?.split(' ').pop() || 'Sale'}</Text>
            <View style={styles.routeTag}>
              <View style={[styles.routeDot, { backgroundColor: isOnLeave ? '#f59e0b' : '#1a3a6b' }]} />
              <Text style={styles.routeText}>{isOnLeave ? 'ĐANG NGHỈ PHÉP' : activeRouteName}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={() => router.push('/(sale)/features/request-leave' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color="#475569" />
          <Text style={styles.leaveBtnText}>Xin nghỉ phép</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateBar}>
        <Text style={styles.dateText}>{getTodayLabel()}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a3a6b" />}
      >
        <View style={styles.kpiRow}>
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

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Mục tiêu tháng {new Date().getMonth() + 1}</Text>
            {stats.kpiTarget === 0 ? (
              <>
                <View style={styles.kpiValueRow}>
                  <Text style={[styles.kpiValue, { color: '#0f172a' }]}>{formatCompact(stats.revenue)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%', backgroundColor: '#e2e8f0' }]} />
                </View>
                <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Chưa có mục tiêu</Text>
              </>
            ) : (
              <>
                <View style={styles.kpiValueRow}>
                  <Text style={[styles.kpiValue, { color: (stats.revenue / stats.kpiTarget) >= 1 ? '#16a34a' : '#1a3a6b' }]}>
                    {formatCompact(stats.revenue)}
                  </Text>
                  <Text style={styles.kpiDenom}>/{formatCompact(stats.kpiTarget)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min(100, Math.round((stats.revenue / stats.kpiTarget) * 100))}%`, 
                    backgroundColor: (stats.revenue / stats.kpiTarget) >= 1 ? '#16a34a' : '#1a3a6b' 
                  }]} />
                </View>
              </>
            )}
          </View>
        </View>

        {!isOnLeave && (
          <>
            <Text style={styles.sectionLabel}>Lộ trình</Text>
            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={() => router.push('/(sale)/features/list' as any)}>
              <Ionicons name="navigate-outline" size={18} color="#fff" />
              <Text style={styles.ctaBtnText}>Bắt đầu lộ trình</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          </>
        )}

        {isOnLeave ? (
          <View style={styles.leaveCard}>
            <MaterialCommunityIcons name="island" size={52} color="#1a3a6b" />
            <Text style={styles.leaveTitle}>Tận hưởng ngày nghỉ!</Text>
            <Text style={styles.leaveSub}>Đơn nghỉ phép đã được phê duyệt. Chúc bạn nghỉ ngơi thật thoải mái và nạp đầy năng lượng.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Các Shop gần đây · {activeRouteName}</Text>
            {pendingMainStores.length > 0
              ? (
                <>
                  {pendingMainStores.slice(0, 3).map(s => <StoreCard key={`main-${s.id}`} item={s} />)}
                  {pendingMainStores.length > 3 && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 6, marginBottom: 10 }}>
                      Hiển thị 3 / {pendingMainStores.length} cửa hàng chưa đi
                    </Text>
                  )}
                </>
              )
              : <Text style={styles.emptyText}>{mainStores.length > 0 ? 'Đã hoàn thành tuyến chính!' : 'Chưa có shop địa bàn.'}</Text>
            }
            
            {pendingRescueStores.length > 0 && (
              <>
                <View style={styles.rescueDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.rescueDividerLabel}>Hỗ trợ hôm nay</Text>
                  <View style={styles.dividerLine} />
                </View>
                {pendingRescueStores.map(s => <StoreCard key={`res-${s.id}`} item={s} />)}
              </>
            )}

            {visitedStores.length > 0 && (
              <>
                <View style={styles.rescueDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.rescueDividerLabel, { color: '#16a34a' }]}>Shop đã hoàn thành</Text>
                  <View style={styles.dividerLine} />
                </View>
                {visitedStores.map(s => <StoreCard key={`visited-${s.id}`} item={s} />)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const NAVY = '#1a3a6b';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 42, height: 42, borderRadius: 10, backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(26,58,107,0.25)' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  statusDot: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#f8fafc' },
  leaveBtnText: { fontSize: 11, fontWeight: '500', color: '#475569' },
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
  sectionLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7, color: '#94a3b8', marginHorizontal: 14, marginTop: 6, marginBottom: 8 },
  ctaBtn: { marginHorizontal: 14, marginBottom: 10, height: 48, backgroundColor: NAVY, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  ctaArrow: { width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  storeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, marginHorizontal: 14, marginBottom: 8 },
  storeCardDone: { opacity: 0.55 },
  storeIconBox: { width: 38, height: 38, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
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
  rescueDivider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 16, marginBottom: 10, gap: 10 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.1)' },
  rescueDividerLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, color: '#b45309' },
  leaveCard: { margin: 14, backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  leaveTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  leaveSub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  

});
