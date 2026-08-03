import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import {
  ChoiceChip,
  ChoiceGrid,
  ErrorMessage,
  LoadingScreen,
  OnboardingScaffold,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from "../../src/components/onboarding";
import {
  getPublisherCapabilities,
  getPublisherInterests,
  getPublisherOnboardingOptions,
  getPublisherOnboardingRoute,
  getPublisherOnboardingStatus,
  replacePublisherCapabilities,
  replacePublisherInterests,
} from "../../src/services/publisherOnboarding";
import { useAuthStore } from "../../src/store/auth";
import { theme } from "../../src/theme";
import type {
  CapabilityValue,
  PublisherOnboardingOptions,
} from "../../src/types/publisherOnboarding";


export default function PublisherPreferencesScreen() {
  const token = useAuthStore((state) => state.token);
  const [options, setOptions] = useState<PublisherOnboardingOptions | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set()
  );
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    Set<CapabilityValue>
  >(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let isActive = true;

    async function loadData() {
      if (!token) {
        if (isActive) {
          setError("نشست شما منقضی شده است. دوباره وارد شوید.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const [loadedOptions, interests, capabilities] = await Promise.all([
          getPublisherOnboardingOptions(token),
          getPublisherInterests(token),
          getPublisherCapabilities(token),
        ]);
        if (!isActive) {
          return;
        }
        setOptions(loadedOptions);
        setSelectedInterests(
          new Set(interests.categories.map((item) => item.id))
        );
        setSelectedCapabilities(new Set(capabilities.capabilities));
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "گزینه‌های پروفایل دریافت نشد."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isActive = false;
    };
  }, [token]);


  function toggleInterest(categoryId: string) {
    setSelectedInterests((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }


  function toggleCapability(capability: CapabilityValue) {
    setSelectedCapabilities((current) => {
      const next = new Set(current);
      if (next.has(capability)) {
        next.delete(capability);
      } else {
        next.add(capability);
      }
      return next;
    });
  }


  async function handleComplete() {
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }
    if (selectedInterests.size < 3) {
      setError("حداقل سه علاقه‌مندی شخصی انتخاب کنید.");
      return;
    }
    if (selectedCapabilities.size < 1) {
      setError("حداقل یک توانایی تولید محتوا انتخاب کنید.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      // Sequential writes ensure the final discoverability calculation sees
      // both complete preference sets instead of racing two transactions.
      await replacePublisherInterests(
        token,
        Array.from(selectedInterests)
      );
      await replacePublisherCapabilities(
        token,
        Array.from(selectedCapabilities)
      );

      const status = await getPublisherOnboardingStatus(token);
      if (!status.discoverable) {
        setError(
          "پروفایل هنوز کامل نیست. شما را به مرحلهٔ باقی‌مانده هدایت می‌کنیم."
        );
        router.replace(getPublisherOnboardingRoute(status.next_step));
        return;
      }
      router.replace("/publisher-complete");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ذخیرهٔ علاقه‌مندی‌ها انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return <LoadingScreen label="در حال دریافت علاقه‌مندی‌ها..." />;
  }

  return (
    <OnboardingScaffold
      step="مرحله ۴ از ۴"
      title="ترجیحات همکاری"
      subtitle="علاقهٔ شخصی شما مستقل از موضوع مخاطبان است و به Match کمک می‌کند پیشنهادهایی بدهد که واقعاً برایتان ارزشمندند."
    >
      <SectionTitle
        title="علاقه‌مندی‌های شخصی"
        description="حداقل سه مورد انتخاب کنید."
      />
      <Text
        style={[
          styles.counter,
          selectedInterests.size >= 3 && styles.completeCounter,
        ]}
      >
        {selectedInterests.size.toLocaleString("fa-IR")} مورد انتخاب شده
      </Text>
      <ChoiceGrid>
        {options?.categories.map((category) => (
          <ChoiceChip
            key={category.id}
            label={category.name}
            selected={selectedInterests.has(category.id)}
            onPress={() => toggleInterest(category.id)}
          />
        ))}
      </ChoiceGrid>

      <SectionTitle
        title="توانایی‌های تولید محتوا"
        description="حداقل یک فرمت یا سبک را انتخاب کنید."
      />
      <Text
        style={[
          styles.counter,
          selectedCapabilities.size >= 1 && styles.completeCounter,
        ]}
      >
        {selectedCapabilities.size.toLocaleString("fa-IR")} مورد انتخاب شده
      </Text>
      <ChoiceGrid>
        {options?.capabilities.map((capability) => (
          <ChoiceChip
            key={capability.value}
            label={capability.label}
            selected={selectedCapabilities.has(capability.value)}
            onPress={() => toggleCapability(capability.value)}
          />
        ))}
      </ChoiceGrid>

      <ErrorMessage message={error} />
      <PrimaryButton
        label="تکمیل پروفایل ناشر"
        onPress={handleComplete}
        loading={isSubmitting}
      />
      <SecondaryButton
        label="بازگشت به تعرفه‌ها"
        onPress={() => router.replace("/publisher-media-plans")}
        disabled={isSubmitting}
      />
    </OnboardingScaffold>
  );
}


const styles = StyleSheet.create({
  counter: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginBottom: theme.spacing.m,
  },
  completeCounter: {
    color: theme.colors.success,
    fontWeight: "700",
  },
});
