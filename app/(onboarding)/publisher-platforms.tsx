import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import {
  ChoiceChip,
  ChoiceGrid,
  ErrorMessage,
  FormField,
  LoadingScreen,
  OnboardingScaffold,
  PrimaryButton,
  ResourceCard,
  SecondaryButton,
  SectionTitle,
} from "../../src/components/onboarding";
import {
  createPlatformAccount,
  deletePlatformAccount,
  getPublisherOnboardingOptions,
  listPlatformAccounts,
  updatePlatformAccount,
} from "../../src/services/publisherOnboarding";
import { useAuthStore } from "../../src/store/auth";
import type {
  PlatformAccount,
  PlatformValue,
  PublisherOnboardingOptions,
} from "../../src/types/publisherOnboarding";


export default function PublisherPlatformsScreen() {
  const token = useAuthStore((state) => state.token);
  const [options, setOptions] = useState<PublisherOnboardingOptions | null>(null);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [platform, setPlatform] = useState<PlatformValue>("INSTAGRAM");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
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
        const [loadedOptions, loadedAccounts] = await Promise.all([
          getPublisherOnboardingOptions(token),
          listPlatformAccounts(token),
        ]);
        if (isActive) {
          setOptions(loadedOptions);
          setAccounts(loadedAccounts);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "رسانه‌های شما دریافت نشد."
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


  function resetForm() {
    setEditingId(null);
    setPlatform("INSTAGRAM");
    setHandle("");
    setProfileUrl("");
    setFollowersCount("");
  }


  function startEditing(account: PlatformAccount) {
    setEditingId(account.id);
    setPlatform(account.platform);
    setHandle(account.handle);
    setProfileUrl(account.profile_url);
    setFollowersCount(String(account.followers_count));
    setError(null);
  }


  async function handleSave() {
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }

    const normalizedHandle = handle.trim().replace(/^@/, "");
    const normalizedUrl = profileUrl.trim();
    const parsedFollowers = Number(followersCount);

    if (!normalizedHandle) {
      setError("شناسه یا نام کانال را وارد کنید.");
      return;
    }
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      setError("لینک پروفایل باید با http:// یا https:// شروع شود.");
      return;
    }
    if (
      followersCount.trim() === "" ||
      !Number.isInteger(parsedFollowers) ||
      parsedFollowers < 0
    ) {
      setError("تعداد دنبال‌کنندگان باید عدد صحیح صفر یا بیشتر باشد.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const payload = {
        platform,
        handle: normalizedHandle,
        profile_url: normalizedUrl,
        followers_count: parsedFollowers,
      };

      if (editingId) {
        const updated = await updatePlatformAccount(
          token,
          editingId,
          payload
        );
        setAccounts((current) =>
          current.map((item) => item.id === updated.id ? updated : item)
        );
      } else {
        const created = await createPlatformAccount(token, payload);
        setAccounts((current) => [...current, created]);
      }
      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ذخیرهٔ رسانه انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  function confirmDelete(account: PlatformAccount) {
    Alert.alert(
      "حذف رسانه",
      "تعرفه‌های فعال این رسانه نیز غیرفعال می‌شوند. ادامه می‌دهید؟",
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            if (!token) {
              return;
            }
            try {
              setError(null);
              await deletePlatformAccount(token, account.id);
              setAccounts((current) =>
                current.filter((item) => item.id !== account.id)
              );
              if (editingId === account.id) {
                resetForm();
              }
            } catch (deleteError) {
              setError(
                deleteError instanceof Error
                  ? deleteError.message
                  : "حذف رسانه انجام نشد."
              );
            }
          },
        },
      ]
    );
  }


  function platformLabel(value: PlatformValue) {
    return options?.platforms.find((item) => item.value === value)?.label
      ?? value;
  }


  if (isLoading) {
    return <LoadingScreen label="در حال دریافت رسانه‌ها..." />;
  }

  return (
    <OnboardingScaffold
      step="مرحله ۲ از ۴"
      title="رسانه‌های شما"
      subtitle="حداقل یک حساب یا کانال اضافه کنید. تعداد دنبال‌کننده فعلاً با اطلاعات شما ثبت می‌شود."
    >
      {accounts.length > 0 ? (
        <>
          <SectionTitle title="رسانه‌های ثبت‌شده" />
          {accounts.map((account) => (
            <ResourceCard
              key={account.id}
              title={`${platformLabel(account.platform)} · @${account.handle}`}
              lines={[
                `${account.followers_count.toLocaleString("fa-IR")} دنبال‌کننده`,
                account.profile_url,
              ]}
              onEdit={() => startEditing(account)}
              onDelete={() => confirmDelete(account)}
            />
          ))}
        </>
      ) : (
        <SectionTitle
          title="هنوز رسانه‌ای ثبت نشده"
          description="فرم زیر را کامل کنید تا اولین رسانه اضافه شود."
        />
      )}

      <SectionTitle
        title={editingId ? "ویرایش رسانه" : "افزودن رسانه"}
      />
      <ChoiceGrid>
        {options?.platforms.map((item) => (
          <ChoiceChip
            key={item.value}
            label={item.label}
            selected={platform === item.value}
            onPress={() => setPlatform(item.value)}
          />
        ))}
      </ChoiceGrid>
      <FormField
        label="شناسه یا نام کانال"
        placeholder="مثال: match_creator"
        value={handle}
        onChangeText={setHandle}
        autoCapitalize="none"
        editable={!isSubmitting}
      />
      <FormField
        label="لینک پروفایل یا کانال"
        placeholder="https://instagram.com/match_creator"
        value={profileUrl}
        onChangeText={setProfileUrl}
        autoCapitalize="none"
        keyboardType="url"
        editable={!isSubmitting}
      />
      <FormField
        label="تعداد دنبال‌کنندگان"
        placeholder="مثال: 12500"
        value={followersCount}
        onChangeText={setFollowersCount}
        keyboardType="number-pad"
        editable={!isSubmitting}
      />
      <ErrorMessage message={error} />
      <PrimaryButton
        label={editingId ? "ذخیرهٔ تغییرات" : "افزودن رسانه"}
        onPress={handleSave}
        loading={isSubmitting}
      />
      {editingId ? (
        <SecondaryButton label="انصراف از ویرایش" onPress={resetForm} />
      ) : null}
      <SecondaryButton
        label="ادامه و تعریف تعرفه"
        onPress={() => router.replace("/publisher-media-plans")}
        disabled={accounts.length < 1 || isSubmitting}
      />
      <SecondaryButton
        label="بازگشت به اطلاعات پایه"
        onPress={() => router.replace("/publisher")}
        disabled={isSubmitting}
      />
    </OnboardingScaffold>
  );
}
