import React, { useEffect, useState } from "react";
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
import { ApiError } from "../../src/services/api";
import { getBusinessProfile } from "../../src/services/profiles";
import {
  getPublisherOnboardingRoute,
  getPublisherOnboardingStatus,
} from "../../src/services/publisherOnboarding";
import { useAuthStore } from "../../src/store/auth";
export default function LoginScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const token = useAuthStore(
    (state) => state.token
  );
  const user = useAuthStore(
    (state) => state.user
  );
  const setSession = useAuthStore(
    (state) => state.setSession
  );

  useEffect(() => {
    if (!token || !user || isSubmitting) {
      return;
    }

    routeAuthenticatedUser(token, user.role).catch((routingError) => {
      setError(
        routingError instanceof Error
          ? routingError.message
          : "مرحلهٔ بعدی حساب مشخص نشد. دوباره تلاش کنید."
      );
    });
  }, [token, user, isSubmitting]);


  async function routeAuthenticatedUser(
    authToken: string,
    role: string | null
  ) {
    if (!role) {
      router.replace("/role");
      return;
    }

    if (role === "BUSINESS") {
      try {
        await getBusinessProfile(authToken);
        router.replace("/business");
      } catch (profileError) {
        if (profileError instanceof ApiError && profileError.status === 404) {
          router.replace("/business-profile");
          return;
        }
        throw profileError;
      }
      return;
    }

    if (role === "PUBLISHER") {
      const status = await getPublisherOnboardingStatus(authToken);
      router.replace(getPublisherOnboardingRoute(status.next_step));
      return;
    }

    throw new Error("نقش حساب کاربری معتبر نیست.");
  }


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

      const user = await getCurrentUser(
        response.access_token
      );

      await setSession(
        response.access_token,
        user
      );

      await routeAuthenticatedUser(
        response.access_token,
        user.role
      );
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
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.card}>
        <Text style={styles.brand}>MATCH</Text>

        <Text style={styles.title}>
          ورود به Match
        </Text>

        <Text style={styles.subtitle}>
          برای شروع همکاری تبلیغاتی وارد حساب خود شوید
        </Text>


        <Text style={styles.label}>ایمیل</Text>
        <TextInput
          style={styles.input}
          placeholder="ایمیل خود را وارد کنید"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />


        <Text style={styles.label}>رمز عبور</Text>
        <TextInput
          style={styles.input}
          placeholder="رمز عبور"
          placeholderTextColor={theme.colors.textSecondary}
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

        <View style={styles.authSwitchRow}>
          <Text style={styles.authSwitchText}>
            هنوز حساب ندارید؟
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/register")}
            accessibilityRole="link"
          >
            <Text style={styles.authSwitchLink}>
              ثبت‌نام در Match
            </Text>
          </TouchableOpacity>
        </View>

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
    overflow: "hidden",
  },

  glowTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -150,
    right: -90,
    backgroundColor: theme.colors.primarySoft,
  },

  glowBottom: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -130,
    left: -80,
    backgroundColor: "#F4E8FC",
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

  brand: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
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

  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: "right",
    marginBottom: theme.spacing.s,
    fontWeight: "600",
  },

  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: theme.layout.minTouchTarget,
    color: theme.colors.text,
    textAlign: "right",
    writingDirection: "rtl",
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

  authSwitchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.s,
    marginTop: theme.spacing.l,
  },

  authSwitchText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },

  authSwitchLink: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "700",
  },

});
