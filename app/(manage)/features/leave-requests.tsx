import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLeaveRequests } from '../../../src/hooks/useLeaveRequests';
import { LeaveRequestCard } from '../../../src/components/leave/LeaveRequestCard';

const NAVY = '#1a3a6b';

export default function AdminLeaveRequests() {
  const router = useRouter();
  const { requests, loading, pendingCount, fetchRequests, handleAction } = useLeaveRequests();
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  useFocusEffect(
    useCallback(() => { fetchRequests(); }, [fetchRequests])
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(manage)')} style={styles.headerBack}>
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
        renderItem={({ item }) => (
          <LeaveRequestCard item={item} onAction={handleAction} onViewImage={setSelectedImage} />
        )}
      />

      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
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

  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  modalImage: { width: '90%', height: '80%', borderRadius: 12 },
});
