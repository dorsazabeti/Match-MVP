import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ErrorScreen, LoadingScreen } from "../../../../src/components/onboarding";
import { OfferForm } from "../../../../src/features/offers/OfferForm";
import {
  deleteOfferImage,
  getOffer,
  getOfferOptions,
  updateOffer,
  uploadOfferImage,
} from "../../../../src/services/offers";
import { useAuthStore } from "../../../../src/store/auth";
import type {
  LocalOfferImage,
  Offer,
  OfferOptions,
  OfferWritePayload,
} from "../../../../src/types/offers";


export default function EditOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [options, setOptions] = useState<OfferOptions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token || !id) return;
    setError(null);
    Promise.all([getOffer(token, id), getOfferOptions()])
      .then(([offerResponse, optionResponse]) => {
        setOffer(offerResponse);
        setOptions(optionResponse);
      })
      .catch((loadError) => setError(
        loadError instanceof Error ? loadError.message : "پیشنهاد بارگذاری نشد."
      ));
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(payload: OfferWritePayload, image: LocalOfferImage | null) {
    if (!token || !id || !offer) throw new Error("پیشنهاد در دسترس نیست.");
    await updateOffer(token, id, payload);
    if (image) {
      try {
        await uploadOfferImage(token, id, image);
        if (offer.images[0]) {
          await deleteOfferImage(token, id, offer.images[0].id);
        }
      } catch {
        Alert.alert(
          "تغییرات ذخیره شد",
          "اطلاعات پیشنهاد ذخیره شد اما جایگزینی تصویر کامل نشد."
        );
      }
    }
    router.replace(`/business/offer/${id}`);
  }

  if (error) {
    return (
      <ErrorScreen
        message={error}
        onRetry={load}
        onBack={() => router.back()}
      />
    );
  }
  if (!offer || !options) {
    return <LoadingScreen label="در حال بارگذاری پیشنهاد..." />;
  }

  return (
    <OfferForm
      options={options}
      initialOffer={offer}
      submitLabel="ذخیره تغییرات"
      onCancel={() => router.back()}
      onSubmit={submit}
    />
  );
}
