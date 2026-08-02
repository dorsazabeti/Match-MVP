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

      <Text style={styles.title}>
        چطور می‌خواهید از Match استفاده کنید؟
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
          styles.button,
          selectedRole !== null && styles.buttonDisabled,
        ]}
        onPress={() =>
          handleRoleSelect("PUBLISHER")
        }
        disabled={selectedRole !== null}
      >
        {selectedRole === "PUBLISHER" ? (
          <ActivityIndicator color={theme.colors.surface} />
        ) : (
          <Text style={styles.buttonText}>
            ناشر هستم
          </Text>
        )}
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

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


  title: {
    ...theme.typography.h1,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
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

});
