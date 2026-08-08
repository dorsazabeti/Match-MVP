import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth";

export default function PublisherLayout() {
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (!isHydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== "PUBLISHER") {
    return <Redirect href="/business" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
