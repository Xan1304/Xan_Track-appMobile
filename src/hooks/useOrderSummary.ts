import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { OrderService } from '../services/order.service';
import { supabase } from '../services/supabase';
import { getInvoiceHTML } from '../utils/templates/invoiceTemplate';

// ─── Haversine Distance ───────────────────────────────────────────────────────
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  ten_san_pham: string;
  gia_ban: number;
  quantity: number;
  total: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOrderSummary(
  storeId: string,
  storeName: string,
  storeAddr: string,
  totalAmount: string,
  cart: string
) {
  const router = useRouter();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [salesmanName, setSalesmanName] = useState<string>('Nhân viên XAN');
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Parse cart once ─────────────────────────────────────────────────────────
  const parsedCart: Record<string, number> = (() => {
    try {
      return cart ? JSON.parse(cart) : {};
    } catch {
      return {};
    }
  })();

  const totalQty = orderItems.reduce((s, i) => s + i.quantity, 0);

  // ── Fetch summary data + GPS ────────────────────────────────────────────────
  const fetchSummaryData = useCallback(async () => {
    try {
      setLoading(true);

      const cartItemIds = Object.keys(parsedCart);

      // 1. Salesman profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: profile } = await supabase
          .from('ho_so_nhan_vien')
          .select('ho_ten')
          .eq('email', user.email)
          .single();
        if (profile?.ho_ten) setSalesmanName(profile.ho_ten);
      }

      // 2. Product details (via OrderService — reuses fetchProducts catalog)
      let items: OrderItem[] = [];
      if (cartItemIds.length > 0) {
        const { data: products } = await supabase
          .from('danh_muc_san_pham')
          .select('id, ten_san_pham, gia_ban')
          .in('id', cartItemIds);

        items = (products ?? []).map(p => ({
          ...p,
          quantity: parsedCart[p.id] ?? 0,
          total: p.gia_ban * (parsedCart[p.id] ?? 0),
        }));
        setOrderItems(items);
      }

      // 3. Store coordinates (via Supabase directly — device-agnostic)
      const { data: store } = await supabase
        .from('danh_sach_cua_hang')
        .select('lat, lng')
        .eq('id', storeId)
        .single();

      // 4. GPS — device logic stays in the hook layer
      if (store?.lat && store?.lng) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const dist = calculateDistance(
            loc.coords.latitude,
            loc.coords.longitude,
            store.lat,
            store.lng
          );
          setDistance(Math.round(dist));
        }
      }
    } catch (err: any) {
      console.error('[useOrderSummary] fetchSummaryData error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, cart]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const html = getInvoiceHTML({
        storeName,
        salesmanName,
        orderItems,
        totalAmount: Number(totalAmount),
      });
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (err: any) {
      Alert.alert('Lỗi xuất PDF', err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── Navigate to order-photo carrying GPS distance ───────────────────────────
  const handleConfirmOrder = () => {
    if (Object.keys(parsedCart).length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi xác nhận.');
      return;
    }
    router.push({
      pathname: '/(sale)/features/order-photo',
      params: {
        id: storeId,
        name: storeName,
        addr: storeAddr,
        totalAmount,
        cart,
        khoang_cach: distance ?? 0,
      },
    } as any);
  };

  return {
    // Data
    orderItems,
    salesmanName,
    distance,
    totalQty,
    parsedCart,
    // States
    loading,
    isGeneratingPdf,
    // Actions
    exportPDF,
    handleConfirmOrder,
    refresh: fetchSummaryData,
  };
}
