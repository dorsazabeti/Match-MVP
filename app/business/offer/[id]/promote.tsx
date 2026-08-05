import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PromotionForm } from "../../../../src/features/promotions/PromotionForm";
import { getOffer } from "../../../../src/services/offers";
import {
  createPromotion,
  getPromotionOptions,
} from "../../../../src/services/promotions";
import { useAuthStore } from "../../../../src/store/auth";
import { theme } from "../../../../src/theme";
import type { Offer } from "../../../../src/types/offers";
import type { PromotionOptions, PromotionWritePayload } from "../../../../src/types/promotions";


export default function PromoteOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [options, setOptions] = useState<PromotionOptions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    Promise.all([getOffer(token, id), getPromotionOptions()])
      .then(([offerResponse, optionResponse]) => {
        if (offerResponse.status !== "ACTIVE") {
          throw new Error("فقط پیشنهاد فعال را می‌توان پروموت کرد.");
        }
        setOffer(offerResponse);
        setOptions(optionResponse);
      })
      .catch((loadError) => setError(
        loadError instanceof Error ? loadError.message : "دریافت اطلاعات انجام نشد."
      ));
  }, [id, token]);

  async function submit(payload: PromotionWritePayload) {
    if (!token || !id) return;
    const promotion = await createPromotion(token, id, payload);
    router.replace(`/business/promotion/${promotion.id}/recommendations`);
  }

  if (error) {
    return <StateMessage text={error} />;
  }
  if (!offer || !options) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.stateText}>در حال آماده‌سازی پروموشن...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <PromotionForm
        offer={offer}
        options={options}
        onCancel={() => router.back()}
        onSubmit={submit}
      />
    </SafeAreaView>
  );
}


function StateMessage({ text }: { text: string }) {
  return <View style={styles.center}><Text style={styles.errorText}>{text}</Text></View>;
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.m, padding: theme.spacing.l, backgroundColor: theme.colors.background },
  stateText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  errorText: { ...theme.typography.body, color: theme.colors.error, textAlign: "center" },
});
