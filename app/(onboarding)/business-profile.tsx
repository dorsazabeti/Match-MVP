import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { theme } from "../../src/theme";
import { useAuthStore } from "../../src/store/auth";
import { createBusinessProfile } from "../../src/services/profiles";
import { router } from "expo-router";


export default function BusinessProfileScreen() {

  const token = useAuthStore(
    (state) => state.token
  );

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  async function handleSubmit() {

    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    if (!trimmedName || !trimmedCategory) {
      setError("نام کسب‌وکار و دسته‌بندی الزامی هستند.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      await createBusinessProfile(
        token,
        {
          name: trimmedName,
          category: trimmedCategory,
          city: city.trim() || undefined,
          description: description.trim() || undefined,
        }
      );

      router.replace("/business/create-offer");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "ثبت اطلاعات کسب‌وکار انجام نشد. دوباره تلاش کنید."
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
        <Text style={styles.step}>مرحله ۲ از ۲</Text>

        <Text style={styles.title}>
          اطلاعات کسب‌وکار
        </Text>

        <Text style={styles.subtitle}>
          چند اطلاعات کوتاه برای ساخت پروفایل برند شما
        </Text>


        <Text style={styles.label}>نام کسب‌وکار</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: فروشگاه Match"
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
        />


        <Text style={styles.label}>دسته‌بندی</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: فناوری"
          placeholderTextColor={theme.colors.textSecondary}
          value={category}
          onChangeText={setCategory}
        />


        <Text style={styles.label}>شهر</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: تهران"
          placeholderTextColor={theme.colors.textSecondary}
          value={city}
          onChangeText={setCity}
        />


        <Text style={styles.label}>توضیحات کوتاه</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="کسب‌وکار خود را کوتاه معرفی کنید"
          placeholderTextColor={theme.colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.buttonText}>
              ساخت پروفایل کسب‌وکار
            </Text>
          )}
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

  successContainer: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },

  successText: {
    ...theme.typography.body,
    color: theme.colors.success,
    textAlign: "center",
  },

  card: {
    width: "100%",
    maxWidth: 520,
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

  successBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignSelf: "center",
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 52,
    textAlign: "center",
    marginBottom: theme.spacing.l,
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

  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
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
