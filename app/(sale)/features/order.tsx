import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrder } from '../../../src/hooks/useOrder';
import { OrderProductCard } from '../../../src/components/order/OrderProductCard';

const NAVY = '#1a3a6b';
const CATEGORIES = ['Tất cả', 'Sữa bột', 'Sữa bột pha sẵn', 'Sữa tươi', 'Ngũ cốc'];

export default function OrderPage() {
  const { id: storeId, name: storeName, addr: storeAddr } = useLocalSearchParams();
  const router = useRouter();

  const {
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    cart,
    filteredProducts,
    cartSummary,
    updateQty
  } = useOrder(storeId as string);

  const totalItems = cartSummary?.totalItems ?? 0;
  const totalPrice = cartSummary?.totalPrice ?? 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{storeName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{storeAddr}</Text>
        </View>
        <View style={styles.cartBubble}>
          <Ionicons name="cart-outline" size={20} color={totalItems > 0 ? NAVY : '#94a3b8'} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </View>
      </View>

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
          horizontal
          data={CATEGORIES}
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
        renderItem={({ item }) => (
          <OrderProductCard 
            item={item} 
            qty={cart[item.id] || 0} 
            onUpdateQty={updateQty} 
          />
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotal}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, totalItems === 0 && styles.nextBtnDisabled]}
          disabled={totalItems === 0}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/(sale)/features/order-summary',
              params: { cart: JSON.stringify(cart), storeId, storeName, storeAddr, totalAmount: totalPrice },
            } as any)
          }
        >
          <Text style={styles.nextBtnText}>Xác nhận</Text>
          {totalItems > 0 && (
            <View style={styles.nextBtnBadge}>
              <Text style={styles.nextBtnBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f6f8' },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', gap: 12 },
  backBtn:            { width: 36, height: 36, justifyContent: 'center' },
  headerTitle:        { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  headerSub:          { fontSize: 11, color: '#64748b', marginTop: 1 },
  cartBubble:         { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cartBadge:          { position: 'absolute', top: 4, right: 4, backgroundColor: '#dc2626', width: 15, height: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText:      { color: '#fff', fontSize: 9, fontWeight: '700' },

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
  footerTotal:        { fontSize: 19, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  nextBtn:            { backgroundColor: NAVY, paddingHorizontal: 22, height: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextBtnDisabled:    { backgroundColor: '#cbd5e1' },
  nextBtnText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
  nextBtnBadge:       { backgroundColor: 'rgba(255,255,255,0.25)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  nextBtnBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
});
