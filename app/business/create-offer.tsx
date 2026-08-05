import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { ErrorScreen, LoadingScreen } from "../../src/components/onboarding";
import { OfferForm } from "../../src/features/offers/OfferForm";
import {
  createOffer,
  getOfferOptions,
  uploadOfferImage,
} from "../../src/services/offers";
import { useAuthStore } from "../../src/store/auth";
import type {
  LocalOfferImage,
  OfferOptions,
  OfferWritePayload,
} from "../../src/types/offers";


export default function CreateOfferScreen() {
  const token = useAuthStore((state) => state.token);
  const [options, setOptions] = useState<OfferOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOptions = useCallback(() => {
    setLoadError(null);
    getOfferOptions()
      .then(setOptions)
      .catch((error) => setLoadError(
        error instanceof Error ? error.message : "گزینه‌های فرم دریافت نشد."
      ));
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  async function submit(payload: OfferWritePayload, image: LocalOfferImage | null) {
    if (!token) throw new Error("نشست شما منقضی شده است. دوباره وارد شوید.");
    const offer = await createOffer(token, payload);
    if (image) {
      try {
        await uploadOfferImage(token, offer.id, image);
      } catch {
        Alert.alert(
          "پیشنهاد ذخیره شد",
          "خود پیشنهاد ساخته شد اما تصویر آپلود نشد. از صفحه ویرایش دوباره تلاش کنید."
        );
      }
    }
    router.replace(`/business/offer/${offer.id}`);
  }

  if (loadError) {
    return (
      <ErrorScreen
        message={loadError}
        onRetry={loadOptions}
        onBack={() => router.back()}
      />
    );
  }
  if (!options) {
    return <LoadingScreen label="در حال آماده‌سازی فرم پیشنهاد..." />;
  }

  return (
    <OfferForm
      options={options}
      submitLabel="ساخت پیشنهاد فعال"
      onCancel={() => router.back()}
      onSubmit={submit}
    />
  );
}
