import React from 'react';
import { View, Text, Image, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#1a3a6b';

interface ProductCardProps {
  item: any;
  stockValue: string;
  onStockChange: (value: string) => void;
}

export const ProductCard = ({ item, stockValue, onStockChange }: ProductCardProps) => {
  const hasValue = stockValue !== undefined && stockValue !== '';

  return (
    <View style={[styles.productCard, hasValue && styles.productCardActive]}>
      <Image
        source={{ uri: item.anh_san_pham_url || 'https://via.placeholder.com/80' }}
        style={styles.productImg}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.ten_san_pham}</Text>
        <View style={styles.lastRow}>
          <Ionicons name="time-outline" size={11} color="#94a3b8" />
          <Text style={styles.lastText}>
            Lần trước:{' '}
            <Text style={{ fontWeight: '600', color: '#475569' }}>
              {item.lastCheckQty !== null ? item.lastCheckQty : 'Chưa có'}
            </Text>
          </Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Tồn kho thực tế</Text>
          <TextInput
            style={[styles.stockInput, hasValue && styles.stockInputActive]}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#cbd5e1"
            value={stockValue || ''}
            onChangeText={onStockChange}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12,
    borderRadius: 14, marginBottom: 10, borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)'
  },
  productCardActive: { borderColor: NAVY },
  productImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f5f6f8' },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  productName: { fontSize: 13, fontWeight: '500', color: '#0f172a', lineHeight: 18 },
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  lastText: { fontSize: 11, color: '#94a3b8' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  inputLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  stockInput: {
    width: 54, height: 36, backgroundColor: '#f5f6f8', borderRadius: 9,
    textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#0f172a',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)'
  },
  stockInputActive: { borderColor: NAVY, backgroundColor: '#e8eef8' },
});
