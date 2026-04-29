import { Stack } from 'expo-router';

export default function RouteAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="add-store" />
      <Stack.Screen name="assign-stores" />
      <Stack.Screen name="checkin-history" />
      <Stack.Screen name="inventory-report" />
      <Stack.Screen name="leave-requests" />
      <Stack.Screen name="manage-routes" />
      <Stack.Screen name="manage-routes-stores" />
      <Stack.Screen name="manage-stores" />
      <Stack.Screen name="rescue-dispatch" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="store-form" />
    </Stack>
  );
}
