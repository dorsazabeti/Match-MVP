import { useEffect, useState } from "react";
import { router } from "expo-router";

import {
  ErrorMessage,
  FormField,
  LoadingScreen,
  OnboardingScaffold,
  PrimaryButton,
} from "../../src/components/onboarding";
import {
  createPublisherBaseProfile,
  getPublisherOnboardingStatus,
  getPublisherProfile,
  updatePublisherProfile,
} from "../../src/services/publisherOnboarding";
import { useAuthStore } from "../../src/store/auth";


export default function PublisherProfileScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [publicName, setPublicName] = useState(
    user?.display_name ?? ""
  );
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      if (!token) {
        if (isActive) {
          setError("نشست شما منقضی شده است. دوباره وارد شوید.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const status = await getPublisherOnboardingStatus(token);
        if (!status.profile_exists) {
          return;
        }

        const profile = await getPublisherProfile(token);
        if (!isActive) {
          return;
        }
        setProfileExists(true);
        setPublicName(profile.public_name ?? user?.display_name ?? "");
        setBio(profile.bio ?? "");
        setCity(profile.city ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "اطلاعات پروفایل دریافت نشد."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isActive = false;
    };
  }, [token, user?.display_name]);


  async function handleSubmit() {
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }

    const normalizedName = publicName
      .trim()
      .split(/\s+/)
      .join(" ");
    const normalizedBio = bio.trim();
    const normalizedCity = city.trim();
    const normalizedAvatarUrl = avatarUrl.trim();

    if (normalizedName.length < 2) {
      setError("نام عمومی باید حداقل دو کاراکتر باشد.");
      return;
    }
    if (normalizedBio.length < 2) {
      setError("یک معرفی کوتاه دربارهٔ خودتان بنویسید.");
      return;
    }
    if (normalizedCity.length < 2) {
      setError("شهر فعالیت خود را وارد کنید.");
      return;
    }
    if (
      normalizedAvatarUrl &&
      !/^https?:\/\//i.test(normalizedAvatarUrl)
    ) {
      setError("آدرس تصویر باید با http:// یا https:// شروع شود.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const payload = {
        public_name: normalizedName,
        bio: normalizedBio,
        city: normalizedCity,
        avatar_url: normalizedAvatarUrl || undefined,
      };

      if (profileExists) {
        await updatePublisherProfile(token, {
          ...payload,
          avatar_url: normalizedAvatarUrl || null,
        });
      } else {
        await createPublisherBaseProfile(token, payload);
      }

      router.replace("/publisher-platforms");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ذخیرهٔ پروفایل انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return <LoadingScreen label="در حال دریافت پروفایل ناشر..." />;
  }

  return (
    <OnboardingScaffold
      step="مرحله ۱ از ۴"
      title="پروفایل عمومی شما"
      subtitle="این اطلاعات به کسب‌وکار کمک می‌کند قبل از ارسال دعوت، شما را بهتر بشناسد."
    >
      <FormField
        label="نام عمومی"
        placeholder="نامی که کسب‌وکارها می‌بینند"
        value={publicName}
        onChangeText={setPublicName}
        editable={!isSubmitting}
      />
      <FormField
        label="شهر فعالیت"
        placeholder="مثال: تهران"
        value={city}
        onChangeText={setCity}
        editable={!isSubmitting}
      />
      <FormField
        label="دربارهٔ شما"
        placeholder="حوزهٔ فعالیت و سبک محتوای خود را کوتاه معرفی کنید"
        value={bio}
        onChangeText={setBio}
        multiline
        editable={!isSubmitting}
      />
      <FormField
        label="آدرس تصویر پروفایل (اختیاری)"
        placeholder="https://example.com/avatar.jpg"
        value={avatarUrl}
        onChangeText={setAvatarUrl}
        autoCapitalize="none"
        keyboardType="url"
        editable={!isSubmitting}
      />
      <ErrorMessage message={error} />
      <PrimaryButton
        label="ذخیره و افزودن رسانه"
        onPress={handleSubmit}
        loading={isSubmitting}
      />
    </OnboardingScaffold>
  );
}
