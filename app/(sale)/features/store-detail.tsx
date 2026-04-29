import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TaskCard, TaskConfig } from '../../../src/components/store/TaskCard';

const NAVY = '#1a3a6b';

const TASKS: TaskConfig[] = [
  {
    key: 'display',
    route: '/(sale)/features/display-photo',
    icon: 'camera-outline',
    iconLib: 'Ionicons',
    color: '#e8eef8',
    iconColor: NAVY,
    title: 'Trưng bày kệ hàng',
    sub: 'Chụp ảnh kệ hàng XAN tại quầy',
  },
  {
    key: 'order',
    route: '/(sale)/features/order',
    icon: 'cart-plus',
    iconLib: 'MaterialCommunityIcons',
    color: '#f0fdf4',
    iconColor: '#16a34a',
    title: 'Lên đơn hàng',
    sub: 'Chọn sản phẩm và tạo đơn mới',
  },
  {
    key: 'inventory',
    route: '/(sale)/features/inventory',
    icon: 'clipboard-check-outline',
    iconLib: 'MaterialCommunityIcons',
    color: '#f5f3ff',
    iconColor: '#7c3aed',
    title: 'Kiểm tồn kho',
    sub: 'Cập nhật số lượng thực tế tại quầy',
  },
  {
    key: 'history',
    route: '/(sale)/features/store-order-history',
    icon: 'history',
    iconLib: 'MaterialIcons',
    color: '#fffbeb',
    iconColor: '#b45309',
    title: 'Lịch sử đơn hàng',
    sub: 'Xem các đơn đã tạo cho shop này',
  },
];

export default function StoreDetailPage() {
  const { id, name, addr, dist } = useLocalSearchParams();
  const router = useRouter();

  const storeParams = {
    id: id as string,
    name: name as string,
    addr: addr as string,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.headerBrandText}>XAN Milk</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Store card */}
        <View style={styles.storeCard}>
          <View style={styles.storeCardTop}>
            <View style={styles.storeAvatarBox}>
              <MaterialCommunityIcons name="storefront-outline" size={22} color={NAVY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{name}</Text>
              <Text style={styles.storeAddr} numberOfLines={2}>{addr}</Text>
            </View>
          </View>
          <View style={styles.checkinBadge}>
            <View style={styles.checkinDot} />
            <Text style={styles.checkinBadgeText}>Đã check-in</Text>
          </View>
        </View>

        {/* Tasks */}
        <Text style={styles.sectionLabel}>Công việc tại shop</Text>

        <View style={styles.taskGrid}>
          {TASKS.map((task) => (
            <TaskCard key={task.key} task={task} storeParams={storeParams} />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer — Checkout */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Ionicons name="information-circle-outline" size={13} color="#94a3b8" />
          <Text style={styles.footerInfoText}>Chụp ảnh selfie + biển hiệu để xác thực checkout</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/(sale)/features/checkout-camera',
              params: { id, name, addr, dist },
            } as any)
          }
        >
          <MaterialIcons name="camera-front" size={20} color="#fff" />
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f6f8' },

  // Header
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  headerBrand:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBrandText:    { fontSize: 16, fontWeight: '700', color: NAVY, letterSpacing: 0.3 },

  content:            { padding: 18 },

  // Store card
  storeCard:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 16, marginBottom: 22 },
  storeCardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  storeAvatarBox:     { width: 44, height: 44, borderRadius: 11, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  storeName:          { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  storeAddr:          { fontSize: 12, color: '#64748b', lineHeight: 18 },
  checkinBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  checkinDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  checkinBadgeText:   { fontSize: 11, fontWeight: '600', color: '#16a34a' },

  // Section label
  sectionLabel:       { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7, color: '#94a3b8', marginBottom: 10 },

  // Tasks
  taskGrid:           { gap: 10 },

  // Footer
  footer:             { padding: 18, paddingBottom: Platform.OS === 'ios' ? 34 : 18, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)' },
  footerInfo:         { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 12 },
  footerInfoText:     { fontSize: 11, color: '#94a3b8', flex: 1 },
  checkoutBtn:        { backgroundColor: '#dc2626', height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  checkoutBtnText:    { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
});
