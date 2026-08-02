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

import { createPublisherProfile } from "../../src/services/profiles";
import { useAuthStore } from "../../src/store/auth";
import { theme } from "../../src/theme";


function parseCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}


export default function PublisherProfileScreen() {

  const token = useAuthStore(
    (state) => state.token
  );

  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [contentCapabilities, setContentCapabilities] = useState("");
  const [personalInterests, setPersonalInterests] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);


  async function handleSubmit() {

    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }

    const trimmedBio = bio.trim();
    const trimmedCity = city.trim();
    const platformItems = parseCommaSeparatedValues(platforms);
    const capabilityItems = parseCommaSeparatedValues(contentCapabilities);
    const interestItems = parseCommaSeparatedValues(personalInterests);
    const parsedFollowersCount = Number(followersCount);

    if (!trimmedBio || !trimmedCity) {
      setError("بیوگرافی و شهر الزامی هستند.");
      return;
    }

    if (platformItems.length === 0) {
      setError("حداقل یک پلتفرم وارد کنید.");
      return;
    }

    if (
      followersCount.trim() === "" ||
      !Number.isInteger(parsedFollowersCount) ||
      parsedFollowersCount < 0
    ) {
      setError("تعداد دنبال‌کنندگان باید یک عدد صحیح صفر یا بیشتر باشد.");
      return;
    }

    if (capabilityItems.length === 0) {
      setError("حداقل یک توانایی تولید محتوا وارد کنید.");
      return;
    }

    if (interestItems.length < 3) {
      setError("حداقل سه علاقه شخصی را با ویرگول جدا کنید.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      await createPublisherProfile(
        token,
        {
          bio: trimmedBio,
          city: trimmedCity,
          platforms: { items: platformItems },
          followers_count: parsedFollowersCount,
          content_capabilities: { items: capabilityItems },
          personal_interests: { items: interestItems },
        }
      );

      setIsCreated(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "ثبت اطلاعات ناشر انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isCreated) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.card}>
          <Text style={styles.successBadge}>✓</Text>
          <Text style={styles.title}>پروفایل ناشر ساخته شد</Text>
          <Text style={styles.successText}>
            اطلاعات شما با موفقیت ثبت شد. مرحله بعدی تکمیل حساب‌های پلتفرم و تعرفه‌ها است.
          </Text>
        </View>
      </View>
    );
  }


  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.step}>مرحله ۲ از ۲</Text>

        <Text style={styles.title}>
          اطلاعات ناشر
        </Text>

        <Text style={styles.subtitle}>
          برای دریافت پیشنهادهای مرتبط، پروفایل رسانه‌ای خود را کامل کنید
        </Text>

        <Text style={styles.label}>درباره شما</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="درباره خودتان بنویسید"
          placeholderTextColor={theme.colors.textSecondary}
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <Text style={styles.label}>شهر</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: تهران"
          placeholderTextColor={theme.colors.textSecondary}
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>پلتفرم‌ها</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: Instagram, Telegram"
          placeholderTextColor={theme.colors.textSecondary}
          value={platforms}
          onChangeText={setPlatforms}
          autoCapitalize="none"
        />

        <Text style={styles.label}>تعداد دنبال‌کنندگان</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: 12500"
          placeholderTextColor={theme.colors.textSecondary}
          value={followersCount}
          onChangeText={setFollowersCount}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>توانایی‌های تولید محتوا</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: Review, Tutorial"
          placeholderTextColor={theme.colors.textSecondary}
          value={contentCapabilities}
          onChangeText={setContentCapabilities}
        />

        <Text style={styles.label}>علاقه‌مندی‌های شخصی</Text>
        <TextInput
          style={styles.input}
          placeholder="حداقل سه مورد؛ مثال: Travel, Food, Tech"
          placeholderTextColor={theme.colors.textSecondary}
          value={personalInterests}
          onChangeText={setPersonalInterests}
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
              ساخت پروفایل ناشر
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

  successText: {
    ...theme.typography.body,
    color: theme.colors.success,
    textAlign: "center",
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

  multilineInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },

  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
    textAlign: "center",
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

});
