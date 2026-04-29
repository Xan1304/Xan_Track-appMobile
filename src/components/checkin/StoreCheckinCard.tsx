import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StoreCheckinCardProps {
  name: string;
  addr: string;
  isInRange: boolean;
  distanceInfo: string;
}

export const StoreCheckinCard = ({ name, addr, isInRange, distanceInfo }: StoreCheckinCardProps) => {
  return (
    <View style={styles.storeCard}>
      <View style={styles.storeCardLeft}>
        <Text style={styles.storeName}>{name}</Text>
        <Text style={styles.storeAddr} numberOfLines={2}>{addr}</Text>
      </View>
      <View style={[styles.gpsBadge, { backgroundColor: isInRange ? '#f0fdf4' : '#fef2f2' }]}>
        <View style={[styles.gpsIndicator, { backgroundColor: isInRange ? '#16a34a' : '#dc2626' }]} />
        <Text style={[styles.gpsBadgeText, { color: isInRange ? '#16a34a' : '#dc2626' }]}>
          {isInRange ? 'Hợp lệ' : distanceInfo}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  storeCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10
  },
  storeCardLeft: { flex: 1, marginRight: 12 },
  storeName: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  storeAddr: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexShrink: 0 },
  gpsIndicator: { width: 6, height: 6, borderRadius: 3 },
  gpsBadgeText: { fontSize: 11, fontWeight: '600' },
});
