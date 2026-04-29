import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export class CheckinService {
  /**
   * Uploads an image to the checkin bucket and saves the record in lich_su_checkin
   */
  static async submitCheckin(storeId: string, dist: number, capturedPhotoBase64: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email?.toLowerCase();
    
    if (!userEmail) throw new Error('Phiên đăng nhập hết hạn.');

    const fileName = `${user?.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('checkin')
      .upload(fileName, decode(capturedPhotoBase64), { contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('checkin').getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('lich_su_checkin').insert({
      nhan_vien_email: userEmail,
      cua_hang_id: storeId,
      image_url: publicUrl,
      khoang_cach: Math.round(dist),
      loai_hinh: 'checkin',
    });

    if (dbError) throw dbError;
    
    return publicUrl;
  }
}
