import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const NAVY = '#1a3a6b';

const TASKS = [
  {
    key: 'display',
    route: '/route/display-photo',
    icon: 'camera-outline' as const,
    iconLib: 'Ionicons',
    color: '#e8eef8',
    iconColor: NAVY,
    title: 'Trưng bày kệ hàng',
    sub: 'Chụp ảnh kệ hàng XAN tại quầy',
  },
  {
    key: 'order',
    route: '/route/order',
    icon: 'cart-plus' as const,
    iconLib: 'MaterialCommunityIcons',
    color: '#f0fdf4',
    iconColor: '#16a34a',
    title: 'Lên đơn hàng',
    sub: 'Chọn sản phẩm và tạo đơn mới',
  },
  {
    key: 'inventory',
    route: '/route/inventory',
    icon: 'clipboard-check-outline' as const,
    iconLib: 'MaterialCommunityIcons',
    color: '#f5f3ff',
    iconColor: '#7c3aed',
    title: 'Kiểm tồn kho',
    sub: 'Cập nhật số lượng thực tế tại quầy',
  },
  {
    key: 'history',
    route: '/route/store-order-history',
    icon: 'history' as const,
    iconLib: 'MaterialIcons',
    color: '#fffbeb',
    iconColor: '#b45309',
    title: 'Lịch sử đơn hàng',
    sub: 'Xem các đơn đã tạo cho shop này',
  },
];

function TaskIcon({ task }: { task: typeof TASKS[0] }) {
  if (task.iconLib === 'Ionicons') return <Ionicons name={task.icon as any} size={22} color={task.iconColor} />;
  if (task.iconLib === 'MaterialIcons') return <MaterialIcons name={task.icon as any} size={22} color={task.iconColor} />;
  return <MaterialCommunityIcons name={task.icon as any} size={22} color={task.iconColor} />;
}

export default function StoreDetailPage() {
  const { id, name, addr, dist } = useLocalSearchParams();
  const router = useRouter();

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
            <TouchableOpacity
              key={task.key}
              style={styles.taskCard}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: task.route as any,
                  params: { id, name, addr },
                } as any)
              }
            >
              <View style={[styles.taskIconBox, { backgroundColor: task.color }]}>
                <TaskIcon task={task} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSub}>{task.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
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
              pathname: '/route/checkout-camera',
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
  taskCard:           { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  taskIconBox:        { width: 44, height: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  taskTitle:          { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  taskSub:            { fontSize: 11, color: '#94a3b8' },

  // Footer
  footer:             { padding: 18, paddingBottom: Platform.OS === 'ios' ? 34 : 18, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)' },
  footerInfo:         { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 12 },
  footerInfoText:     { fontSize: 11, color: '#94a3b8', flex: 1 },
  checkoutBtn:        { backgroundColor: '#dc2626', height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  checkoutBtnText:    { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
});