import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter, usePathname } from 'expo-router';
// Import Theme để dùng màu NAVY đồng bộ
import { Theme } from '../../src/constants/Theme';
import { supabase } from '../../src/services/supabase';
import { useState, useEffect } from 'react';

async function getActiveCheckin(userEmail: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('lich_su_checkin')
    .select('cua_hang_id, loai_hinh, danh_sach_cua_hang(ten_cua_hang, dia_chi)')
    .eq('nhan_vien_email', userEmail)
    .gte('thoi_gian', todayStart.toISOString());

  if (!data) return null;

  const checkedInIds = data.filter(r => r.loai_hinh === 'checkin').map(r => r.cua_hang_id);
  const checkedOutIds = data.filter(r => r.loai_hinh === 'checkout').map(r => r.cua_hang_id);
  const activeId = checkedInIds.find(id => !checkedOutIds.includes(id));

  if (!activeId) return null;

  const activeRecord = data.find(r => r.cua_hang_id === activeId);
  const danhSach = activeRecord?.danh_sach_cua_hang as any;
  const storeData = Array.isArray(danhSach) ? danhSach[0] : danhSach;
  
  return {
    id: activeId,
    name: storeData?.ten_cua_hang,
    addr: storeData?.dia_chi
  };
}

export default function SaleTabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeStore, setActiveStore] = useState<any>(null);

  // Lấy dữ liệu ngầm (background fetch) mỗi khi chuyển trang để cập nhật cache
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        getActiveCheckin(session.user.email).then(setActiveStore);
      }
    });
  }, [pathname]);

  return (
    <Tabs screenOptions={{
      // Sử dụng màu NAVY từ file hằng số
      tabBarActiveTintColor: Theme.NAVY,
      headerShown: false,
      tabBarStyle: { height: 65, paddingBottom: 10, borderTopColor: '#f1f5f9' }
    }}>
      {/* 1. Tab Trang chủ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (activeStore) {
              // Dùng cache để điều hướng tức thì vào chi tiết, CHỈ chặn default khi có checkin
              e.preventDefault();
              router.push({
                pathname: '/(sale)/features/store-detail',
                params: { 
                  id: activeStore.id,
                  name: activeStore.name || 'Cửa hàng',
                  addr: activeStore.addr || '',
                  dist: 0
                }
              } as any);
            }
            // Nếu không có checkin, KHÔNG gọi e.preventDefault() để Tab chuyển mượt mà mặc định
          }
        }}
      />

      {/* 2. Tab Lịch sử đơn */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử đơn',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={color} />,
        }}
      />

      {/* 4. Tab Bảng công */}
      <Tabs.Screen
        name="(tabs)/calendar"
        options={{
          title: 'Bảng công',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
      {/* 3. Tab Thông tin cá nhân */}
      <Tabs.Screen
        name="profilenv"
        options={{
          title: 'Thông tin',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}

      />



      {/* 5. ẨN THƯ MỤC FEATURES KHỎI TAB BAR */}
      <Tabs.Screen
        name="features"
        options={{
          href: null, // Dòng này giúp ẩn nút bấm nhưng vẫn cho phép chuyển trang vào trong
        }}
      />
    </Tabs>
  );
}