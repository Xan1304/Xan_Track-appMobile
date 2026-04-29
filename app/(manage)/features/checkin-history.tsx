import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, TouchableOpacity, Modal, Dimensions, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Theme, ACTIVITY_TYPES } from '../../../src/constants/Theme';
import { useCheckinHistory } from '../../../src/hooks/useCheckinHistory';
import { TimelineItem } from '../../../src/components/checkin/TimelineItem';

const { width, height } = Dimensions.get('window');

export default function CheckinHistory() {
  const router = useRouter();
  const [showStaffFilter, setShowStaffFilter] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    history, staffs, loading, refreshing, setRefreshing,
    filterMonths, selectedMonth, setSelectedMonth,
    selectedStaff, setSelectedStaff,
    selectedType, setSelectedType,
    loadHistory
  } = useCheckinHistory();

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const selectedStaffName = staffs.find(s => s.email === selectedStaff)?.ho_ten;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(manage)')} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giám sát XANTrack</Text>
        <TouchableOpacity
          style={[styles.staffFilterBtn, selectedStaff && styles.staffFilterActive]}
          onPress={() => setShowStaffFilter(true)}
        >
          <Ionicons name="person-outline" size={16} color={selectedStaff ? '#fff' : '#475569'} />
          {selectedStaff && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {selectedStaff && (
        <View style={styles.activeFilterBar}>
          <Ionicons name="person" size={12} color={Theme.NAVY} />
          <Text style={styles.activeFilterText}>Đang lọc: {selectedStaffName}</Text>
          <TouchableOpacity onPress={() => setSelectedStaff(null)}>
            <Ionicons name="close-circle" size={16} color={Theme.NAVY} />
          </TouchableOpacity>
        </View>
      )}

      {/* Month filter */}
      <View style={styles.filterBar}>
        {filterMonths.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.filterTab, selectedMonth?.month === item.month && styles.filterActive]}
            onPress={() => setSelectedMonth(item)}
          >
            <Text style={[styles.filterTabText, selectedMonth?.month === item.month && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type filter */}
      <View style={styles.typeFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeFilterContent}>
          {ACTIVITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeTab, selectedType === type.value && styles.typeTabActive]}
              onPress={() => setSelectedType(type.value)}
            >
              <MaterialCommunityIcons
                name={type.icon as any}
                size={14}
                color={selectedType === type.value ? '#fff' : '#64748b'}
              />
              <Text style={[styles.typeTabText, selectedType === type.value && styles.typeTabTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.NAVY} /></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadHistory(); }}
              tintColor={Theme.NAVY}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu phù hợp.</Text>}
          renderItem={({ item }) => <TimelineItem item={item} onImagePress={setSelectedImage} />}
        />
      )}

      {/* Staff filter modal */}
      <Modal visible={showStaffFilter} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn nhân viên</Text>
            <ScrollView style={{ maxHeight: height * 0.45 }}>
              {staffs.map((s) => (
                <TouchableOpacity
                  key={s.email}
                  style={styles.filterItem}
                  onPress={() => { setSelectedStaff(s.email); setShowStaffFilter(false); }}
                >
                  <View style={styles.filterItemInner}>
                    <View style={styles.filterAvatar}>
                      <Text style={styles.filterAvatarText}>
                        {s.ho_ten?.split(' ').pop()?.[0] || '?'}
                      </Text>
                    </View>
                    <Text style={[styles.filterText, selectedStaff === s.email && styles.filterTextActive2]}>
                      {s.ho_ten}
                    </Text>
                  </View>
                  {selectedStaff === s.email && (
                    <Ionicons name="checkmark" size={18} color={Theme.NAVY} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.btnAll} onPress={() => { setSelectedStaff(null); setShowStaffFilter(false); }}>
              <Text style={styles.btnAllText}>Xem tất cả nhân viên</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.imgModalOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={42} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage || '' }} style={styles.fullImg} resizeMode="contain" />
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
    paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  staffFilterBtn: {
    width: 36, height: 36, borderRadius: 9, backgroundColor: '#f8fafc',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  staffFilterActive: { backgroundColor: Theme.NAVY },
  activeDot: {
    position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#22c55e', borderWidth: 1, borderColor: '#fff',
  },
  activeFilterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0f4ff', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(26,58,107,0.1)',
  },
  activeFilterText: { flex: 1, fontSize: 12, color: Theme.NAVY, fontWeight: '500' },
  filterBar: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#fff',
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  filterActive: { backgroundColor: Theme.NAVY, borderColor: Theme.NAVY },
  filterTabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  typeFilterBar: {
    backgroundColor: '#fff', paddingBottom: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  typeFilterContent: { paddingHorizontal: 14, gap: 8 },
  typeTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  typeTabActive: { backgroundColor: Theme.NAVY, borderColor: Theme.NAVY },
  typeTabText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  typeTabTextActive: { color: '#fff' },
  listContent: { paddingTop: 8, paddingBottom: 36 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '88%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  filterItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterItemInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterAvatar: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Theme.NAVY, justifyContent: 'center', alignItems: 'center',
  },
  filterAvatarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterText: { fontSize: 14, color: '#334155' },
  filterTextActive2: { color: Theme.NAVY, fontWeight: '600' },
  btnAll: { marginTop: 14, padding: 14, backgroundColor: Theme.NAVY, borderRadius: 12, alignItems: 'center' },
  btnAllText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  imgModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 5 },
  fullImg: { width, height: height * 0.8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 60 },
});
