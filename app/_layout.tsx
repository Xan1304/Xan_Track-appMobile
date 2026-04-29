import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../src/services/supabase';

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
    const inSaleGroup = segments[0] === '(sale)';
    const inManageGroup = segments[0] === '(manage)';

    if (!role && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } 
    else if (role === 'admin' && !inManageGroup) {
      router.replace('/(manage)' as any);
    } 
    else if (role === 'nhan_vien' && !inSaleGroup) {
      router.replace('/(sale)' as any);
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
      <Stack.Screen name="(sale)" />
      <Stack.Screen name="(manage)" />
    </Stack>
  );
}


