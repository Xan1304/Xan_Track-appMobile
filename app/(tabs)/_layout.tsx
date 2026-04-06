import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AdminTabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2463eb',
      headerShown: false,
      tabBarStyle: { height: 65, paddingBottom: 10, borderTopColor: '#f1f5f9' }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử đơn',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profilenv"
        options={{
          title: 'Thông tin',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}