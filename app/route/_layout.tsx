import { Stack } from 'expo-router';

export default function RouteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="list" />
      <Stack.Screen name="checkin" />
      <Stack.Screen name="store-detail" />
    </Stack>
  );
}