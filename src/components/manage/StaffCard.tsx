import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const NAVY = '#1a3a6b';

export const getInitials = (fullName: string) => {
  if (!fullName) return 'NV';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface StaffCardProps {
  item: {
    id: string;
    ho_ten: string;
    ten_tuyen_display: string;
  };
  onPress: () => void;
}

export const StaffCard = ({ item, onPress }: StaffCardProps) => {
  return (
    <TouchableOpacity
      style={styles.staffCard}
      activeOpacity={0.7}
      onPress={onPress}
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
  );
};

const styles = StyleSheet.create({
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
});
