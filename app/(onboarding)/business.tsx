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
  const [isCreated, setIsCreated] = useState(false);


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

      setIsCreated(true);
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

  if (isCreated) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.title}>پروفایل کسب‌وکار ساخته شد</Text>
        <Text style={styles.successText}>
          اطلاعات شما با موفقیت ثبت شد. مرحله بعدی ساخت پیشنهاد همکاری است.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >

      <Text style={styles.title}>
        اطلاعات کسب‌وکار
      </Text>


      <TextInput
        style={styles.input}
        placeholder="نام کسب‌وکار"
        value={name}
        onChangeText={setName}
      />


      <TextInput
        style={styles.input}
        placeholder="دسته‌بندی"
        value={category}
        onChangeText={setCategory}
      />


      <TextInput
        style={styles.input}
        placeholder="شهر"
        value={city}
        onChangeText={setCity}
      />


      <TextInput
        style={styles.input}
        placeholder="توضیحات"
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
            ثبت اطلاعات
          </Text>
        )}
      </TouchableOpacity>

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
