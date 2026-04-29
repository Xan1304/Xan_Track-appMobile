import { supabase } from './supabase';

export class InventoryService {
  /**
   * Fetches products grouped with their last checked inventory quantity for a specific store.
   */
  static async fetchInventoryProducts(storeId: string) {
    const { data: prods, error: prodsError } = await supabase
      .from('danh_muc_san_pham')
      .select('*')
      .order('ten_san_pham', { ascending: true });

    if (prodsError) throw prodsError;

    const { data: lastHistory, error: historyError } = await supabase
      .from('lich_su_kiem_ton')
      .select('ten_san_pham, ton_kho_thuc_te, created_at')
      .eq('cua_hang_id', storeId)
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;

    const mapped = prods?.map(p => {
      const match = lastHistory?.find(h => h.ten_san_pham === p.ten_san_pham);
      return { ...p, lastCheckQty: match ? match.ton_kho_thuc_te : null };
    });

    return mapped || [];
  }

  /**
   * Saves stock check records to the database.
   */
  static async saveInventoryCheck(storeId: string, summaryItems: any[], stockData: Record<string, string>) {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email?.toLowerCase();
    
    if (!userEmail) {
      throw new Error('Phiên đăng nhập hết hạn.');
    }

    const inserts = summaryItems.map(p => ({
      cua_hang_id: storeId,
      nhan_vien_email: userEmail,
      ten_san_pham: p.ten_san_pham,
      ton_kho_thuc_te: parseInt(stockData[p.id]),
      ban_duoc_du_kien: p.lastCheckQty !== null
        ? (Number(p.lastCheckQty) - parseInt(stockData[p.id]))
        : 0,
    }));

    const { error } = await supabase.from('lich_su_kiem_ton').insert(inserts);
    if (error) throw error;
  }
}
