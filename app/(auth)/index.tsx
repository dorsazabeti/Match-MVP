import React, { useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";

import { theme } from "../../src/theme";
import { loginUser, getCurrentUser } from "../../src/services/auth";
import { useAuthStore } from "../../src/store/auth";
export default function LoginScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const setToken = useAuthStore(
    (state) => state.setToken
  );

  const setUser = useAuthStore(
    (state) => state.setUser
  );


  async function handleLogin() {

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("ایمیل و رمز عبور را وارد کنید.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      const response = await loginUser(
        trimmedEmail,
        password
      );

      setToken(response.access_token);

      const user = await getCurrentUser(
        response.access_token
      );

      setUser(user);

      if (!user.role) {
        router.replace("/role");
        return;
      }

      if (user.role === "BUSINESS") {
        router.replace("/business");
        return;
      }

      if (user.role === "PUBLISHER") {
        router.replace("/publisher");
        return;
      }

      setError("نقش حساب کاربری معتبر نیست.");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "ورود انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        ورود به حساب کاربری
      </Text>


      <TextInput
        style={styles.input}
        placeholder="ایمیل خود را وارد کنید"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isSubmitting}
      />


      <TextInput
        style={styles.input}
        placeholder="رمز عبور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isSubmitting}
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.button,
          isSubmitting && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.surface} />
        ) : (
          <Text style={styles.buttonText}>
            ورود
          </Text>
        )}
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


  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: theme.layout.minTouchTarget,
  },

  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
    textAlign: "center",
  },

  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    minHeight: theme.layout.minTouchTarget,
  },

  buttonDisabled: {
    opacity: 0.6,
  },


  buttonText: {
    color: theme.colors.surface,
    fontWeight: "bold",
  },

});
