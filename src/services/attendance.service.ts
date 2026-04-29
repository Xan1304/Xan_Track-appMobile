import { supabase } from './supabase';

export const getMonthlyAttendance = async (maNV: string, year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data: checkins, error: checkinErr } = await supabase
    .from('lich_su_checkin')
    .select('thoi_gian, cua_hang_id, loai_hinh')
    .eq('nhan_vien_email', maNV)
    .gte('thoi_gian', startDate)
    .lte('thoi_gian', endDate);

  if (checkinErr) throw checkinErr;

  const { data: leaves, error: leaveErr } = await supabase
    .from('don_nghi_phep')
    .select('ngay_bat_dau, ngay_ket_thuc')
    .eq('nhan_vien_email', maNV)
    .in('trang_thai', ['Đã duyệt', 'da_duyet', 'approved']);

  if (leaveErr) throw leaveErr;

  const markedDates: Record<string, any> = {};
  const activitiesByDate: Record<string, Record<string, any[]>> = {};

  if (checkins) {
    checkins.forEach((ci) => {
      const dateKey = new Date(ci.thoi_gian).toISOString().split('T')[0];
      if (!activitiesByDate[dateKey]) {
        activitiesByDate[dateKey] = {};
      }
      if (ci.cua_hang_id) {
        if (!activitiesByDate[dateKey][ci.cua_hang_id]) {
          activitiesByDate[dateKey][ci.cua_hang_id] = [];
        }
        activitiesByDate[dateKey][ci.cua_hang_id].push(ci);
      }
    });
  }

  Object.keys(activitiesByDate).forEach((dateKey) => {
    let pairsCount = 0;
    Object.values(activitiesByDate[dateKey]).forEach(storeCheckins => {
      const hasCheckin = storeCheckins.some(c => c.loai_hinh === 'checkin');
      const hasCheckout = storeCheckins.some(c => c.loai_hinh === 'checkout');
      if (hasCheckin && hasCheckout) {
        pairsCount++;
      }
    });

    const storeCount = pairsCount;
    if (storeCount >= 3) {
      markedDates[dateKey] = { selected: true, selectedColor: '#22c55e', status: 'Đủ công', storeCount };
    } else if (storeCount > 0) {
      markedDates[dateKey] = { selected: true, selectedColor: '#f59e0b', status: 'Thiếu công', storeCount };
    }
  });

  if (leaves) {
    leaves.forEach((leave) => {
      if (!leave.ngay_bat_dau || !leave.ngay_ket_thuc) return;
      const start = new Date(leave.ngay_bat_dau);
      const end = new Date(leave.ngay_ket_thuc);
      let pDate = start;
      const mStartDate = new Date(year, month - 1, 1);
      const mEndDate = new Date(year, month, 0);

      while (pDate <= end) {
        if (pDate >= mStartDate && pDate <= mEndDate) {
          const dateStr = pDate.toISOString().split('T')[0];
          markedDates[dateStr] = { selected: true, selectedColor: '#3b82f6', status: 'Nghỉ phép', storeCount: 0 };
        }
        pDate.setDate(pDate.getDate() + 1);
      }
    });
  }

  return markedDates;
};
