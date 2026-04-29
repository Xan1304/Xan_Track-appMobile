import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export const DisplayService = {
    async submitDisplayPhoto(storeId: string, base64Image: string, distance: number) {
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email?.toLowerCase();
        const fileName = `display/${storeId}/${Date.now()}.jpg`;

        // 1. Upload ảnh lên Storage
        const { error: uploadError } = await supabase.storage
            .from('checkin')
            .upload(fileName, decode(base64Image), { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('checkin').getPublicUrl(fileName);

        // 2. Insert vào bảng lịch sử (Cột khoang_cach đã được thêm)
        const { error: dbError } = await supabase.from('lich_su_checkin').insert({
            nhan_vien_email: userEmail,
            cua_hang_id: storeId,
            image_url: publicUrl,
            loai_hinh: 'trung_bay',
            khoang_cach: distance, // Lưu khoảng cách thực tế tại đây
            thoi_gian: new Date().toISOString()
        });

        if (dbError) throw dbError;
    }
};