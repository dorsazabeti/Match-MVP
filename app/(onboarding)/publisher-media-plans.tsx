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
  createMediaPlan,
  deleteMediaPlan,
  getPublisherOnboardingOptions,
  listMediaPlans,
  listPlatformAccounts,
  updateMediaPlan,
} from "../../src/services/publisherOnboarding";
import { useAuthStore } from "../../src/store/auth";
import type {
  ContentTypeValue,
  MediaPlan,
  PlatformAccount,
  PublisherOnboardingOptions,
} from "../../src/types/publisherOnboarding";


export default function PublisherMediaPlansScreen() {
  const token = useAuthStore((state) => state.token);
  const [options, setOptions] = useState<PublisherOnboardingOptions | null>(null);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
  const [accountId, setAccountId] = useState("");
  const [contentType, setContentType] = useState<ContentTypeValue>("REEL");
  const [price, setPrice] = useState("");
  const [typicalViews, setTypicalViews] = useState("");
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
        const [loadedOptions, loadedAccounts, loadedPlans] = await Promise.all([
          getPublisherOnboardingOptions(token),
          listPlatformAccounts(token),
          listMediaPlans(token),
        ]);
        if (!isActive) {
          return;
        }
        setOptions(loadedOptions);
        setAccounts(loadedAccounts);
        setMediaPlans(loadedPlans);
        setAccountId(loadedAccounts[0]?.id ?? "");
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "تعرفه‌های شما دریافت نشد."
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
    setAccountId(accounts[0]?.id ?? "");
    setContentType("REEL");
    setPrice("");
    setTypicalViews("");
  }


  function startEditing(mediaPlan: MediaPlan) {
    setEditingId(mediaPlan.id);
    setAccountId(mediaPlan.platform_account_id);
    setContentType(mediaPlan.content_type);
    setPrice(mediaPlan.price);
    setTypicalViews(
      mediaPlan.typical_views === null
        ? ""
        : String(mediaPlan.typical_views)
    );
    setError(null);
  }


  async function handleSave() {
    if (!token) {
      setError("نشست شما منقضی شده است. دوباره وارد شوید.");
      return;
    }
    if (!accountId) {
      setError("ابتدا یک رسانه انتخاب کنید.");
      return;
    }

    const normalizedPrice = price.replace(/[٬,\s]/g, "");
    const parsedPrice = Number(normalizedPrice);
    const parsedViews = typicalViews.trim()
      ? Number(typicalViews.replace(/[٬,\s]/g, ""))
      : undefined;

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("قیمت استاندارد باید عددی بیشتر از صفر باشد.");
      return;
    }
    if (
      parsedViews !== undefined &&
      (!Number.isInteger(parsedViews) || parsedViews < 0)
    ) {
      setError("بازدید معمول باید عدد صحیح صفر یا بیشتر باشد.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const payload = {
        platform_account_id: accountId,
        content_type: contentType,
        price: normalizedPrice,
        typical_views: parsedViews,
      };

      if (editingId) {
        const updated = await updateMediaPlan(
          token,
          editingId,
          payload
        );
        setMediaPlans((current) =>
          current.map((item) => item.id === updated.id ? updated : item)
        );
      } else {
        const created = await createMediaPlan(token, payload);
        setMediaPlans((current) => [...current, created]);
      }
      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ذخیرهٔ تعرفه انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  function confirmDelete(mediaPlan: MediaPlan) {
    Alert.alert(
      "حذف تعرفه",
      "این تعرفه غیرفعال می‌شود و در پیشنهادهای جدید استفاده نخواهد شد.",
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
              await deleteMediaPlan(token, mediaPlan.id);
              setMediaPlans((current) =>
                current.filter((item) => item.id !== mediaPlan.id)
              );
              if (editingId === mediaPlan.id) {
                resetForm();
              }
            } catch (deleteError) {
              setError(
                deleteError instanceof Error
                  ? deleteError.message
                  : "حذف تعرفه انجام نشد."
              );
            }
          },
        },
      ]
    );
  }


  function accountLabel(id: string) {
    const account = accounts.find((item) => item.id === id);
    if (!account) {
      return "رسانه نامشخص";
    }
    const platformLabel = options?.platforms.find(
      (item) => item.value === account.platform
    )?.label ?? account.platform;
    return `${platformLabel} · @${account.handle}`;
  }


  function contentTypeLabel(value: ContentTypeValue) {
    return options?.content_types.find((item) => item.value === value)?.label
      ?? value;
  }


  function currencyLabel() {
    return options?.currency === "IRR"
      ? "ریال"
      : options?.currency ?? "";
  }


  if (isLoading) {
    return <LoadingScreen label="در حال دریافت تعرفه‌ها..." />;
  }

  return (
    <OnboardingScaffold
      step="مرحله ۳ از ۴"
      title="تعرفه‌های استاندارد"
      subtitle="قیمت واقعی هر نوع محتوا را ثبت کنید. Match بعداً بسته‌های منصفانه را با همین rate card می‌سازد."
    >
      {mediaPlans.length > 0 ? (
        <>
          <SectionTitle title="تعرفه‌های ثبت‌شده" />
          {mediaPlans.map((mediaPlan) => (
            <ResourceCard
              key={mediaPlan.id}
              title={contentTypeLabel(mediaPlan.content_type)}
              lines={[
                accountLabel(mediaPlan.platform_account_id),
                `${Number(mediaPlan.price).toLocaleString("fa-IR")} ${currencyLabel()}`,
                mediaPlan.typical_views === null
                  ? "بازدید معمول ثبت نشده"
                  : `${mediaPlan.typical_views.toLocaleString("fa-IR")} بازدید معمول`,
              ]}
              onEdit={() => startEditing(mediaPlan)}
              onDelete={() => confirmDelete(mediaPlan)}
            />
          ))}
        </>
      ) : (
        <SectionTitle
          title="هنوز تعرفه‌ای ثبت نشده"
          description="حداقل یک تعرفه لازم است تا ارزش رسانهٔ شما محاسبه شود."
        />
      )}

      <SectionTitle
        title={editingId ? "ویرایش تعرفه" : "افزودن تعرفه"}
      />
      <SectionTitle title="رسانه" />
      <ChoiceGrid>
        {accounts.map((account) => (
          <ChoiceChip
            key={account.id}
            label={accountLabel(account.id)}
            selected={accountId === account.id}
            onPress={() => setAccountId(account.id)}
          />
        ))}
      </ChoiceGrid>
      <SectionTitle title="نوع محتوا" />
      <ChoiceGrid>
        {options?.content_types.map((item) => (
          <ChoiceChip
            key={item.value}
            label={item.label}
            selected={contentType === item.value}
            onPress={() => setContentType(item.value)}
          />
        ))}
      </ChoiceGrid>
      <FormField
        label={`قیمت استاندارد (${currencyLabel()})`}
        placeholder="مثال: 25000000"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        editable={!isSubmitting}
      />
      <FormField
        label="بازدید معمول (اختیاری)"
        placeholder="مثال: 8000"
        value={typicalViews}
        onChangeText={setTypicalViews}
        keyboardType="number-pad"
        editable={!isSubmitting}
      />
      <ErrorMessage message={error} />
      <PrimaryButton
        label={editingId ? "ذخیرهٔ تغییرات" : "افزودن تعرفه"}
        onPress={handleSave}
        loading={isSubmitting}
        disabled={accounts.length < 1}
      />
      {editingId ? (
        <SecondaryButton label="انصراف از ویرایش" onPress={resetForm} />
      ) : null}
      <SecondaryButton
        label="ادامه و انتخاب علاقه‌مندی‌ها"
        onPress={() => router.replace("/publisher-preferences")}
        disabled={mediaPlans.length < 1 || isSubmitting}
      />
      <SecondaryButton
        label="بازگشت به رسانه‌ها"
        onPress={() => router.replace("/publisher-platforms")}
        disabled={isSubmitting}
      />
    </OnboardingScaffold>
  );
}
