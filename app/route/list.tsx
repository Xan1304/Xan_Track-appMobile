import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

interface RouteInfo { ten_tuyen: string; }
interface StaffProfile { tuyen_id: string | null; tuyen_ban_hang: RouteInfo | RouteInfo[] | null; }

const formatDist = (m: number) => {
  if (!m) return '0m';
  return m >= 1000 ? (m / 1000).toFixed(1) + 'km' : Math.round(m) + 'm';
};

export default function RouteList() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useFocusEffect(useCallback(() => { loadStoresData(); }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStoresData().then(() => setRefreshing(false));
  }, []);

  async function loadStoresData() {
    try {
      if (!refreshing) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const { data: profileRaw } = await supabase
        .from('ho_so_nhan_vien')
        .select('tuyen_id, tuyen_ban_hang(ten_tuyen)')
        .eq('email', user.email).single();
      const profile = profileRaw as unknown as StaffProfile;

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const { data: checkouts } = await supabase.from('lich_su_checkin')
        .select('cua_hang_id').eq('nhan_vien_email', user.email)
        .eq('loai_hinh', 'checkout').gte('thoi_gian', startOfToday.toISOString());
      const finishedIds = checkouts?.map(c => c.cua_hang_id) || [];

      let { status } = await Location.requestForegroundPermissionsAsync();
      let currentLoc = status === 'granted' ? await Location.getCurrentPositionAsync({}) : null;

      const processStore = (s: any, isRescue: boolean) => ({
        ...s,
        distance: currentLoc
          ? calculateDistance(currentLoc.coords.latitude, currentLoc.coords.longitude, s.lat, s.lng)
          : 0,
        isDone: finishedIds.includes(s.id),
        isRescue,
      });

      let mainData: any[] = [];
      if (profile?.tuyen_id) {
        const { data } = await supabase.from('danh_sach_cua_hang').select('*').eq('tuyen_id', profile.tuyen_id);
        if (data) mainData = data.map(s => processStore(s, false)).sort((a, b) => a.distance - b.distance);
      }

      const { data: tempJobs } = await supabase.from('dieu_phoi_tam_thoi')
        .select('cua_hang_id, danh_sach_cua_hang(*)').eq('nhan_vien_email', user.email).eq('ngay_dieu_dong', todayStr);

      const rawRescue = tempJobs?.map(j => processStore(j.danh_sach_cua_hang, true)).filter(s => s) || [];
      const rescueData = rawRescue
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        .sort((a, b) => a.distance - b.distance);

      const newSections = [{ title: 'Địa bàn cố định', data: mainData, isRescue: false }];
      if (rescueData.length > 0) {
        newSections.push({ title: 'Tuyến hỗ trợ hôm nay', data: rescueData, isRescue: true });
      }
      setSections(newSections);
    } catch (e) { console.error('Lỗi tải lộ trình:', e); }
    finally { setLoading(false); }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredSections = useMemo(() => {
    return sections
      .map(section => ({
        ...section,
        data: section.data.filter((s: any) =>
          s.ten_cua_hang.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.dia_chi.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(s => s.data.length > 0);
  }, [searchQuery, sections]);

  const doneCount = sections.flatMap(s => s.data).filter(s => s.isDone).length;
  const totalCount = sections.flatMap(s => s.data).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lộ trình đi tuyến</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{doneCount}/{totalCount}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm shop hoặc địa chỉ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SectionList
        sections={filteredSections}
        keyExtractor={(item, idx) => `${item.id}-${item.isRescue ? 'r' : 'm'}-${idx}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section: { title, isRescue, data } }) => (
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionHeaderLeft, isRescue && styles.sectionHeaderRescue]}>
              <MaterialCommunityIcons
                name={isRescue ? 'flash' : 'map-marker-radius-outline'}
                size={14}
                color={isRescue ? '#b45309' : '#64748b'}
              />
              <Text style={[styles.sectionTitle, isRescue && styles.sectionTitleRescue]}>
                {title}
              </Text>
            </View>
            <Text style={styles.sectionCount}>{data.length} shop</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.card, item.isDone && styles.cardDone]}
            onPress={() =>
              router.push({
                pathname: '/route/checkin',
                params: { id: item.id, name: item.ten_cua_hang, addr: item.dia_chi, dist: Math.round(item.distance) },
              } as any)
            }
          >
            {/* Icon */}
            <View style={[
              styles.cardIconBox,
              item.isDone && styles.cardIconBoxDone,
              item.isRescue && !item.isDone && styles.cardIconBoxRescue,
            ]}>
              {item.isDone ? (
                <Ionicons name="checkmark" size={18} color="#16a34a" />
              ) : item.isRescue ? (
                <MaterialCommunityIcons name="flash" size={18} color="#b45309" />
              ) : (
                <MaterialCommunityIcons name="storefront-outline" size={18} color={NAVY} />
              )}
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.cardName, item.isDone && styles.cardNameDone]}
                numberOfLines={1}
              >
                {item.ten_cua_hang}
              </Text>
              <Text style={styles.cardAddr} numberOfLines={1}>{item.dia_chi}</Text>
            </View>

            {/* Distance */}
            <View style={styles.cardRight}>
              {item.isDone ? (
                <Text style={styles.distDone}>Hoàn thành</Text>
              ) : (
                <Text style={[styles.dist, item.isRescue && styles.distRescue]}>
                  {formatDist(item.distance)}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={14} color="#cbd5e1" style={{ marginTop: 2 }} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f5f6f8' },
  center:               { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f8' },

  // Header
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  backBtn:              { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:          { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  progressPill:         { backgroundColor: '#e8eef8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  progressPillText:     { fontSize: 12, fontWeight: '600', color: NAVY },

  // Search
  searchSection:        { backgroundColor: '#fff', padding: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  searchBar:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f6f8', paddingHorizontal: 12, height: 42, borderRadius: 11, gap: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  searchInput:          { flex: 1, fontSize: 13, color: '#0f172a' },

  listContent:          { padding: 16, paddingBottom: 40 },

  // Section header
  sectionHeaderRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  sectionHeaderLeft:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeaderRescue:  { backgroundColor: '#fffbeb', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 0.5, borderColor: '#fde68a' },
  sectionTitle:         { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b' },
  sectionTitleRescue:   { color: '#b45309' },
  sectionCount:         { fontSize: 11, color: '#94a3b8' },

  // Card
  card:                 { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, marginBottom: 8, gap: 12 },
  cardDone:             { opacity: 0.55 },
  cardIconBox:          { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardIconBoxDone:      { backgroundColor: '#f0fdf4' },
  cardIconBoxRescue:    { backgroundColor: '#fffbeb' },
  cardName:             { fontSize: 13, fontWeight: '500', color: '#0f172a', marginBottom: 2 },
  cardNameDone:         { textDecorationLine: 'line-through', color: '#94a3b8' },
  cardAddr:             { fontSize: 11, color: '#64748b' },
  cardRight:            { alignItems: 'flex-end', flexShrink: 0 },
  dist:                 { fontSize: 12, fontWeight: '600', color: NAVY },
  distRescue:           { color: '#b45309' },
  distDone:             { fontSize: 11, fontWeight: '500', color: '#16a34a' },
});