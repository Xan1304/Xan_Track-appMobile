import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, TouchableOpacity, Modal, Dimensions, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');
const NAVY = '#1a3a6b';

const ACTIVITY_TYPES = [
  { label: 'Tất cả', value: 'all', icon: 'layers-outline' },
  { label: 'Vào tiệm', value: 'checkin', icon: 'login' },
  { label: 'Trưng bày', value: 'trung_bay', icon: 'camera-outline' },
  { label: 'Đơn hàng', value: 'bien_ban', icon: 'file-document-outline' },
  { label: 'Kết thúc', value: 'checkout', icon: 'logout' },
];

const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const formatTimeShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function CheckinHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterMonths, setFilterMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('all');
  const [showStaffFilter, setShowStaffFilter] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ label: `Tháng ${d.getMonth() + 1}`, month: d.getMonth(), year: d.getFullYear() });
    }
    setFilterMonths(months);
    setSelectedMonth(months[0]);
    fetchStaffList();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedMonth) fetchHistory();
    }, [selectedMonth, selectedStaff, selectedType])
  );

  async function fetchStaffList() {
    const { data } = await supabase.from('ho_so_nhan_vien').select('email, ho_ten').eq('chuc_vu', 'Sale');
    if (data) setStaffs(data);
  }

  async function fetchHistory() {
    try {
      setLoading(true);
      const startOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0);
      const endOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59);

      let query = supabase
        .from('lich_su_checkin')
        .select('*, danh_sach_cua_hang(ten_cua_hang, dia_chi), ho_so_nhan_vien(ho_ten)')
        .gte('thoi_gian', startOfMonth.toISOString())
        .lte('thoi_gian', endOfMonth.toISOString())
        .order('thoi_gian', { ascending: false });

      if (selectedStaff) query = query.eq('nhan_vien_email', selectedStaff);
      if (selectedType !== 'all') query = query.eq('loai_hinh', selectedType);

      const { data, error } = await query;
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Lỗi:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'checkin': return { label: 'VÀO TIỆM', color: '#16a34a', iconBg: '#f0fdf4', icon: 'login' };
      case 'trung_bay': return { label: 'TRƯNG BÀY', color: NAVY, iconBg: '#f0f4ff', icon: 'camera' };
      case 'bien_ban': return { label: 'ĐƠN HÀNG', color: '#b45309', iconBg: '#fffbeb', icon: 'file-document' };
      case 'checkout': return { label: 'KẾT THÚC', color: '#dc2626', iconBg: '#fef2f2', icon: 'logout' };
      default: return { label: 'HOẠT ĐỘNG', color: '#475569', iconBg: '#f8fafc', icon: 'dots-horizontal' };
    }
  };

  const selectedStaffName = staffs.find(s => s.email === selectedStaff)?.ho_ten;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giám sát XANTrack</Text>
        <TouchableOpacity
          style={[styles.staffFilterBtn, selectedStaff && styles.staffFilterActive]}
          onPress={() => setShowStaffFilter(true)}
        >
          <Ionicons name="person-outline" size={16} color={selectedStaff ? '#fff' : '#475569'} />
          {selectedStaff && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {selectedStaff && (
        <View style={styles.activeFilterBar}>
          <Ionicons name="person" size={12} color={NAVY} />
          <Text style={styles.activeFilterText}>Đang lọc: {selectedStaffName}</Text>
          <TouchableOpacity onPress={() => setSelectedStaff(null)}>
            <Ionicons name="close-circle" size={16} color={NAVY} />
          </TouchableOpacity>
        </View>
      )}

      {/* Month filter */}
      <View style={styles.filterBar}>
        {filterMonths.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.filterTab, selectedMonth?.month === item.month && styles.filterActive]}
            onPress={() => setSelectedMonth(item)}
          >
            <Text style={[styles.filterTabText, selectedMonth?.month === item.month && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type filter */}
      <View style={styles.typeFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeFilterContent}>
          {ACTIVITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeTab, selectedType === type.value && styles.typeTabActive]}
              onPress={() => setSelectedType(type.value)}
            >
              <MaterialCommunityIcons
                name={type.icon as any}
                size={14}
                color={selectedType === type.value ? '#fff' : '#64748b'}
              />
              <Text style={[styles.typeTabText, selectedType === type.value && styles.typeTabTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchHistory(); }}
              tintColor={NAVY}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu phù hợp.</Text>}
          renderItem={({ item }) => {
            const type = getTypeInfo(item.loai_hinh);
            const isDistOk = item.khoang_cach <= 50;
            return (
              <View style={styles.timelineItem}>
                {/* Time column */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeValue}>{formatTimeShort(item.thoi_gian)}</Text>
                  <Text style={styles.dateValue}>{formatDateFull(item.thoi_gian)}</Text>
                </View>

                {/* Line column */}
                <View style={styles.lineColumn}>
                  <View style={[styles.dot, { backgroundColor: type.color }]} />
                  <View style={styles.line} />
                </View>

                {/* Card */}
                <View style={styles.mainCard}>
                  <View style={styles.cardTop}>
                    <View style={[styles.typeBadge, { backgroundColor: type.iconBg }]}>
                      <MaterialCommunityIcons name={type.icon as any} size={11} color={type.color} />
                      <Text style={[styles.typeText, { color: type.color }]}>{type.label}</Text>
                    </View>
                    <View style={[styles.distBadge, { backgroundColor: isDistOk ? '#f0fdf4' : '#fef2f2' }]}>
                      <Text style={[styles.distText, { color: isDistOk ? '#16a34a' : '#dc2626' }]}>
                        {item.khoang_cach}m
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName} numberOfLines={1}>
                        {item.danh_sach_cua_hang?.ten_cua_hang || 'Cửa hàng lẻ'}
                      </Text>
                      <Text style={styles.staffNameSmall}>
                        Sale: {item.ho_so_nhan_vien?.ho_ten || item.nhan_vien_email.split('@')[0]}
                      </Text>
                      <View style={styles.locRow}>
                        <Ionicons name="location-outline" size={11} color="#94a3b8" />
                        <Text style={styles.addrText} numberOfLines={1}>
                          {item.danh_sach_cua_hang?.dia_chi}
                        </Text>
                      </View>
                    </View>
                    {item.image_url && (
                      <TouchableOpacity onPress={() => setSelectedImage(item.image_url)} style={styles.thumbWrap}>
                        <Image source={{ uri: item.image_url }} style={styles.thumb} />
                        <View style={styles.zoomOverlay}>
                          <Ionicons name="expand" size={12} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Staff filter modal */}
      <Modal visible={showStaffFilter} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn nhân viên</Text>
            <ScrollView style={{ maxHeight: height * 0.45 }}>
              {staffs.map((s) => (
                <TouchableOpacity
                  key={s.email}
                  style={styles.filterItem}
                  onPress={() => { setSelectedStaff(s.email); setShowStaffFilter(false); }}
                >
                  <View style={styles.filterItemInner}>
                    <View style={styles.filterAvatar}>
                      <Text style={styles.filterAvatarText}>
                        {s.ho_ten?.split(' ').pop()?.[0] || '?'}
                      </Text>
                    </View>
                    <Text style={[styles.filterText, selectedStaff === s.email && styles.filterTextActive2]}>
                      {s.ho_ten}
                    </Text>
                  </View>
                  {selectedStaff === s.email && (
                    <Ionicons name="checkmark" size={18} color={NAVY} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.btnAll}
              onPress={() => { setSelectedStaff(null); setShowStaffFilter(false); }}
            >
              <Text style={styles.btnAllText}>Xem tất cả nhân viên</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.imgModalOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={42} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage || '' }} style={styles.fullImg} resizeMode="contain" />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  staffFilterBtn: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  staffFilterActive: { backgroundColor: NAVY },
  activeDot: {
    position: 'absolute', top: 5, right: 5,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#22c55e', borderWidth: 1, borderColor: '#fff',
  },

  activeFilterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0f4ff', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(26,58,107,0.1)',
  },
  activeFilterText: { flex: 1, fontSize: 12, color: NAVY, fontWeight: '500' },

  filterBar: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  filterActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterTabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  typeFilterBar: {
    backgroundColor: '#fff',
    paddingBottom: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  typeFilterContent: { paddingHorizontal: 14, gap: 8 },
  typeTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  typeTabActive: { backgroundColor: NAVY, borderColor: NAVY },
  typeTabText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  typeTabTextActive: { color: '#fff' },

  listContent: { paddingTop: 8, paddingBottom: 36 },

  timelineItem: { flexDirection: 'row', paddingLeft: 14 },
  timeColumn: { width: 68, alignItems: 'flex-end', paddingTop: 10, paddingRight: 4 },
  timeValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  dateValue: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  lineColumn: { width: 26, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 4.5, zIndex: 1, marginTop: 13 },
  line: { width: 1.5, flex: 1, backgroundColor: '#e2e8f0' },

  mainCard: {
    flex: 1,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 12, marginRight: 14, marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  typeText: { fontSize: 9, fontWeight: '700' },
  distBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  distText: { fontSize: 10, fontWeight: '600' },

  cardBody: { flexDirection: 'row', gap: 10 },
  storeName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  staffNameSmall: { fontSize: 11, color: NAVY, fontWeight: '500', marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  addrText: { fontSize: 10, color: '#94a3b8', flex: 1 },

  thumbWrap: { position: 'relative', flexShrink: 0 },
  thumb: { width: 54, height: 54, borderRadius: 8, backgroundColor: '#f8fafc' },
  zoomOverlay: {
    position: 'absolute', right: 3, bottom: 3,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 4, padding: 2,
  },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', width: '88%',
    borderRadius: 20, padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  filterItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterItemInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterAvatar: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center',
  },
  filterAvatarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterText: { fontSize: 14, color: '#334155' },
  filterTextActive2: { color: NAVY, fontWeight: '600' },
  btnAll: {
    marginTop: 14, padding: 14,
    backgroundColor: NAVY, borderRadius: 12, alignItems: 'center',
  },
  btnAllText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  imgModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 5 },
  fullImg: { width, height: height * 0.8 },

  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 60 },
});