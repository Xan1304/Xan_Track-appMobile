import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

export default function CheckoutPage() {
  const { cart, storeId, storeName, totalAmount } = useLocalSearchParams();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [salesman, setSalesman] = useState<any>(null);
  const router = useRouter();
  const parsedCart = cart ? JSON.parse(cart as string) : {};

  useEffect(() => { fetchInfo(); }, []);

  async function fetchInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('ho_so_nhan_vien').select('*').eq('email', user?.email).single();
      setSalesman(profile);

      const { data: products } = await supabase
        .from('danh_muc_san_pham').select('*').in('id', Object.keys(parsedCart));
      setOrderItems(
        products?.map(p => ({ ...p, quantity: parsedCart[p.id], total: p.gia_ban * parsedCart[p.id] })) || []
      );
    } catch (e) { console.log(e); }
  }

  const exportPDF = async () => {
    const html = `
      <html>
        <body style="font-family: Arial; padding: 40px; color: #0f172a;">
          <div style="text-align:center; margin-bottom:24px;">
            <h1 style="color:${NAVY}; margin:0; font-size:22px;">CÔNG TY SỮA XAN</h1>
            <h2 style="margin:4px 0 0; font-size:16px; color:#475569;">BIÊN BẢN ĐƠN HÀNG</h2>
          </div>
          <hr style="border-color:#e2e8f0;"/>
          <table style="width:100%; font-size:13px; margin:16px 0;">
            <tr><td style="color:#64748b; padding:4px 0;">Cửa hàng</td><td style="font-weight:600;">${storeName}</td></tr>
            <tr><td style="color:#64748b; padding:4px 0;">Nhân viên</td><td style="font-weight:600;">${salesman?.ho_ten}</td></tr>
            <tr><td style="color:#64748b; padding:4px 0;">Ngày</td><td style="font-weight:600;">${new Date().toLocaleDateString('vi-VN')}</td></tr>
          </table>
          <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:13px;">
            <tr style="background:#f8fafc;">
              <th style="border:1px solid #e2e8f0; padding:10px; text-align:left;">Sản phẩm</th>
              <th style="border:1px solid #e2e8f0; padding:10px; text-align:center; width:60px;">SL</th>
              <th style="border:1px solid #e2e8f0; padding:10px; text-align:right; width:100px;">Thành tiền</th>
            </tr>
            ${orderItems.map(item => `
              <tr>
                <td style="border:1px solid #e2e8f0; padding:10px;">${item.ten_san_pham}</td>
                <td style="border:1px solid #e2e8f0; padding:10px; text-align:center;">${item.quantity}</td>
                <td style="border:1px solid #e2e8f0; padding:10px; text-align:right;">${item.total.toLocaleString()}đ</td>
              </tr>
            `).join('')}
            <tr style="background:#f8fafc;">
              <td colspan="2" style="text-align:right; padding:12px; font-weight:700;">TỔNG CỘNG</td>
              <td style="text-align:right; padding:12px; color:${NAVY}; font-weight:700; font-size:15px;">${Number(totalAmount).toLocaleString()}đ</td>
            </tr>
          </table>
          <div style="margin-top:60px; display:flex; justify-content:space-between;">
            <div style="text-align:center; width:45%;">
              <p style="font-weight:600; color:#0f172a;">Chủ cửa hàng</p>
              <div style="height:60px;"></div>
              <p style="color:#64748b; font-size:12px;">(Ký và ghi rõ họ tên)</p>
            </div>
            <div style="text-align:center; width:45%;">
              <p style="font-weight:600; color:#0f172a;">Nhân viên kinh doanh</p>
              <div style="height:60px;"></div>
              <p style="color:#475569; font-size:12px;">${salesman?.ho_ten}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const totalQty = orderItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biên bản & hoàn tất</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <MaterialCommunityIcons name="store-check-outline" size={20} color={NAVY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryStoreName} numberOfLines={1}>{storeName}</Text>
              <Text style={styles.summaryDate}>{new Date().toLocaleDateString('vi-VN')}</Text>
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{Number(totalAmount).toLocaleString()}đ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Item list */}
          {orderItems.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.ten_san_pham}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemTotal}>{item.total.toLocaleString()}đ</Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { fontWeight: '600', color: '#0f172a' }]}>
              Tổng ({totalQty} sp)
            </Text>
            <Text style={[styles.itemTotal, { color: NAVY, fontSize: 15, fontWeight: '700' }]}>
              {Number(totalAmount).toLocaleString()}đ
            </Text>
          </View>
        </View>

        {/* Step 1: Export PDF */}
        <Text style={styles.stepLabel}>Bước 1 — Xuất biên bản</Text>
        <TouchableOpacity style={styles.pdfBtn} onPress={exportPDF} activeOpacity={0.85}>
          <View style={styles.pdfBtnIcon}>
            <MaterialCommunityIcons name="file-pdf-box" size={22} color="#16a34a" />
          </View>
          <Text style={styles.pdfBtnText}>Xuất biên bản PDF</Text>
          <Ionicons name="share-outline" size={18} color="#16a34a" />
        </TouchableOpacity>

        {/* Step 2: Photo */}
        <Text style={styles.stepLabel}>Bước 2 — Chụp ảnh xác nhận</Text>
        <TouchableOpacity
          style={styles.photoCard}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: '/route/order-photo',
              params: { id: storeId, name: storeName, totalAmount, cart },
            } as any)
          }
        >
          <View style={styles.camIconBox}>
            <Ionicons name="camera-outline" size={26} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoCardTitle}>Chụp ảnh biên bản đã ký</Text>
            <Text style={styles.photoCardSub}>Chụp để xác nhận chốt đơn hàng</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f6f8' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  backBtn:          { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:      { fontSize: 16, fontWeight: '600', color: '#0f172a' },

  content:          { padding: 18, paddingBottom: 40 },

  // Summary card
  summaryCard:      { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 16, marginBottom: 20 },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryIconBox:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center' },
  summaryStoreName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  summaryDate:      { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  totalBadge:       { backgroundColor: '#e8eef8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  totalBadgeText:   { fontSize: 13, fontWeight: '700', color: NAVY },

  divider:          { height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 10 },

  itemRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  itemName:         { flex: 1, fontSize: 13, color: '#475569' },
  itemQty:          { fontSize: 12, color: '#94a3b8', marginHorizontal: 10 },
  itemTotal:        { fontSize: 13, fontWeight: '500', color: '#0f172a' },

  // Step label
  stepLabel:        { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7, color: '#94a3b8', marginBottom: 10 },

  // PDF button
  pdfBtn:           { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  pdfBtnIcon:       { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  pdfBtnText:       { flex: 1, fontSize: 14, fontWeight: '500', color: '#0f172a' },

  // Photo card
  photoCard:        { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderStyle: 'dashed', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  camIconBox:       { width: 48, height: 48, borderRadius: 13, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center' },
  photoCardTitle:   { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 3 },
  photoCardSub:     { fontSize: 12, color: '#64748b' },
});