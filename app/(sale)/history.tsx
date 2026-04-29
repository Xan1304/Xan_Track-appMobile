import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/services/supabase';

const NAVY = '#1a3a6b';

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterMonths, setFilterMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push({ label: `Tháng ${d.getMonth() + 1}`, month: d.getMonth(), year: d.getFullYear() });
    }
    setFilterMonths(months);
    setSelectedMonth(months[0]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedMonth) fetchOrdersByMonth();
    }, [selectedMonth])
  );

  async function fetchOrdersByMonth() {
    try {
      setLoading(true);
      const startOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0);
      const endOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('don_hang_doanh_thu')
        .select(`id, tong_tien, created_at, nhan_vien_email, danh_sach_cua_hang(ten_cua_hang), ho_so_nhan_vien!nhan_vien_email(ho_ten)`)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      console.log('Lỗi:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function showDetail(order: any) {
    setSelectedOrder(order);
    setModalVisible(true);
    const { data } = await supabase.from('chi_tiet_don_hang').select('*').eq('order_id', order.id);
    setOrderDetails(data || []);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.tong_tien) || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
      </View>

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

      {/* Summary KPI */}
      {!loading && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{orders.length}</Text>
            <Text style={styles.summaryLabel}>đơn hàng</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
              {totalRevenue >= 1_000_000
                ? (totalRevenue / 1_000_000).toFixed(1) + 'tr'
                : totalRevenue.toLocaleString() + 'đ'}
            </Text>
            <Text style={styles.summaryLabel}>doanh thu</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrdersByMonth(); }}
              tintColor={NAVY}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Tháng này chưa có đơn hàng nào.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderCard} activeOpacity={0.7} onPress={() => showDetail(item)}>
              {/* Icon */}
              <View style={styles.orderIconBox}>
                <Ionicons name="receipt-outline" size={18} color={NAVY} />
              </View>

              {/* Info */}
              <View style={styles.orderMeta}>
                <Text style={styles.shopName} numberOfLines={1}>
                  {item.danh_sach_cua_hang?.ten_cua_hang || 'Cửa hàng lẻ'}
                </Text>
                <Text style={styles.staffName}>
                  Sale: {item.ho_so_nhan_vien?.ho_ten || 'N/A'}
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(item.created_at).toLocaleString('vi-VN')}
                </Text>
              </View>

              {/* Price */}
              <View style={styles.orderRight}>
                <Text style={styles.orderPrice}>
                  {Number(item.tong_tien) >= 1_000_000
                    ? (Number(item.tong_tien) / 1_000_000).toFixed(1) + 'tr'
                    : Number(item.tong_tien).toLocaleString() + 'đ'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#cbd5e1" style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal chi tiết */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalShop}>
                {selectedOrder?.danh_sach_cua_hang?.ten_cua_hang || 'Cửa hàng lẻ'}
              </Text>

              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, { flex: 3 }]}>Sản phẩm</Text>
                <Text style={[styles.tableCol, { textAlign: 'center' }]}>SL</Text>
                <Text style={[styles.tableCol, { textAlign: 'right', flex: 2 }]}>Thành tiền</Text>
              </View>

              {orderDetails.map((prod, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={[styles.itemText, { flex: 3 }]}>{prod.ten_san_pham}</Text>
                  <Text style={[styles.itemText, { textAlign: 'center' }]}>x{prod.so_luong}</Text>
                  <Text style={[styles.itemText, { flex: 2, textAlign: 'right', fontWeight: '600', color: '#0f172a' }]}>
                    {(prod.so_luong * prod.gia_ban).toLocaleString()}đ
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TỔNG ĐƠN</Text>
                <Text style={styles.totalValue}>
                  {Number(selectedOrder?.tong_tien).toLocaleString()}đ
                </Text>
              </View>
            </ScrollView>
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
    paddingHorizontal: 18, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },

  filterBar: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterTab: {
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  filterActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterTabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 24,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  summaryLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginTop: 1 },
  summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.08)' },

  listContent: { padding: 14, paddingBottom: 36 },

  orderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 8,
  },
  orderIconBox: {
    width: 38, height: 38, borderRadius: 9,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, flexShrink: 0,
    borderWidth: 0.5, borderColor: 'rgba(26,58,107,0.1)',
  },
  orderMeta: { flex: 1, minWidth: 0 },
  shopName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  staffName: { fontSize: 11, color: NAVY, fontWeight: '500', marginTop: 2 },
  orderDate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  orderRight: { alignItems: 'flex-end', marginLeft: 8 },
  orderPrice: { fontSize: 13, fontWeight: '600', color: '#16a34a' },

  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 60 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: '#e2e8f0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  modalShop: { fontSize: 13, color: '#64748b', marginBottom: 16 },

  tableHeader: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
    backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 4,
  },
  tableCol: { flex: 1, fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' },
  itemRow: {
    flexDirection: 'row', paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  itemText: { flex: 1, fontSize: 13, color: '#334155' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, padding: 14,
    backgroundColor: '#f0f4ff', borderRadius: 12,
  },
  totalLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  totalValue: { fontSize: 18, fontWeight: '600', color: NAVY },
});

