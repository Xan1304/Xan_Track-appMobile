import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';
const CATEGORIES = ['Tất cả', 'Sữa bột', 'Sữa bột pha sẵn', 'Sữa tươi', 'Ngũ cốc'];

export default function OrderPage() {
  const { id: storeId, name: storeName, addr: storeAddr } = useLocalSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  useEffect(() => {
    if (!storeId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin cửa hàng.', [
        { text: 'Quay lại', onPress: () => router.back() },
      ]);
      return;
    }
    fetchProducts();
  }, [storeId]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('danh_muc_san_pham').select('*').order('ten_san_pham', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Lỗi tải sản phẩm:', error.message);
    } finally { setLoading(false); }
  }

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      (activeTab === 'Tất cả' || p.loai_san_pham === activeTab) &&
      p.ten_san_pham.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, activeTab, searchQuery]
  );

  const cartSummary = useMemo(() => {
    let totalItems = 0, totalPrice = 0;
    Object.keys(cart).forEach(id => {
      const p = products.find(p => p.id === id);
      if (p) { totalItems += cart[id]; totalPrice += p.gia_ban * cart[id]; }
    });
    return { totalItems, totalPrice };
  }, [cart, products]);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[id] || 0) + delta);
      if (qty === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: qty };
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={NAVY} /></View>;

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
          <Ionicons name="cart-outline" size={20} color={cartSummary.totalItems > 0 ? NAVY : '#94a3b8'} />
          {cartSummary.totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartSummary.totalItems}</Text>
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
        renderItem={({ item }) => {
          const qty = cart[item.id] || 0;
          return (
            <View style={[styles.productCard, qty > 0 && styles.productCardActive]}>
              <Image
                source={{ uri: item.anh_san_pham_url || 'https://via.placeholder.com/80' }}
                style={styles.productImg}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.ten_san_pham}</Text>
                <Text style={styles.productPrice}>{item.gia_ban.toLocaleString('vi-VN')}đ</Text>
                <View style={styles.productBottom}>
                  <View style={styles.stockTag}>
                    <Text style={styles.stockTagText}>Có hàng</Text>
                  </View>
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => updateQty(item.id, 1)}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                        <Ionicons name="remove" size={14} color={NAVY} />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{qty}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: NAVY }]} onPress={() => updateQty(item.id, 1)}>
                        <Ionicons name="add" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotal}>{cartSummary.totalPrice.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, cartSummary.totalItems === 0 && styles.nextBtnDisabled]}
          disabled={cartSummary.totalItems === 0}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/route/checkout',
              params: { cart: JSON.stringify(cart), storeId, storeName, storeAddr, totalAmount: cartSummary.totalPrice },
            } as any)
          }
        >
          <Text style={styles.nextBtnText}>Xác nhận</Text>
          {cartSummary.totalItems > 0 && (
            <View style={styles.nextBtnBadge}>
              <Text style={styles.nextBtnBadgeText}>{cartSummary.totalItems}</Text>
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

  productCard:        { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  productCardActive:  { borderColor: NAVY, borderWidth: 1 },
  productImg:         { width: 78, height: 78, borderRadius: 10, backgroundColor: '#f5f6f8' },
  productInfo:        { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  productName:        { fontSize: 13, fontWeight: '500', color: '#0f172a', lineHeight: 18 },
  productPrice:       { fontSize: 14, fontWeight: '700', color: NAVY },
  productBottom:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockTag:           { backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  stockTagText:       { fontSize: 9, fontWeight: '600', color: '#16a34a' },
  addBtn:             { width: 30, height: 30, borderRadius: 9, backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center' },
  qtyRow:             { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:             { width: 28, height: 28, borderRadius: 8, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center' },
  qtyVal:             { fontSize: 14, fontWeight: '700', color: '#0f172a', minWidth: 18, textAlign: 'center' },

  footer:             { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)' },
  footerLabel:        { fontSize: 10, color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  footerTotal:        { fontSize: 19, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  nextBtn:            { backgroundColor: NAVY, paddingHorizontal: 22, height: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextBtnDisabled:    { backgroundColor: '#cbd5e1' },
  nextBtnText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
  nextBtnBadge:       { backgroundColor: 'rgba(255,255,255,0.25)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  nextBtnBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
});