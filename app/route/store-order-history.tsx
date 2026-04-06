import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';
const FILTERS = ['Ngày', 'Tuần', 'Tháng'];

export default function StoreOrderHistory() {
  const { id, name } = useLocalSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Ngày');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchOrders(); }, [filter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const dateLimit = new Date();
      if (filter === 'Ngày') {
        dateLimit.setHours(0, 0, 0, 0);
      } else if (filter === 'Tuần') {
        const day = dateLimit.getDay() || 7;
        dateLimit.setHours(-24 * (day - 1), 0, 0, 0);
      } else {
        dateLimit.setDate(1);
        dateLimit.setHours(0, 0, 0, 0);
      }

      const { data, error } = await supabase
        .from('don_hang_doanh_thu').select('*').eq('cua_hang_id', id)
        .gte('created_at', dateLimit.toISOString()).order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) { console.log(e.message); }
    finally { setLoading(false); }
  }

  async function showDetail(order: any) {
    setSelectedOrder(order);
    setModalVisible(true);
    const { data } = await supabase.from('chi_tiet_don_hang').select('*').eq('order_id', order.id);
    setOrderDetails(data || []);
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.tong_tien), 0);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Lịch sử đơn hàng</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f} này</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      {!loading && orders.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Số đơn</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Doanh thu</Text>
            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
              {totalRevenue >= 1_000_000
                ? (totalRevenue / 1_000_000).toFixed(1) + 'tr'
                : totalRevenue.toLocaleString() + 'đ'}
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không có đơn hàng trong {filter.toLowerCase()} này</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderCard} onPress={() => showDetail(item)} activeOpacity={0.75}>
              <View style={styles.orderIconBox}>
                <Ionicons name="receipt-outline" size={18} color={NAVY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderLabel}>Đơn hàng</Text>
                <Text style={styles.orderTime}>{formatTime(item.created_at)}</Text>
              </View>
              <Text style={styles.orderAmount}>{Number(item.tong_tien).toLocaleString()}đ</Text>
              <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDate}>{selectedOrder && formatTime(selectedOrder.created_at)}</Text>

            <View style={styles.tableHead}>
              <Text style={[styles.colLabel, { flex: 2, textAlign: 'left' }]}>Sản phẩm</Text>
              <Text style={styles.colLabel}>SL</Text>
              <Text style={[styles.colLabel, { textAlign: 'right' }]}>Tiền</Text>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {orderDetails.map((p, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <Text style={[styles.detailCell, { flex: 2, textAlign: 'left', color: '#0f172a' }]} numberOfLines={1}>
                    {p.ten_san_pham}
                  </Text>
                  <Text style={styles.detailCell}>×{p.so_luong}</Text>
                  <Text style={[styles.detailCell, { textAlign: 'right', fontWeight: '600', color: NAVY }]}>
                    {(p.so_luong * p.gia_ban).toLocaleString()}đ
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng đơn</Text>
              <Text style={styles.totalValue}>
                {selectedOrder ? Number(selectedOrder.tong_tien).toLocaleString() : 0}đ
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f6f8' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', gap: 12 },
  backBtn:          { width: 36, height: 36, justifyContent: 'center' },
  headerTitle:      { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  headerSub:        { fontSize: 11, color: '#64748b', marginTop: 1 },

  filterBar:        { flexDirection: 'row', justifyContent: 'center', gap: 10, padding: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  filterTab:        { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f5f6f8', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  filterTabActive:  { backgroundColor: NAVY, borderColor: NAVY },
  filterTabText:    { fontSize: 12, color: '#475569', fontWeight: '500' },
  filterTabTextActive: { color: '#fff' },

  summaryRow:       { flexDirection: 'row', gap: 10, padding: 14 },
  summaryCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14 },
  summaryLabel:     { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8', marginBottom: 4 },
  summaryValue:     { fontSize: 20, fontWeight: '700', color: '#0f172a' },

  listContent:      { padding: 14, paddingBottom: 40 },

  emptyBox:         { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText:        { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  orderCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, marginBottom: 8, gap: 12 },
  orderIconBox:     { width: 38, height: 38, borderRadius: 9, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center' },
  orderLabel:       { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  orderTime:        { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  orderAmount:      { fontSize: 14, fontWeight: '700', color: NAVY, marginRight: 4 },

  // Modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle:       { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  modalDate:        { fontSize: 12, color: '#94a3b8', marginBottom: 18 },
  tableHead:        { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', marginBottom: 4 },
  colLabel:         { flex: 1, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8', textAlign: 'center' },
  detailRow:        { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' },
  detailCell:       { flex: 1, fontSize: 13, color: '#475569', textAlign: 'center' },
  totalRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: 14, backgroundColor: '#e8eef8', borderRadius: 12 },
  totalLabel:       { fontSize: 13, fontWeight: '600', color: '#475569' },
  totalValue:       { fontSize: 18, fontWeight: '700', color: NAVY },
});