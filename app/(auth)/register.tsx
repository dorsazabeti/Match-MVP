import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../../src/services/auth";
import { useAuthStore } from "../../src/store/auth";
import { theme } from "../../src/theme";


export default function RegisterScreen() {
  const setSession = useAuthStore(
    (state) => state.setSession
  );

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  async function handleRegister() {
    const normalizedName = displayName
      .trim()
      .split(/\s+/)
      .join(" ");
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("یک ایمیل معتبر وارد کنید.");
      return;
    }

    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    if (password !== confirmPassword) {
      setError("تکرار رمز عبور با رمز عبور یکسان نیست.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      await registerUser(
        normalizedName,
        normalizedEmail,
        password
      );

      const loginResponse = await loginUser(
        normalizedEmail,
        password
      );
      const user = await getCurrentUser(
        loginResponse.access_token
      );

      await setSession(
        loginResponse.access_token,
        user
      );

      router.replace("/role");
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "ثبت‌نام انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.brand}>MATCH</Text>
        <Text style={styles.title}>ساخت حساب کاربری</Text>
        <Text style={styles.subtitle}>
          ابتدا حساب خود را بسازید؛ انتخاب نقش در مرحله بعد انجام می‌شود
        </Text>

        <Text style={styles.label}>نام و نام خانوادگی</Text>
        <TextInput
          style={styles.input}
          placeholder="نام خود را وارد کنید"
          placeholderTextColor={theme.colors.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>ایمیل</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
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
          placeholder="حداقل ۸ کاراکتر"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isSubmitting}
        />

        <Text style={styles.label}>تکرار رمز عبور</Text>
        <TextInput
          style={styles.input}
          placeholder="رمز عبور را دوباره وارد کنید"
          placeholderTextColor={theme.colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.buttonText}>
              ثبت‌نام و ادامه
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="link"
        >
          <Text style={styles.loginLink}>
            حساب دارید؟ وارد شوید
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.s,
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
    minHeight: theme.layout.minTouchTarget,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    textAlign: "right",
    writingDirection: "rtl",
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.m,
  },
  button: {
    minHeight: theme.layout.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: "bold",
  },
  loginLink: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "700",
    marginTop: theme.spacing.l,
  },
});
