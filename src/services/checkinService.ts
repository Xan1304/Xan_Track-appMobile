import { supabase } from './supabase';

export interface FilterMonth {
  label: string;
  month: number;
  year: number;
}

export interface Staff {
  email: string;
  ho_ten: string;
}

export interface CheckinHistoryItem {
  id: string;
  loai_hinh: string;
  thoi_gian: string;
  khoang_cach: number;
  nhan_vien_email: string;
  image_url?: string;
  cua_hang_id?: string;
  danh_sach_cua_hang?: {
    ten_cua_hang: string;
    dia_chi: string;
  };
  ho_so_nhan_vien?: {
    ho_ten: string;
  };
}

export const checkinService = {
  fetchStaffList: async (): Promise<Staff[]> => {
    const { data, error } = await supabase
      .from('ho_so_nhan_vien')
      .select('email, ho_ten')
      .eq('chuc_vu', 'Sale');
    if (error) throw error;
    return data || [];
  },

  fetchHistory: async (selectedMonth: FilterMonth, selectedStaff: string | null, selectedType: string): Promise<CheckinHistoryItem[]> => {
    const startOfMonth = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0);
    const endOfMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59);

    let query = supabase
      .from('lich_su_checkin')
      .select('*, danh_sach_cua_hang(ten_cua_hang, dia_chi), ho_so_nhan_vien(ho_ten)')
      .gte('thoi_gian', startOfMonth.toISOString())
      .lte('thoi_gian', endOfMonth.toISOString())
      .order('thoi_gian', { ascending: false });

    if (selectedStaff) query = query.eq('nhan_vien_email', selectedStaff);
    if (selectedType !== 'all') query = query.eq('loai_hinh', selectedType);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};
