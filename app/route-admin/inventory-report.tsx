import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Modal, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { height } = Dimensions.get('window');
const NAVY = '#1a3a6b';

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1]?.[0]?.toUpperCase() || '?';
};

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const date = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${date}/${month}/${year} · ${hours}:${minutes}`;
};

export default function AdminInventoryReport() {
  const [history, setHistory] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMonths, setFilterMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [detailModal, setDetailModal] = useState({ visible: false, shopName: '', items: [] as any[] });
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
      if (selectedMonth) fetchInventoryHistory();
    }, [selectedMonth, selectedStaff])
  );

  async function fetchStaffList() {
    const { data } = await supabase.from('ho_so_nhan_vien').select('email, ho_ten').eq('chuc_vu', 'Sale');
    if (data) setStaffs(data);
  }

  async function fetchInventoryHistory() {
    try {
      setLoading(true);
      const startOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0);
      const endOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59);

      let query = supabase
        .from('lich_su_kiem_ton')
        .select(`*, danh_sach_cua_hang!cua_hang_id(ten_cua_hang, dia_chi), ho_so_nhan_vien(ho_ten)`)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (selectedStaff) query = query.eq('nhan_vien_email', selectedStaff);

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data.reduce((acc: any[], curr) => {
        const timeKey = new Date(curr.created_at).toISOString().slice(0, 16);
        const sessionKey = `${curr.cua_hang_id}-${curr.nhan_vien_email}-${timeKey}`;
        const existing = acc.find(item => item.sessionKey === sessionKey);
        if (existing) {
          existing.products.push(curr);
        } else {
          acc.push({
            sessionKey,
            shopName: curr.danh_sach_cua_hang?.ten_cua_hang,
            shopAddr: curr.danh_sach_cua_hang?.dia_chi,
            staffName: curr.ho_so_nhan_vien?.ho_ten,
            time: curr.created_at,
            products: [curr]
          });
        }
        return acc;
      }, []);

      setHistory(grouped);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedStaffName = staffs.find(s => s.email === selectedStaff)?.ho_ten;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giám sát tồn kho</Text>
        <TouchableOpacity
          style={[styles.staffFilterBtn, selectedStaff && styles.staffFilterActive]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="person-outline" size={16} color={selectedStaff ? '#fff' : '#475569'} />
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

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.sessionKey}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Tháng này chưa có báo cáo tồn kho.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              activeOpacity={0.7}
              onPress={() => setDetailModal({ visible: true, shopName: item.shopName, items: item.products })}
            >
              {/* Staff row */}
              <View style={styles.staffRow}>
                <View style={styles.staffAvatarBox}>
                  <Text style={styles.staffAvatarText}>{getInitials(item.staffName)}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{item.staffName}</Text>
                  <Text style={styles.timeText}>{formatDateTime(item.time)}</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{item.products.length} món</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Shop row */}
              <View style={styles.shopRow}>
                <View style={styles.shopIconBox}>
                  <MaterialCommunityIcons name="storefront-outline" size={16} color={NAVY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
                  <Text style={styles.shopAddr} numberOfLines={1}>{item.shopAddr}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail modal */}
      <Modal visible={detailModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{detailModal.shopName}</Text>
                <Text style={styles.modalSub}>Báo cáo tồn kho</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModal({ ...detailModal, visible: false })}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 3 }]}>Sản phẩm</Text>
              <Text style={[styles.tableCol, { textAlign: 'right' }]}>Tồn kho</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {detailModal.items.map((prod: any, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.rowText, { flex: 3 }]}>{prod.ten_san_pham}</Text>
                  <Text style={[styles.rowTextBold, { textAlign: 'right' }]}>{prod.ton_kho_thuc_te}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Staff filter modal */}
      <Modal visible={showFilter} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.filterModal}>
            <Text style={styles.modalTitle}>Chọn nhân viên</Text>
            <ScrollView style={{ maxHeight: height * 0.4 }}>
              {staffs.map((s) => (
                <TouchableOpacity
                  key={s.email}
                  style={styles.filterItem}
                  onPress={() => { setSelectedStaff(s.email); setShowFilter(false); }}
                >
                  <View style={styles.filterItemInner}>
                    <View style={styles.filterAvatar}>
                      <Text style={styles.filterAvatarText}>{getInitials(s.ho_ten)}</Text>
                    </View>
                    <Text style={[styles.filterText, selectedStaff === s.email && styles.filterTextActive2]}>
                      {s.ho_ten}
                    </Text>
                  </View>
                  {selectedStaff === s.email && <Ionicons name="checkmark" size={18} color={NAVY} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.btnAll}
              onPress={() => { setSelectedStaff(null); setShowFilter(false); }}
            >
              <Text style={styles.btnAllText}>Xem tất cả nhân viên</Text>
            </TouchableOpacity>
          </View>
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
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  filterActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterTabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  listContent: { padding: 14, paddingBottom: 36 },

  sessionCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 10,
  },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  staffAvatarBox: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center',
  },
  staffAvatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  timeText: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  countBadge: {
    backgroundColor: '#f0f4ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 0.5, borderColor: 'rgba(26,58,107,0.12)',
  },
  countBadgeText: { fontSize: 11, color: NAVY, fontWeight: '600' },

  cardDivider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 12 },

  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center',
  },
  shopName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  shopAddr: { fontSize: 10, color: '#94a3b8', marginTop: 1 },

  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 60 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: '#e2e8f0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  modalSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  tableHeader: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
    backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 4,
  },
  tableCol: { flex: 1, fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowText: { flex: 1, fontSize: 13, color: '#334155' },
  rowTextBold: { flex: 1, fontSize: 13, fontWeight: '600', color: NAVY },

  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  filterModal: { backgroundColor: '#fff', width: '88%', borderRadius: 20, padding: 20 },
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
  btnAll: { marginTop: 14, padding: 14, backgroundColor: NAVY, borderRadius: 12, alignItems: 'center' },
  btnAllText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});