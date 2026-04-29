import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, ScrollView, Alert
} from 'react-native';
import { supabase } from '../../../src/services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStaff } from '../../../src/hooks/useStaff';
import { StaffCard, getInitials } from '../../../src/components/manage/StaffCard';

const NAVY = '#1a3a6b';

export default function StaffScreen() {
  const router = useRouter();
  const [kpiTarget, setKpiTarget] = React.useState<string>('');
  const [isSavingKpi, setIsSavingKpi] = React.useState(false);

  const {
    staff,
    routes,
    loading,
    requestModalVisible,
    setRequestModalVisible,
    detailModalVisible,
    setDetailModalVisible,
    routeModalVisible,
    setRouteModalVisible,
    selectedStaff,
    setSelectedStaff,
    requestData,
    setRequestData,
    handleAssignRoute,
    handleDeleteStaff,
    sendEmailRequest
  } = useStaff();

  React.useEffect(() => {
    if (selectedStaff && detailModalVisible) {
      const now = new Date();
      supabase.from('kpi_muc_tieu')
        .select('muc_tieu_doanh_thu')
        .eq('nhan_vien_email', selectedStaff.email)
        .eq('thang', now.getMonth() + 1)
        .eq('nam', now.getFullYear())
        .maybeSingle()
        .then(({ data }) => {
          setKpiTarget(data?.muc_tieu_doanh_thu ? data.muc_tieu_doanh_thu.toString() : '');
        });
    } else {
      setKpiTarget('');
    }
  }, [selectedStaff, detailModalVisible]);

  const handleSaveKpi = async () => {
    if (!selectedStaff) return;
    try {
      setIsSavingKpi(true);
      const now = new Date();
      const numTarget = parseInt(kpiTarget.replace(/\D/g, ''), 10) || 0;
      
      const { error } = await supabase.from('kpi_muc_tieu').upsert({
        nhan_vien_email: selectedStaff.email,
        thang: now.getMonth() + 1,
        nam: now.getFullYear(),
        muc_tieu_doanh_thu: numTarget
      }, { onConflict: 'nhan_vien_email,thang,nam' });

      if (error) throw error;
      Alert.alert('Thành công', 'Đã lưu mục tiêu tháng.');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingKpi(false);
    }
  };

  const formatCurrencyInput = (text: string) => {
    const num = parseInt(text.replace(/\D/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('vi-VN');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(manage)')} style={styles.headerBack}>
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
            <StaffCard 
              item={item} 
              onPress={() => { setSelectedStaff(item); setDetailModalVisible(true); }} 
            />
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
            <Text style={styles.detailEmail}>{selectedStaff?.email} </Text>

            <View style={styles.detailInfoBox}>
              <View style={styles.detailInfoRow}>
                <MaterialCommunityIcons name="map-marker-path" size={16} color={NAVY} />
                <Text style={styles.detailInfoText}>
                  Tuyến: <Text style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStaff?.ten_tuyen_display} </Text>
                </Text>
              </View>
            </View>

            <View style={[styles.detailInfoBox, { marginTop: -8 }]}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 8 }}>
                Mục tiêu doanh thu tháng {new Date().getMonth() + 1}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, height: 42 }]}
                  placeholder="VD: 50.000.000"
                  keyboardType="numeric"
                  value={kpiTarget ? formatCurrencyInput(kpiTarget) : ''}
                  onChangeText={(t) => setKpiTarget(t.replace(/\D/g, ''))}
                />
                <TouchableOpacity
                  style={[styles.btnAssign, { width: 42, height: 42, borderRadius: 10 }]}
                  onPress={handleSaveKpi}
                >
                  {isSavingKpi ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.btnAssign}
                activeOpacity={0.8}
                onPress={() => setRouteModalVisible(true)}
              >
                <Ionicons name="swap-horizontal" size={16} color="#fff" />
                <Text style={styles.btnAssignText}>Điều phối tuyến làm việc </Text>
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
