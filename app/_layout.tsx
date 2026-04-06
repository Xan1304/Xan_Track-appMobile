import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data } = await supabase
          .from('ho_so_nhan_vien')
          .select('vai_tro')
          .eq('email', session.user.email)
          .single();
        setRole(data?.vai_tro || null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const inRouteGroup = segments[0] === 'route'; 
    // ✅ 1. KHAI BÁO BIẾN MỚI ĐỂ NHẬN DIỆN VÙNG HẬU CẦN ADMIN
    const inRouteAdminGroup = segments[0] === 'route-admin'; 

    if (!role && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } 
    // ✅ 2. CẬP NHẬT: ADMIN ĐƯỢC Ở TRONG (admin) HOẶC route-admin
    else if (role === 'admin' && !inAdminGroup && !inRouteAdminGroup) {
      router.replace('/(admin)' as any);
    } 
    else if (role === 'nhan_vien' && !inTabsGroup && !inRouteGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [role, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2168d8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Đang kiểm tra quyền truy cập...    </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="route" /> 
      {/* ✅ 3. ĐĂNG KÝ VỚI HỆ THỐNG LÀ CÓ THƯ MỤC NÀY NỮA NHÉ */}
      <Stack.Screen name="route-admin" /> 
    </Stack>
  );
}