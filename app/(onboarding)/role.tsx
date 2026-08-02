import React, { useState } from "react";

import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";

import { theme } from "../../src/theme";
import { selectRole } from "../../src/services/users";
import { useAuthStore } from "../../src/store/auth";


export default function RoleScreen() {

  const token = useAuthStore(
    (state) => state.token
  );
  const user = useAuthStore(
    (state) => state.user
  );
  const setUser = useAuthStore(
    (state) => state.setUser
  );
  const [selectedRole, setSelectedRole] = useState<
    "BUSINESS" | "PUBLISHER" | null
  >(null);
  const [error, setError] = useState<string | null>(null);


  async function handleRoleSelect(
    role: "BUSINESS" | "PUBLISHER"
  ) {

    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }

    try {
      setError(null);
      setSelectedRole(role);

      await selectRole(
        token,
        role
      );

      if (user) {
        setUser({
          ...user,
          role,
        });
      }

      if (role === "BUSINESS") {
        router.replace("/business");
        return;
      }

      router.replace("/publisher");
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "انتخاب نقش انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setSelectedRole(null);
    }
  }


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.step}>مرحله ۱ از ۲</Text>

        <Text style={styles.title}>
          چطور می‌خواهید از Match استفاده کنید؟
        </Text>

        <Text style={styles.subtitle}>
          تجربه شما بر اساس نقشی که انتخاب می‌کنید شخصی‌سازی می‌شود
        </Text>


        <TouchableOpacity
          style={[
            styles.button,
            selectedRole !== null && styles.buttonDisabled,
          ]}
          onPress={() =>
            handleRoleSelect("BUSINESS")
          }
          disabled={selectedRole !== null}
        >
          {selectedRole === "BUSINESS" ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.buttonText}>
              کسب‌وکار هستم
            </Text>
          )}
        </TouchableOpacity>


        <TouchableOpacity
          style={[
            styles.secondaryButton,
            selectedRole !== null && styles.buttonDisabled,
          ]}
          onPress={() =>
            handleRoleSelect("PUBLISHER")
          }
          disabled={selectedRole !== null}
        >
          {selectedRole === "PUBLISHER" ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>
              ناشر هستم
            </Text>
          )}
        </TouchableOpacity>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

      </View>
    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },

  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    padding: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.surface,
  },

  step: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: theme.spacing.m,
  },

  title: {
    ...theme.typography.h1,
    textAlign: "center",
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },

  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },

  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    marginBottom: theme.spacing.m,
    alignItems: "center",
    justifyContent: "center",
    minHeight: theme.layout.minTouchTarget,
  },

  secondaryButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: theme.layout.minTouchTarget,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    textAlign: "center",
  },


  buttonText: {
    color: theme.colors.surface,
    fontWeight: "bold",
  },

  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },

});
