import React from "react";

import {
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


  async function handleRoleSelect(
    role: "BUSINESS" | "PUBLISHER"
  ) {

    if (!token) {
      return;
    }


    await selectRole(
      token,
      role
    );


    if (role === "BUSINESS") {
      router.push("/business");
      return;
    }


    router.push("/publisher");

  }


  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        چطور می‌خواهید از Match استفاده کنید؟
      </Text>


      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          handleRoleSelect("BUSINESS")
        }
      >
        <Text style={styles.buttonText}>
          کسب‌وکار هستم
        </Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          handleRoleSelect("PUBLISHER")
        }
      >
        <Text style={styles.buttonText}>
          ناشر هستم
        </Text>
      </TouchableOpacity>


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
  },


  buttonText: {
    color: theme.colors.surface,
    fontWeight: "bold",
  },

});
