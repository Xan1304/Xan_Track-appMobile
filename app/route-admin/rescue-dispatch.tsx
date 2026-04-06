import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, FlatList, RefreshControl, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Picker } from '@react-native-picker/picker';

const NAVY = '#1a3a6b';

export default function RescueDispatch() {
  const [absentStaffShops, setAbsentStaffShops] = useState<any[]>([]);
  const [activeStaffs, setActiveStaffs] = useState<any[]>([]);
  const [selectedRescuer, setSelectedRescuer] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => { fetchRescueData(); }, [])
  );

  async function fetchRescueData() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: leaves } = await supabase
        .from('don_nghi_phep')
        .select('nhan_vien_email')
        .eq('trang_thai', 'da_duyet')
        .lte('ngay_bat_dau', today)
        .gte('ngay_ket_thuc', today);

      const absentEmails = leaves?.map(l => l.nhan_vien_email) || [];

      const { data: alreadyAssigned } = await supabase
        .from('dieu_phoi_tam_thoi')
        .select('cua_hang_id')
        .eq('ngay_dieu_dong', today);

      const assignedIds = alreadyAssigned?.map(a => a.cua_hang_id) || [];

      if (absentEmails.length > 0) {
        const { data: profiles } = await supabase
          .from('ho_so_nhan_vien').select('tuyen_id').in('email', absentEmails);

        const absentTuyenIds = profiles?.map(p => p.tuyen_id).filter(id => id) || [];

        const { data: shops } = await supabase
          .from('danh_sach_cua_hang').select('*')
          .in('tuyen_id', absentTuyenIds)
          .not('id', 'in', `(${assignedIds.length > 0 ? assignedIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

        setAbsentStaffShops(shops || []);
      } else {
        setAbsentStaffShops([]);
      }

      const { data: actives } = await supabase
        .from('ho_so_nhan_vien').select('email, ho_ten').eq('vai_tro', 'nhan_vien')
        .not('email', 'in', `(${absentEmails.length > 0 ? absentEmails.join(',') : '""'})`)
        .order('ho_ten', { ascending: true });

      setActiveStaffs(actives || []);
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu điều phối');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(storeId: string, storeName: string) {
    if (!selectedRescuer) return Alert.alert('Chưa chọn', 'Vui lòng chọn nhân viên hỗ trợ trước!');

    const today = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase.from('dieu_phoi_tam_thoi').insert([{
        cua_hang_id: storeId,
        nhan_vien_email: selectedRescuer,
        ngay_dieu_dong: today
      }]);
      if (error) throw error;
      setAbsentStaffShops(prev => prev.filter(s => s.id !== storeId));
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  }

  const selectedRescuerName = activeStaffs.find(s => s.email === selectedRescuer)?.ho_ten;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều phối khẩn cấp</Text>
        <TouchableOpacity onPress={fetchRescueData} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Rescuer selector */}
        <View style={styles.pickerSection}>
          <Text style={styles.sectionLabel}>Chọn nhân viên hỗ trợ</Text>

          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedRescuer}
              onValueChange={(v) => setSelectedRescuer(v)}
              dropdownIconColor={NAVY}
            >
              <Picker.Item label="— Chọn nhân viên đang đi làm —" value="" />
              {activeStaffs.map(s => (
                <Picker.Item key={s.email} label={s.ho_ten} value={s.email} />
              ))}
            </Picker>
          </View>

          {selectedRescuer && (
            <View style={styles.selectedBadge}>
              <View style={styles.selectedDot} />
              <Text style={styles.selectedText}>{selectedRescuerName} đã được chọn</Text>
            </View>
          )}
        </View>

        {/* Shop list */}
        <View style={styles.shopSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop cần cứu viện</Text>
            <View style={[styles.countBadge, absentStaffShops.length > 0 && styles.countBadgeWarn]}>
              <Text style={[styles.countBadgeText, absentStaffShops.length > 0 && styles.countBadgeTextWarn]}>
                {absentStaffShops.length}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
          ) : absentStaffShops.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#16a34a" />
              </View>
              <Text style={styles.emptyTitle}>Đã điều phối xong!</Text>
              <Text style={styles.emptyText}>
                Tất cả shop của sale nghỉ hôm nay đã được giao đủ người hỗ trợ.
              </Text>
            </View>
          ) : (
            absentStaffShops.map((item) => (
              <View key={item.id} style={styles.shopCard}>
                <View style={styles.shopIconBox}>
                  <MaterialCommunityIcons name="storefront-outline" size={18} color="#b45309" />
                </View>
                <View style={styles.shopMeta}>
                  <Text style={styles.shopName}>{item.ten_cua_hang}</Text>
                  <Text style={styles.shopAddr} numberOfLines={1}>{item.dia_chi}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.assignBtn, !selectedRescuer && styles.assignBtnDisabled]}
                  activeOpacity={0.8}
                  onPress={() => handleAssign(item.id, item.ten_cua_hang)}
                >
                  <Ionicons name="send" size={13} color={selectedRescuer ? '#fff' : '#94a3b8'} />
                  <Text style={[styles.assignBtnText, !selectedRescuer && styles.assignBtnTextDisabled]}>
                    Giao
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.7, color: '#94a3b8', marginBottom: 10,
  },

  pickerSection: {
    backgroundColor: '#fff', margin: 14, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  pickerBox: {
    backgroundColor: '#f8fafc', borderRadius: 10, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#f0fdf4', borderRadius: 8,
    borderWidth: 0.5, borderColor: 'rgba(22,163,74,0.2)',
  },
  selectedDot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#16a34a',
  },
  selectedText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },

  shopSection: { paddingHorizontal: 14 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  countBadge: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  countBadgeWarn: { backgroundColor: '#fffbeb' },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  countBadgeTextWarn: { color: '#b45309' },

  shopCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 8,
  },
  shopIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#fffbeb',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    borderWidth: 0.5, borderColor: 'rgba(180,83,9,0.15)',
  },
  shopMeta: { flex: 1, minWidth: 0 },
  shopName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  shopAddr: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 9, backgroundColor: NAVY,
    flexShrink: 0,
  },
  assignBtnDisabled: { backgroundColor: '#f1f5f9' },
  assignBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  assignBtnTextDisabled: { color: '#94a3b8' },

  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 68, height: 68, borderRadius: 17,
    backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },
});