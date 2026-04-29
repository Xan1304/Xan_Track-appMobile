import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#1a3a6b';

interface OrderProductCardProps {
  item: {
    id: string;
    ten_san_pham: string;
    gia_ban: number;
    anh_san_pham_url?: string;
  };
  qty: number;
  onUpdateQty: (id: string, delta: number) => void;
}

export const OrderProductCard = ({ item, qty, onUpdateQty }: OrderProductCardProps) => {
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
            <TouchableOpacity style={styles.addBtn} onPress={() => onUpdateQty(item.id, 1)}>
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQty(item.id, -1)}>
                <Ionicons name="remove" size={14} color={NAVY} />
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: NAVY }]} onPress={() => onUpdateQty(item.id, 1)}>
                <Ionicons name="add" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 14, 
    marginBottom: 10, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)'
  },
  productCardActive: { borderColor: NAVY, borderWidth: 1 },
  productImg: { width: 78, height: 78, borderRadius: 10, backgroundColor: '#f5f6f8' },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  productName: { fontSize: 13, fontWeight: '500', color: '#0f172a', lineHeight: 18 },
  productPrice: { fontSize: 14, fontWeight: '700', color: NAVY },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockTag: { backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  stockTagText: { fontSize: 9, fontWeight: '600', color: '#16a34a' },
  addBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 14, fontWeight: '700', color: '#0f172a', minWidth: 18, textAlign: 'center' },
});
