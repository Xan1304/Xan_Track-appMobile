import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

export default function ManageRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const router = useRouter();

  useEffect(() => { fetchRoutes(); }, []);

  async function fetchRoutes() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tuyen_ban_hang').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRoutes(data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRoute() {
    if (!newRouteName.trim()) return;
    try {
      const { error } = await supabase.from('tuyen_ban_hang').insert([{ ten_tuyen: newRouteName.trim() }]);
      if (error) throw error;
      setNewRouteName('');
      setModalVisible(false);
      fetchRoutes();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý tuyến đi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Count bar */}
      {!loading && (
        <View style={styles.dateBar}>
          <Text style={styles.dateText}>{routes.length} tuyến bán hàng</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="map-marker-path" size={36} color={NAVY} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có tuyến nào</Text>
              <Text style={styles.emptyText}>Nhấn nút + để tạo tuyến bán hàng đầu tiên.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.routeCard}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/route-admin/assign-stores',
                params: { id: item.id, name: item.ten_tuyen }
              } as any)}
            >
              <View style={styles.routeIconBox}>
                <MaterialCommunityIcons name="map-marker-path" size={20} color={NAVY} />
              </View>
              <View style={styles.routeMeta}>
                <Text style={styles.routeName}>{item.ten_tuyen}</Text>
                <Text style={styles.routeSub}>Nhấn để gán cửa hàng</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Route Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <MaterialCommunityIcons name="map-marker-plus-outline" size={28} color={NAVY} />
            </View>
            <Text style={styles.modalTitle}>Tạo tuyến bán hàng</Text>
            <Text style={styles.modalSub}>Đặt tên tuyến rõ ràng để dễ quản lý</Text>

            <TextInput
              style={styles.input}
              placeholder="VD: Tuyến Quận 1 - Thứ Hai"
              placeholderTextColor="#94a3b8"
              value={newRouteName}
              onChangeText={setNewRouteName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => { setModalVisible(false); setNewRouteName(''); }}
              >
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleAddRoute} activeOpacity={0.8}>
                <Text style={styles.btnConfirmText}>Tạo ngay</Text>
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
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  addBtn: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: NAVY,
    justifyContent: 'center', alignItems: 'center',
  },

  dateBar: {
    paddingHorizontal: 18, paddingVertical: 7,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  dateText: { fontSize: 11, color: '#94a3b8' },

  listContent: { padding: 14, paddingBottom: 36 },

  routeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 8,
  },
  routeIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    borderWidth: 0.5, borderColor: 'rgba(26,58,107,0.1)',
  },
  routeMeta: { flex: 1 },
  routeName: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  routeSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', width: '88%',
    borderRadius: 20, padding: 24, alignItems: 'center',
  },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 15,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  modalSub: { fontSize: 12, color: '#94a3b8', marginBottom: 20, textAlign: 'center' },

  input: {
    width: '100%', height: 48,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10, paddingHorizontal: 14,
    fontSize: 14, color: '#0f172a',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel: {
    flex: 1, height: 44, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, backgroundColor: '#f1f5f9',
  },
  btnCancelText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  btnConfirm: {
    flex: 1, height: 44, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, backgroundColor: NAVY,
  },
  btnConfirmText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});