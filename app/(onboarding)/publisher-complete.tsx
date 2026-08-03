import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import {
  ErrorMessage,
  LoadingScreen,
  OnboardingScaffold,
  SecondaryButton,
} from "../../src/components/onboarding";
import {
  getPublisherOnboardingRoute,
  getPublisherOnboardingStatus,
  getPublisherProfile,
} from "../../src/services/publisherOnboarding";
import { useAuthStore } from "../../src/store/auth";
import { theme } from "../../src/theme";
import type {
  PublisherOnboardingStatus,
  PublisherProfile,
} from "../../src/types/publisherOnboarding";


export default function PublisherCompleteScreen() {
  const token = useAuthStore((state) => state.token);
  const [status, setStatus] = useState<PublisherOnboardingStatus | null>(null);
  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let isActive = true;

    async function loadSummary() {
      if (!token) {
        if (isActive) {
          setError("نشست شما منقضی شده است. دوباره وارد شوید.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const [loadedStatus, loadedProfile] = await Promise.all([
          getPublisherOnboardingStatus(token),
          getPublisherProfile(token),
        ]);
        if (!isActive) {
          return;
        }
        if (!loadedStatus.discoverable) {
          if (loadedStatus.next_step !== "COMPLETE") {
            router.replace(
              getPublisherOnboardingRoute(loadedStatus.next_step)
            );
            return;
          }
          setError("پروفایل شما در حال حاضر فعال و قابل نمایش نیست.");
        }
        setStatus(loadedStatus);
        setProfile(loadedProfile);
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "خلاصهٔ پروفایل دریافت نشد."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();
    return () => {
      isActive = false;
    };
  }, [token]);


  if (isLoading) {
    return <LoadingScreen label="در حال بررسی نهایی پروفایل..." />;
  }

  return (
    <OnboardingScaffold
      step="پروفایل کامل شد"
      title={`تبریک ${profile?.public_name ?? ""}`.trim()}
      subtitle="پروفایل شما شرایط دریافت پیشنهادهای همکاری را دارد. صفحهٔ Discover در مرحلهٔ بعدی محصول اضافه می‌شود."
    >
      <View style={styles.successBadge}>
        <Text style={styles.successBadgeText}>✓</Text>
      </View>
      <Text style={styles.successText}>
        پروفایل شما قابل پیشنهاد به کسب‌وکارهای مرتبط است
      </Text>
      <View style={styles.statsGrid}>
        <StatCard
          value={status?.active_platform_accounts ?? 0}
          label="رسانه فعال"
        />
        <StatCard
          value={status?.active_media_plans ?? 0}
          label="تعرفه فعال"
        />
        <StatCard
          value={status?.interests_count ?? 0}
          label="علاقه‌مندی"
        />
        <StatCard
          value={status?.capabilities_count ?? 0}
          label="توانایی محتوا"
        />
      </View>
      <ErrorMessage message={error} />
      <SecondaryButton
        label="ویرایش علاقه‌مندی‌ها"
        onPress={() => router.replace("/publisher-preferences")}
      />
      <SecondaryButton
        label="ویرایش تعرفه‌ها"
        onPress={() => router.replace("/publisher-media-plans")}
      />
      <SecondaryButton
        label="ویرایش رسانه‌ها"
        onPress={() => router.replace("/publisher-platforms")}
      />
      <SecondaryButton
        label="ویرایش اطلاعات پایه"
        onPress={() => router.replace("/publisher")}
      />
    </OnboardingScaffold>
  );
}


function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value.toLocaleString("fa-IR")}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  successBadge: {
    width: 64,
    height: 64,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: theme.colors.primarySoft,
    marginBottom: theme.spacing.m,
  },
  successBadgeText: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: "900",
  },
  successText: {
    ...theme.typography.body,
    color: theme.colors.success,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: theme.spacing.l,
  },
  statsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },
  statCard: {
    minWidth: "47%",
    flexGrow: 1,
    alignItems: "center",
    padding: theme.spacing.m,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.background,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
