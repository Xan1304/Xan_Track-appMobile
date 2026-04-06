import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

export default function ManageStores() {
  const [stores, setStores] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('all');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => { fetchInitialData(); }, [])
  );

  async function fetchInitialData() {
    try {
      setLoading(true);
      const { data: routeData } = await supabase
        .from('tuyen_ban_hang').select('id, ten_tuyen').order('ten_tuyen', { ascending: true });
      setRoutes(routeData || []);

      const { data: storeData, error } = await supabase
        .from('danh_sach_cua_hang')
        .select('*, tuyen_ban_hang(ten_tuyen)')
        .order('ten_cua_hang', { ascending: true });

      if (error) throw error;

      const formatted = storeData?.map(s => ({
        ...s,
        ten_tuyen_hien_thi: Array.isArray(s.tuyen_ban_hang)
          ? s.tuyen_ban_hang[0]?.ten_tuyen
          : s.tuyen_ban_hang?.ten_tuyen || 'Chưa gán tuyến'
      }));
      setStores(formatted || []);
    } catch (e: any) {
      Alert.alert('Lỗi dữ liệu', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Xác nhận xóa', `Xóa shop "${name}" khỏi hệ thống?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('danh_sach_cua_hang').delete().eq('id', id);
          if (error) Alert.alert('Lỗi', 'Không thể xóa shop đã có dữ liệu lịch sử!');
          else fetchInitialData();
        }
      }
    ]);
  }

  const filteredStores = stores.filter(s => {
    let matchRoute = false;
    if (selectedRouteId === 'all') matchRoute = true;
    else if (selectedRouteId === 'unassigned') matchRoute = !s.tuyen_id;
    else matchRoute = s.tuyen_id === selectedRouteId;

    const q = searchQuery.toLowerCase();
    const matchSearch = s.ten_cua_hang.toLowerCase().includes(q) || s.dia_chi.toLowerCase().includes(q);
    return matchRoute && matchSearch;
  });

  const unassignedCount = stores.filter(s => !s.tuyen_id).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý cửa hàng</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/route-admin/store-form')}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên hoặc địa chỉ..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Route filter */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterTab, selectedRouteId === 'all' && styles.filterActive]}
            onPress={() => setSelectedRouteId('all')}
          >
            <Text style={[styles.filterTabText, selectedRouteId === 'all' && styles.filterTextActive]}>
              Tất cả ({stores.length})
            </Text>
          </TouchableOpacity>

          {unassignedCount > 0 && (
            <TouchableOpacity
              style={[styles.filterTab, selectedRouteId === 'unassigned' && styles.filterActiveWarn]}
              onPress={() => setSelectedRouteId('unassigned')}
            >
              <Text style={[styles.filterTabText, selectedRouteId === 'unassigned' && styles.filterTextActive]}>
                ⚠ Chưa gán ({unassignedCount})
              </Text>
            </TouchableOpacity>
          )}

          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[styles.filterTab, selectedRouteId === route.id && styles.filterActive]}
              onPress={() => setSelectedRouteId(route.id)}
            >
              <Text style={[styles.filterTabText, selectedRouteId === route.id && styles.filterTextActive]}>
                {route.ten_tuyen}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={filteredStores}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="check-decagram-outline" size={36} color="#16a34a" />
              </View>
              <Text style={styles.emptyTitle}>Không có kết quả</Text>
              <Text style={styles.emptyText}>Tất cả shop đã được phân tuyến đầy đủ!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.storeCard}>
              {/* Icon */}
              <View style={[styles.storeIconBox, { backgroundColor: item.tuyen_id ? '#f0f4ff' : '#fef2f2' }]}>
                <MaterialCommunityIcons
                  name={item.tuyen_id ? 'storefront-outline' : 'map-marker-off-outline'}
                  size={20}
                  color={item.tuyen_id ? NAVY : '#dc2626'}
                />
              </View>

              {/* Info */}
              <View style={styles.storeMeta}>
                <Text style={styles.storeName}>{item.ten_cua_hang}</Text>
                <Text style={styles.storeAddr} numberOfLines={1}>{item.dia_chi}</Text>
                <View style={[styles.routeBadge, !item.tuyen_id && styles.routeBadgeWarn]}>
                  <Text style={[styles.routeBadgeText, !item.tuyen_id && styles.routeBadgeTextWarn]}>
                    {item.ten_tuyen_hien_thi}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.storeActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push({ pathname: '/route-admin/store-form', params: { id: item.id } } as any)}
                >
                  <Ionicons name="create-outline" size={20} color={NAVY} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item.id, item.ten_cua_hang)}
                >
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  addBtn: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center',
  },

  searchSection: {
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f1f5f9', paddingHorizontal: 12, height: 40, borderRadius: 10,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a' },

  filterWrapper: {
    backgroundColor: '#fff', paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterContent: { paddingHorizontal: 14, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  filterActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterActiveWarn: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  filterTabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  listContent: { padding: 14, paddingBottom: 36 },

  storeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 8,
  },
  storeIconBox: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  storeMeta: { flex: 1, minWidth: 0 },
  storeName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  storeAddr: { fontSize: 11, color: '#64748b', marginTop: 2 },
  routeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f4ff', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginTop: 5, alignSelf: 'flex-start',
    borderWidth: 0.5, borderColor: 'rgba(26,58,107,0.12)',
  },
  routeBadgeWarn: { backgroundColor: '#fef2f2', borderColor: 'rgba(220,38,38,0.15)' },
  routeBadgeText: { fontSize: 10, color: NAVY, fontWeight: '600' },
  routeBadgeTextWarn: { color: '#dc2626' },

  storeActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },
});