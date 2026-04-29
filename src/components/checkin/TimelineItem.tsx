import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { formatTimeShort, formatDateFull } from '../../utils/format';
import { CheckinHistoryItem } from '../../services/checkinService';

export const getTypeInfo = (type: string) => {
  switch (type) {
    case 'checkin': return { label: 'VÀO TIỆM', color: '#16a34a', iconBg: '#f0fdf4', icon: 'login' };
    case 'trung_bay': return { label: 'TRƯNG BÀY', color: Theme.NAVY, iconBg: '#f0f4ff', icon: 'camera' };
    case 'bien_ban': return { label: 'ĐƠN HÀNG', color: '#b45309', iconBg: '#fffbeb', icon: 'file-document' };
    case 'checkout': return { label: 'KẾT THÚC', color: '#dc2626', iconBg: '#fef2f2', icon: 'logout' };
    default: return { label: 'HOẠT ĐỘNG', color: '#475569', iconBg: '#f8fafc', icon: 'dots-horizontal' };
  }
};

interface TimelineItemProps {
  item: CheckinHistoryItem;
  onImagePress: (url: string) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ item, onImagePress }) => {
  const type = getTypeInfo(item.loai_hinh);
  const isDistOk = item.khoang_cach <= 50;

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeValue}>{formatTimeShort(item.thoi_gian)}</Text>
        <Text style={styles.dateValue}>{formatDateFull(item.thoi_gian)}</Text>
      </View>
      <View style={styles.lineColumn}>
        <View style={[styles.dot, { backgroundColor: type.color }]} />
        <View style={styles.line} />
      </View>
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
            <TouchableOpacity onPress={() => item.image_url && onImagePress(item.image_url)} style={styles.thumbWrap}>
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
};

const styles = StyleSheet.create({
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: '700' },
  distBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  distText: { fontSize: 10, fontWeight: '600' },
  cardBody: { flexDirection: 'row', gap: 10 },
  storeName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  staffNameSmall: { fontSize: 11, color: Theme.NAVY, fontWeight: '500', marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  addrText: { fontSize: 10, color: '#94a3b8', flex: 1 },
  thumbWrap: { position: 'relative', flexShrink: 0 },
  thumb: { width: 54, height: 54, borderRadius: 8, backgroundColor: '#f8fafc' },
  zoomOverlay: {
    position: 'absolute', right: 3, bottom: 3,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 4, padding: 2,
  },
});
