import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export const OrderService = {
  /**
   * Lấy danh mục sản phẩm từ Supabase
   */
  async fetchProducts() {
    const { data, error } = await supabase
      .from('danh_muc_san_pham')
      .select('*')
      .order('ten_san_pham', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Lưu đơn hàng, upload ảnh và chi tiết sản phẩm
   */
  async submitOrder(storeId: string, totalAmount: number, cart: string, photoBase64: string, distance: number) {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email?.toLowerCase();
    if (!userEmail) throw new Error('Không tìm thấy phiên đăng nhập.');

    const fileName = `orders/${storeId}/${Date.now()}.jpg`;

    // 1. Upload ảnh bằng chứng
    const { error: uploadError } = await supabase.storage
      .from('checkin')
      .upload(fileName, decode(photoBase64), { contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('checkin').getPublicUrl(fileName);

    // 2. Lưu đơn hàng doanh thu (Kèm khoảng cách GPS)
    const { data: orderData, error: orderError } = await supabase
      .from('don_hang_doanh_thu')
      .insert({
        nhan_vien_email: userEmail,
        cua_hang_id: storeId,
        tong_tien: totalAmount,
        image_url: publicUrl,
      })
      .select();
    if (orderError) throw orderError;

    // 3. Lưu chi tiết từng sản phẩm trong giỏ hàng
    if (cart) {
      const parsedCart = JSON.parse(cart);
      const productIds = Object.keys(parsedCart);
      const { data: products } = await supabase.from('danh_muc_san_pham').select('*').in('id', productIds);

      if (products) {
        const details = products.map(p => ({
          order_id: orderData[0].id,
          ten_san_pham: p.ten_san_pham,
          so_luong: parsedCart[p.id],
          gia_ban: p.gia_ban,
        }));
        await supabase.from('chi_tiet_don_hang').insert(details);
      }
    }
    return orderData[0].id;
  }
};