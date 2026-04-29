import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { OrderService } from '../services/order.service';

export function useOrder(storeId?: string) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await OrderService.fetchProducts();
      setProducts(data);
    } catch (error: any) {
      Alert.alert('Lỗi tải sản phẩm', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      (activeTab === 'Tất cả' || p.loai_san_pham === activeTab) &&
      p.ten_san_pham?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, activeTab, searchQuery]
  );

  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    Object.keys(cart).forEach(id => {
      const p = products.find(p => p.id === id);
      if (p) {
        totalItems += cart[id];
        totalPrice += p.gia_ban * cart[id];
      }
    });
    return { totalItems, totalPrice };
  }, [cart, products]);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[id] || 0) + delta);
      if (qty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: qty };
    });
  }, []);

  const calculateTotal = useCallback(() => {
    return cartSummary.totalPrice;
  }, [cartSummary]);

  return {
    products,
    filteredProducts,
    loading,
    cart,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    cartSummary,
    updateQty,
    updateQuantity: updateQty,
    calculateTotal,
    refresh: loadProducts,
  };
}