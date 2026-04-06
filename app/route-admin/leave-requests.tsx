import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

const getInitials = (fullName: string) => {
  if (!fullName) return 'NV';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function AdminLeaveRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => { fetchRequests(); }, [])
  );

  async function fetchRequests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('don_nghi_phep')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (e: any) {
      Alert.alert('Lỗi kết nối', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, status: 'da_duyet' | 'tu_choi', name: string) {
    const isApprove = status === 'da_duyet';
    Alert.alert(
      isApprove ? 'Duyệt đơn nghỉ phép' : 'Từ chối đơn',
      `${isApprove ? 'Duyệt' : 'Từ chối'} đơn nghỉ của ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: isApprove ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('don_nghi_phep')
                .update({ trang_thai: status })
                .eq('id', id);
              if (error) throw error;
              fetchRequests();
            } catch (e: any) {
              Alert.alert('Lỗi', e.message);
            }
          }
        }
      ]
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'da_duyet': return { color: '#16a34a', bg: '#f0fdf4', label: 'Đã duyệt', icon: 'checkmark-circle' as const };
      case 'tu_choi': return { color: '#dc2626', bg: '#fef2f2', label: 'Từ chối', icon: 'close-circle' as const };
      default: return { color: '#b45309', bg: '#fffbeb', label: 'Chờ duyệt', icon: 'time' as const };
    }
  };

  const pendingCount = requests.filter(r => r.trang_thai === 'cho_duyet').length;

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Duyệt nghỉ phép</Text>
          {pendingCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{pendingCount} chờ duyệt</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="cafe-outline" size={36} color={NAVY} />
            </View>
            <Text style={styles.emptyTitle}>Không có đơn nào</Text>
            <Text style={styles.emptyText}>Hiện tại không có đơn nghỉ phép nào chờ xử lý.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStatusInfo(item.trang_thai);
          return (
            <View style={styles.card}>
              {/* Card top */}
              <View style={styles.cardTop}>
                <View style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{getInitials(item.ho_ten_nhan_vien)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.ho_ten_nhan_vien || 'Nhân viên XAN'}</Text>
                    <Text style={styles.userEmail}>{item.nhan_vien_email}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={11} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Info */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#f0f4ff' }]}>
                    <Ionicons name="calendar-outline" size={14} color={NAVY} />
                  </View>
                  <Text style={styles.infoText}>
                    {item.ngay_bat_dau} → {item.ngay_ket_thuc}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#f8fafc' }]}>
                    <Ionicons name="chatbox-ellipses-outline" size={14} color="#64748b" />
                  </View>
                  <Text style={styles.infoText} numberOfLines={2}>
                    {item.ly_do || 'Không có lý do chi tiết'}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              {item.trang_thai === 'cho_duyet' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnReject}
                    activeOpacity={0.7}
                    onPress={() => handleAction(item.id, 'tu_choi', item.ho_ten_nhan_vien)}
                  >
                    <Ionicons name="close" size={15} color="#dc2626" />
                    <Text style={styles.btnRejectText}>Từ chối</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnApprove}
                    activeOpacity={0.7}
                    onPress={() => handleAction(item.id, 'da_duyet', item.ho_ten_nhan_vien)}
                  >
                    <Ionicons name="checkmark" size={15} color="#fff" />
                    <Text style={styles.btnApproveText}>Duyệt đơn</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  headerBadge: {
    backgroundColor: '#fffbeb', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(180,83,9,0.2)',
  },
  headerBadgeText: { fontSize: 10, color: '#b45309', fontWeight: '600' },

  listContent: { padding: 14, paddingBottom: 36 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 10,
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  userAvatar: {
    width: 38, height: 38, borderRadius: 9,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  userEmail: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },

  cardDivider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 12 },

  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: {
    width: 26, height: 26, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  infoText: { fontSize: 13, color: '#334155', flex: 1, lineHeight: 18, paddingTop: 4 },

  actions: {
    flexDirection: 'row', gap: 8,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 42, borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
  },
  btnRejectText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  btnApprove: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 42, borderRadius: 10,
    backgroundColor: NAVY,
  },
  btnApproveText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },
});