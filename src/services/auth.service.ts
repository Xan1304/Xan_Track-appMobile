import { supabase } from './supabase';

export class AuthService {
  /**
   * Translates active session into ho_so_nhan_vien data
   */
  static async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('ho_so_nhan_vien')
      .select('*')
      .eq('email', user.email)
      .single();
      
    if (error) throw error;
    return data;
  }

  /**
   * Logs in a user using their ma_nhan_vien by finding their email first
   */
  static async loginWithMaNV(maNV: string, pass: string) {
    // Lookup email by ma_nhan_vien
    const { data: profile, error: searchError } = await supabase
      .from('ho_so_nhan_vien')
      .select('email')
      .eq('ma_nhan_vien', maNV.toUpperCase().trim())
      .single();

    if (searchError || !profile) {
      throw new Error('Mã nhân viên không tồn tại trong hệ thống!');
    }

    // Login with Supabase Auth
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: pass,
    });

    if (loginError) {
      throw new Error('Mật khẩu không chính xác, vui lòng thử lại.');
    }
  }

  /**
   * Logs out the active user
   */
  static async logout() {
    await supabase.auth.signOut();
  }
}
