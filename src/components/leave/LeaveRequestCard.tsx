import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#1a3a6b';

const getInitials = (fullName: string) => {
  if (!fullName) return 'NV';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'da_duyet': return { color: '#16a34a', bg: '#f0fdf4', label: 'Đã duyệt', icon: 'checkmark-circle' as const };
    case 'tu_choi': return { color: '#dc2626', bg: '#fef2f2', label: 'Từ chối', icon: 'close-circle' as const };
    default: return { color: '#b45309', bg: '#fffbeb', label: 'Chờ duyệt', icon: 'time' as const };
  }
};

interface LeaveRequestCardProps {
  item: any;
  onAction: (id: string, status: 'da_duyet' | 'tu_choi', name: string) => void;
  onViewImage?: (url: string) => void;
}

export const LeaveRequestCard = ({ item, onAction, onViewImage }: LeaveRequestCardProps) => {
  const status = getStatusInfo(item.trang_thai);

  return (
    <View style={styles.card}>
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

      <View style={styles.cardDivider} />

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
        {item.minh_chung_url && (
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, marginLeft: 36 }}
            onPress={() => onViewImage?.(item.minh_chung_url)}
          >
            <Ionicons name="image-outline" size={14} color={NAVY} />
            <Text style={{ fontSize: 13, color: NAVY, fontWeight: '500', textDecorationLine: 'underline' }}>Xem ảnh đính kèm</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.trang_thai === 'cho_duyet' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnReject}
            activeOpacity={0.7}
            onPress={() => onAction(item.id, 'tu_choi', item.ho_ten_nhan_vien)}
          >
            <Ionicons name="close" size={15} color="#dc2626" />
            <Text style={styles.btnRejectText}>Từ chối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnApprove}
            activeOpacity={0.7}
            onPress={() => onAction(item.id, 'da_duyet', item.ho_ten_nhan_vien)}
          >
            <Ionicons name="checkmark" size={15} color="#fff" />
            <Text style={styles.btnApproveText}>Duyệt đơn</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});
