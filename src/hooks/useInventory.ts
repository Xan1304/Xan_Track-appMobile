import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { InventoryService } from '../services/inventory.service';

export function useInventory(storeId: string, storeName: string) {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [stockData, setStockData] = useState<{ [key: string]: string }>({});
  const [showSummary, setShowSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const data = await InventoryService.fetchInventoryProducts(storeId as string);
      setProducts(data);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      (activeTab === 'Tất cả' || p.loai_san_pham === activeTab) &&
      p.ten_san_pham.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, activeTab, searchQuery]
  );

  const summaryItems = useMemo(() =>
    products.filter(p => stockData[p.id] !== undefined && stockData[p.id] !== ''),
    [stockData, products]
  );

  const confirmSaveToDb = async () => {
    try {
      setIsSaving(true);
      
      await InventoryService.saveInventoryCheck(storeId as string, summaryItems, stockData);

      Alert.alert('Đã lưu', `Tồn kho ${storeName} đã được cập nhật.`);
      setShowSummary(false);
      router.back();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    products,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    stockData,
    setStockData,
    showSummary,
    setShowSummary,
    isSaving,
    filteredProducts,
    summaryItems,
    fetchProducts,
    confirmSaveToDb
  };
}
