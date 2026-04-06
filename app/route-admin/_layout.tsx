import { Stack } from 'expo-router';

export default function RouteAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="add-store" />
      <Stack.Screen name="checkin-history" />
      <Stack.Screen name="inventory-report" />
      <Stack.Screen name="staff" />
    </Stack>
  );
}