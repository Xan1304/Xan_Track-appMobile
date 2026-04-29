import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/services/supabase';

const NAVY = '#1a3a6b';

export default function AssignStores() {
  const { id: routeId, name: routeName } = useLocalSearchParams();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchStores(); }, []);

  async function fetchStores() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('danh_sach_cua_hang').select('*').order('ten_cua_hang', { ascending: true });
      if (error) throw error;
      setStores(data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStoreInRoute(store: any) {
    const isCurrentlyInThisRoute = store.tuyen_id === routeId;
    const newTuyenId = isCurrentlyInThisRoute ? null : routeId;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('danh_sach_cua_hang').update({ tuyen_id: newTuyenId }).eq('id', store.id);
      if (error) throw error;
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, tuyen_id: newTuyenId } : s));
    } catch (e: any) {
      Alert.alert('Lỗi cập nhật', e.message);
    } finally {
      setIsUpdating(false);
    }
  }

  const assignedCount = stores.filter(s => s.tuyen_id === routeId).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(manage)')} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gán cửa hàng</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{routeName}</Text>
        </View>
        {isUpdating ? (
          <ActivityIndicator size="small" color={NAVY} style={{ width: 36 }} />
        ) : (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{assignedCount}</Text>
          </View>
        )}
      </View>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <View style={[styles.infoIconBox, { backgroundColor: '#f0f4ff' }]}>
            <MaterialCommunityIcons name="checkbox-marked-outline" size={14} color={NAVY} />
          </View>
          <Text style={styles.infoText}>{assignedCount} đã gán vào tuyến này</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIconBox, { backgroundColor: '#fef2f2' }]}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={14} color="#dc2626" />
          </View>
          <Text style={styles.infoText}>
            {stores.filter(s => !s.tuyen_id).length} chưa gán tuyến
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isInThisRoute = item.tuyen_id === routeId;
            const isAssignedOther = item.tuyen_id && item.tuyen_id !== routeId;

            return (
              <TouchableOpacity
                style={[
                  styles.storeCard,
                  isInThisRoute && styles.storeCardActive,
                  isAssignedOther && styles.storeCardDisabled,
                ]}
                onPress={() => toggleStoreInRoute(item)}
                disabled={!!isAssignedOther}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View style={[
                  styles.storeIconBox,
                  isInThisRoute && { backgroundColor: '#f0f4ff' },
                  isAssignedOther && { backgroundColor: '#f8fafc' },
                ]}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={18}
                    color={isInThisRoute ? NAVY : isAssignedOther ? '#cbd5e1' : '#64748b'}
                  />
                </View>

                {/* Info */}
                <View style={styles.storeMeta}>
                  <Text style={[
                    styles.storeName,
                    isInThisRoute && styles.storeNameActive,
                    isAssignedOther && styles.storeNameDisabled,
                  ]}>
                    {item.ten_cua_hang}
                  </Text>
                  <Text style={styles.storeAddr} numberOfLines={1}>{item.dia_chi}</Text>
                  {isAssignedOther && (
                    <Text style={styles.warningText}>Đã thuộc tuyến khác</Text>
                  )}
                </View>

                {/* Checkbox */}
                <View style={[
                  styles.checkbox,
                  isInThisRoute && styles.checkboxActive,
                ]}>
                  {isInThisRoute && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  headerSub: { fontSize: 11, color: NAVY, fontWeight: '500', marginTop: 1 },
  countBadge: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: 'rgba(26,58,107,0.12)',
  },
  countBadgeText: { fontSize: 14, fontWeight: '700', color: NAVY },

  infoBar: {
    flexDirection: 'row', gap: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoIconBox: {
    width: 26, height: 26, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  infoText: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  listContent: { padding: 14, paddingBottom: 36 },

  storeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 8,
  },
  storeCardActive: {
    borderColor: 'rgba(26,58,107,0.25)', backgroundColor: '#fafcff',
  },
  storeCardDisabled: { opacity: 0.5 },

  storeIconBox: {
    width: 38, height: 38, borderRadius: 9,
    backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  storeMeta: { flex: 1, minWidth: 0 },
  storeName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  storeNameActive: { color: NAVY, fontWeight: '600' },
  storeNameDisabled: { color: '#94a3b8' },
  storeAddr: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  warningText: { fontSize: 10, color: '#dc2626', marginTop: 3, fontWeight: '500' },

  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: NAVY, borderColor: NAVY,
  },
});

