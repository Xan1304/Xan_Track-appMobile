import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, Modal, ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useInventory } from '../../../src/hooks/useInventory';
import { ProductCard } from '../../../src/components/inventory/ProductCard';

const NAVY = '#1a3a6b';
const CATEGORIES = ['Tất cả', 'Sữa bột', 'Sữa bột pha sẵn', 'Sữa tươi', 'Ngũ cốc'];

export default function InventoryPage() {
  const { id: storeId, name: storeName } = useLocalSearchParams();
  const router = useRouter();

  const {
    loading,
    searchQuery, setSearchQuery,
    activeTab, setActiveTab,
    stockData, setStockData,
    showSummary, setShowSummary,
    isSaving,
    filteredProducts,
    summaryItems,
    fetchProducts,
    confirmSaveToDb
  } = useInventory(storeId as string, storeName as string);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Kiểm tồn kho</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{storeName}</Text>
        </View>
        {summaryItems.length > 0 && (
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{summaryItems.length}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Search + Tabs */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm sản phẩm..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <FlatList
            horizontal data={CATEGORIES}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tab, activeTab === item && styles.tabActive]}
                onPress={() => setActiveTab(item)}
              >
                <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Product list */}
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              stockValue={stockData[item.id]}
              onStockChange={(value) => setStockData({ ...stockData, [item.id]: value })}
            />
          )}
        />
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Đã nhập</Text>
          <Text style={styles.footerValue}>{summaryItems.length} sản phẩm</Text>
        </View>
        <TouchableOpacity
          style={[styles.reviewBtn, summaryItems.length === 0 && styles.reviewBtnDisabled]}
          disabled={summaryItems.length === 0}
          onPress={() => setShowSummary(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.reviewBtnText}>Xem lại & lưu</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Modal */}
      <Modal visible={showSummary} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xác nhận tồn kho</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.tableHead}>
              <Text style={[styles.colLabel, { flex: 2, textAlign: 'left' }]}>Sản phẩm</Text>
              <Text style={styles.colLabel}>Cũ</Text>
              <Text style={[styles.colLabel, { textAlign: 'right' }]}>Mới</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {summaryItems.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.rowCell, { flex: 2, textAlign: 'left' }]} numberOfLines={1}>
                    {item.ten_san_pham}
                  </Text>
                  <Text style={styles.rowCell}>
                    {item.lastCheckQty !== null ? item.lastCheckQty : '—'}
                  </Text>
                  <Text style={[styles.rowCell, { textAlign: 'right', fontWeight: '700', color: NAVY }]}>
                    {stockData[item.id]}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSummary(false)}>
                <Text style={styles.cancelBtnText}>Sửa lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmSaveToDb}>
                {isSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Gửi báo cáo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f6f8' },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', gap: 12 },
  backBtn:            { width: 36, height: 36, justifyContent: 'center' },
  headerTitle:        { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  headerSub:          { fontSize: 11, color: '#64748b', marginTop: 1 },
  countBubble:        { backgroundColor: '#e8eef8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  countBubbleText:    { fontSize: 12, fontWeight: '700', color: NAVY },

  filterSection:      { backgroundColor: '#fff', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f6f8', paddingHorizontal: 12, height: 40, borderRadius: 10, gap: 8, marginBottom: 10, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  searchInput:        { flex: 1, fontSize: 13, color: '#0f172a' },
  tabsRow:            { gap: 8 },
  tab:                { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#fff' },
  tabActive:          { backgroundColor: NAVY, borderColor: NAVY },
  tabText:            { fontSize: 12, color: '#475569' },
  tabTextActive:      { color: '#fff', fontWeight: '500' },

  listContent:        { padding: 14, paddingBottom: 140 },

  footer:             { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)' },
  footerLabel:        { fontSize: 10, color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  footerValue:        { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  reviewBtn:          { backgroundColor: NAVY, paddingHorizontal: 22, height: 48, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  reviewBtnDisabled:  { backgroundColor: '#cbd5e1' },
  reviewBtnText:      { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle:         { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  tableHead:          { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', marginBottom: 4 },
  colLabel:           { flex: 1, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8', textAlign: 'center' },
  tableRow:           { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' },
  rowCell:            { flex: 1, fontSize: 12, color: '#475569', textAlign: 'center' },
  modalFooter:        { flexDirection: 'row', gap: 12, marginTop: 18 },
  cancelBtn:          { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#f5f6f8' },
  cancelBtnText:      { fontSize: 14, fontWeight: '500', color: '#64748b' },
  saveBtn:            { flex: 1.5, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: NAVY },
  saveBtnText:        { color: '#fff', fontSize: 14, fontWeight: '600' },
});
