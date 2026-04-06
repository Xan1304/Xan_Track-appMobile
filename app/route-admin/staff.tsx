import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, ScrollView, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

interface TuyenData { ten_tuyen: string; }

const getInitials = (fullName: string) => {
  if (!fullName) return 'NV';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function StaffScreen() {
  const [staff, setStaff] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [requestData, setRequestData] = useState({ ho_ten: '', email: '', so_dien_thoai: '' });

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
      fetchRoutes();
    }, [])
  );

  async function fetchStaff() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ho_so_nhan_vien')
        .select('*, tuyen_ban_hang(ten_tuyen)')
        .eq('vai_tro', 'nhan_vien')
        .order('ho_ten', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(item => {
        const tuyen = item.tuyen_ban_hang as unknown as TuyenData | TuyenData[];
        return {
          ...item,
          ten_tuyen_display: Array.isArray(tuyen)
            ? tuyen[0]?.ten_tuyen
            : tuyen?.ten_tuyen || 'Chưa gán địa bàn'
        };
      });

      setStaff(formattedData || []);
    } catch (e: any) {
      console.log('Lỗi tải nhân viên:', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoutes() {
    const { data } = await supabase.from('tuyen_ban_hang').select('*').order('ten_tuyen', { ascending: true });
    if (data) setRoutes(data);
  }

  async function handleAssignRoute(routeId: string) {
    try {
      const { error } = await supabase
        .from('ho_so_nhan_vien').update({ tuyen_id: routeId }).eq('id', selectedStaff.id);
      if (error) throw error;
      setRouteModalVisible(false);
      setDetailModalVisible(false);
      fetchStaff();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  }

  async function handleDeleteStaff(id: string, tuyenId: string | null) {
    Alert.alert(
      'Xác nhận thôi việc',
      `Cho nhân viên ${selectedStaff?.ho_ten} nghỉ việc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (tuyenId) {
                await supabase.from('danh_sach_cua_hang').update({ tuyen_id: null }).eq('tuyen_id', tuyenId);
              }
              const { error: hardDeleteError } = await supabase.from('ho_so_nhan_vien').delete().eq('id', id);
              if (hardDeleteError) {
                const { error: softDeleteError } = await supabase
                  .from('ho_so_nhan_vien').update({ vai_tro: 'thoi_viec' }).eq('id', id);
                if (softDeleteError) throw softDeleteError;
              }
              setStaff(prev => prev.filter(item => item.id !== id));
              setDetailModalVisible(false);
            } catch (e: any) {
              Alert.alert('Lỗi', 'Không thể xử lý. Vui lòng thử lại.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  const sendEmailRequest = () => {
    if (!requestData.ho_ten || !requestData.email) return Alert.alert('Thiếu thông tin', 'Nhập đủ họ tên và email.');
    const adminEmail = 'admin@xantrack.com';
    const subject = encodeURIComponent('Yêu cầu tạo nhân viên mới - XAN Milk');
    const body = encodeURIComponent(`Yêu cầu tạo mới:\n- Họ tên: ${requestData.ho_ten}\n- Email: ${requestData.email}\n- SĐT: ${requestData.so_dien_thoai}`);
    Linking.openURL(`mailto:${adminEmail}?subject=${subject}&body=${body}`)
      .catch(() => Alert.alert('Lỗi', 'Không thể mở ứng dụng Email.'));
    setRequestModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đội ngũ XAN Milk</Text>
          {!loading && <Text style={styles.headerSub}>{staff.length} nhân viên</Text>}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => setRequestModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && staff.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="account-group-outline" size={36} color={NAVY} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có nhân viên</Text>
              <Text style={styles.emptyText}>Nhấn nút + để thêm nhân viên mới vào đội.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.staffCard}
              activeOpacity={0.7}
              onPress={() => { setSelectedStaff(item); setDetailModalVisible(true); }}
            >
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>{getInitials(item.ho_ten)}</Text>
              </View>
              <View style={styles.staffMeta}>
                <Text style={styles.staffName}>{item.ho_ten}</Text>
                <View style={styles.staffRouteRow}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={11} color={NAVY} />
                  <Text style={styles.staffRouteName}>{item.ten_tuyen_display}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModalVisible(false)}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>

            <View style={styles.detailAvatar}>
              <Text style={styles.detailAvatarText}>{getInitials(selectedStaff?.ho_ten)}</Text>
            </View>
            <Text style={styles.detailName}>{selectedStaff?.ho_ten}</Text>
            <Text style={styles.detailEmail}>{selectedStaff?.email}</Text>

            <View style={styles.detailInfoBox}>
              <View style={styles.detailInfoRow}>
                <MaterialCommunityIcons name="map-marker-path" size={16} color={NAVY} />
                <Text style={styles.detailInfoText}>
                  Tuyến: <Text style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStaff?.ten_tuyen_display}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.btnAssign}
                activeOpacity={0.8}
                onPress={() => setRouteModalVisible(true)}
              >
                <Ionicons name="swap-horizontal" size={16} color="#fff" />
                <Text style={styles.btnAssignText}>Điều phối địa bàn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDelete}
                activeOpacity={0.8}
                onPress={() => handleDeleteStaff(selectedStaff.id, selectedStaff.tuyen_id)}
              >
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                <Text style={styles.btnDeleteText}>Cho thôi việc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Route picker modal */}
      <Modal visible={routeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.routePickerCard}>
            <Text style={styles.modalTitle}>Chọn tuyến mới</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {routes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.routeItem}
                  onPress={() => handleAssignRoute(r.id)}
                >
                  <View style={styles.routeItemIcon}>
                    <MaterialCommunityIcons name="map-marker-path" size={16} color={NAVY} />
                  </View>
                  <Text style={styles.routeItemText}>{r.ten_tuyen}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.btnCancelFull}
              onPress={() => setRouteModalVisible(false)}
            >
              <Text style={styles.btnCancelFullText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add staff modal */}
      <Modal visible={requestModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.addStaffCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Thêm nhân viên mới</Text>
            <Text style={styles.modalSub}>Yêu cầu sẽ được gửi qua email</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor="#94a3b8"
                value={requestData.ho_ten}
                onChangeText={t => setRequestData({ ...requestData, ho_ten: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email đăng nhập"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={requestData.email}
                onChangeText={t => setRequestData({ ...requestData, email: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={requestData.so_dien_thoai}
                onChangeText={t => setRequestData({ ...requestData, so_dien_thoai: t })}
              />
            </View>

            <View style={styles.addStaffActions}>
              <TouchableOpacity
                style={styles.btnCancelSmall}
                onPress={() => setRequestModalVisible(false)}
              >
                <Text style={styles.btnCancelSmallText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSend} activeOpacity={0.8} onPress={sendEmailRequest}>
                <Ionicons name="send" size={14} color="#fff" />
                <Text style={styles.btnSendText}>Gửi yêu cầu</Text>
              </TouchableOpacity>
            </View>
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  headerSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center',
  },

  listContent: { padding: 14, paddingBottom: 36 },

  staffCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 8,
  },
  staffAvatar: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  staffAvatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  staffMeta: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  staffRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  staffRouteName: { fontSize: 11, color: NAVY, fontWeight: '500' },

  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },

  // Detail card
  detailCard: {
    backgroundColor: '#fff', width: '88%',
    borderRadius: 20, padding: 22, alignItems: 'center',
  },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 10 },
  detailAvatar: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  detailAvatarText: { color: '#fff', fontSize: 26, fontWeight: '600' },
  detailName: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  detailEmail: { fontSize: 12, color: '#94a3b8', marginBottom: 18 },
  detailInfoBox: {
    width: '100%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 20,
  },
  detailInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailInfoText: { fontSize: 13, color: '#64748b' },
  detailActions: { width: '100%', gap: 10 },
  btnAssign: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 12, backgroundColor: NAVY,
  },
  btnAssignText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnDelete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
  },
  btnDeleteText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },

  // Route picker
  routePickerCard: {
    backgroundColor: '#fff', width: '88%', borderRadius: 20, padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4, textAlign: 'center' },
  modalSub: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 18 },
  routeItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  routeItemIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center',
  },
  routeItemText: { flex: 1, fontSize: 14, color: '#334155' },
  btnCancelFull: {
    marginTop: 16, padding: 14, alignItems: 'center',
    borderRadius: 12, backgroundColor: '#f1f5f9',
  },
  btnCancelFullText: { color: '#64748b', fontWeight: '600', fontSize: 13 },

  // Add staff card
  addStaffCard: {
    backgroundColor: '#fff', width: '92%', borderRadius: 20, padding: 24,
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: '#e2e8f0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  inputGroup: { gap: 10, marginBottom: 20 },
  input: {
    height: 48, backgroundColor: '#f8fafc',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#0f172a',
  },
  addStaffActions: { flexDirection: 'row', gap: 10 },
  btnCancelSmall: {
    flex: 1, height: 46, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, backgroundColor: '#f1f5f9',
  },
  btnCancelSmallText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  btnSend: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 46, borderRadius: 10, backgroundColor: NAVY,
  },
  btnSendText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});