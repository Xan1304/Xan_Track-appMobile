import { supabase } from './supabase';

export class LeaveService {
  /**
   * Fetches all leave requests, ordered by creation date descending.
   */
  static async fetchRequests() {
    const { data, error } = await supabase
      .from('don_nghi_phep')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    return data || [];
  }

  /**
   * Updates the status of a leave request.
   */
  static async updateRequestStatus(id: string, status: 'da_duyet' | 'tu_choi') {
    const { error } = await supabase
      .from('don_nghi_phep')
      .update({ trang_thai: status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
