import { supabase } from './supabase';

interface TuyenData {
  ten_tuyen: string;
}

export class StaffService {
  /**
   * Fetches all staff members and their assigned routes
   */
  static async fetchStaff() {
    const { data, error } = await supabase
      .from('ho_so_nhan_vien')
      .select('*, tuyen_ban_hang(ten_tuyen)')
      .eq('vai_tro', 'nhan_vien')
      .order('ho_ten', { ascending: true });

    if (error) throw error;

    return data?.map(item => {
      const tuyen = item.tuyen_ban_hang as unknown as TuyenData | TuyenData[];
      return {
        ...item,
        ten_tuyen_display: Array.isArray(tuyen)
          ? tuyen[0]?.ten_tuyen
          : tuyen?.ten_tuyen || 'Chưa gán địa bàn'
      };
    }) || [];
  }

  /**
   * Fetches all available routes
   */
  static async fetchRoutes() {
    const { data, error } = await supabase
      .from('tuyen_ban_hang')
      .select('*')
      .order('ten_tuyen', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Assigns a route to a staff member
   */
  static async assignRoute(staffId: string, routeId: string) {
    const { error } = await supabase
      .from('ho_so_nhan_vien')
      .update({ tuyen_id: routeId })
      .eq('id', staffId);

    if (error) throw error;
  }

  /**
   * Deletes a staff member, handling store unassignment and soft deletion fallback
   */
  static async deleteStaff(staffId: string, tuyenId: string | null) {
    if (tuyenId) {
      await supabase
        .from('danh_sach_cua_hang')
        .update({ tuyen_id: null })
        .eq('tuyen_id', tuyenId);
    }

    const { error: hardDeleteError } = await supabase
      .from('ho_so_nhan_vien')
      .delete()
      .eq('id', staffId);

    if (hardDeleteError) {
      const { error: softDeleteError } = await supabase
        .from('ho_so_nhan_vien')
        .update({ vai_tro: 'thoi_viec' })
        .eq('id', staffId);

      if (softDeleteError) throw softDeleteError;
    }
  }
}
