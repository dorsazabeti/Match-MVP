import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { Stack } from "expo-router";

import { useAuthStore } from "../src/store/auth";
import { theme } from "../src/theme";

export default function RootLayout() {
  const hydrate = useAuthStore(
    (state) => state.hydrate
  );
  const isHydrated = useAuthStore(
    (state) => state.isHydrated
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
