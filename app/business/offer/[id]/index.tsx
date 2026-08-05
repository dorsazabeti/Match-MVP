import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  formatMoney,
  OfferStatusBadge,
  REWARD_LABELS,
} from "../../../../src/features/offers/components";
import { resolveApiAssetUrl } from "../../../../src/services/api";
import {
  getOffer,
  getOfferOptions,
  setOfferStatus,
} from "../../../../src/services/offers";
import { listPromotions } from "../../../../src/services/promotions";
import { useAuthStore } from "../../../../src/store/auth";
import { theme } from "../../../../src/theme";
import type { Offer, OfferOptions } from "../../../../src/types/offers";
import type { Promotion } from "../../../../src/types/promotions";


export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [options, setOptions] = useState<OfferOptions | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const [offerResponse, optionResponse, promotionResponse] = await Promise.all([
        getOffer(token, id),
        getOfferOptions(),
        listPromotions(token, id),
      ]);
      setOffer(offerResponse);
      setOptions(optionResponse);
      setPromotions(promotionResponse.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "پیشنهاد پیدا نشد.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  function confirmStatus(action: "pause" | "activate" | "expire") {
    const copy = {
      pause: ["توقف پیشنهاد", "تا زمان فعال‌سازی دوباره، امکان پروموت جدید ندارد."],
      activate: ["فعال‌سازی پیشنهاد", "پیشنهاد دوباره برای ساخت پروموشن آماده می‌شود."],
      expire: ["منقضی‌کردن پیشنهاد", "این کار نهایی است و پیشنهاد فقط خواندنی خواهد شد."],
    } as const;
    Alert.alert(copy[action][0], copy[action][1], [
      { text: "انصراف", style: "cancel" },
      {
        text: "تأیید",
        style: action === "expire" ? "destructive" : "default",
        onPress: async () => {
          if (!token || !id) return;
          try {
            setActionLoading(true);
            const updated = await setOfferStatus(token, id, action);
            setOffer(updated);
          } catch (statusError) {
            Alert.alert(
              "عملیات انجام نشد",
              statusError instanceof Error ? statusError.message : "دوباره تلاش کنید."
            );
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>در حال دریافت پیشنهاد...</Text>
      </View>
    );
  }
  if (error || !offer) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "پیشنهاد پیدا نشد."}</Text>
        <Pressable onPress={load} style={styles.retryButton}>
          <Text style={styles.retryText}>تلاش دوباره</Text>
        </Pressable>
      </View>
    );
  }

  const category = options?.categories.find((item) => item.id === offer.category_id);
  const hasInventory = offer.reward_type !== "CASH";
  const heroImage = offer.images[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
          <Text style={styles.navTitle}>جزئیات پیشنهاد</Text>
          <Pressable
            onPress={() => router.push(`/business/offer/${offer.id}/edit`)}
            disabled={offer.status === "EXPIRED"}
            style={styles.editButton}
          >
            <Text style={[
              styles.editText,
              offer.status === "EXPIRED" && styles.disabledText,
            ]}>ویرایش</Text>
          </Pressable>
        </View>

        {heroImage ? (
          <Image
            source={{ uri: resolveApiAssetUrl(heroImage.storage_path) }}
            style={styles.heroImage}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroMark}>MATCH</Text>
          </View>
        )}

        <View style={styles.titleCard}>
          <View style={styles.badgeRow}>
            <OfferStatusBadge status={offer.status} />
            <Text style={styles.rewardType}>{REWARD_LABELS[offer.reward_type]}</Text>
          </View>
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.category}>{category?.name ?? "دسته‌بندی پیشنهاد"}</Text>
          <Text style={styles.description}>{offer.description}</Text>
        </View>

        <Text style={styles.sectionTitle}>ارزش و موجودی</Text>
        <View style={styles.metricsGrid}>
          {hasInventory ? (
            <Metric
              label="ارزش واقعی"
              value={formatMoney(offer.retail_value, offer.currency)}
            />
          ) : null}
          {offer.cash_amount ? (
            <Metric
              label="پرداخت هر همکاری"
              value={formatMoney(offer.cash_amount, offer.currency)}
            />
          ) : null}
          {hasInventory ? (
            <>
              <Metric label="موجود" value={offer.available_quantity.toLocaleString("fa-IR")} />
              <Metric label="رزرو شده" value={offer.reserved_quantity.toLocaleString("fa-IR")} />
              <Metric label="سهم هر همکاری" value={offer.units_per_deal.toLocaleString("fa-IR")} />
            </>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>شرایط تحویل</Text>
          <Text style={styles.infoText}>
            {offer.fulfillment_notes || "شرایط خاصی ثبت نشده است."}
          </Text>
          <Text style={styles.deliveryBadge}>
            {offer.remotely_fulfillable ? "✓ قابل تحویل از راه دور" : "تحویل حضوری یا هماهنگ‌شده"}
          </Text>
          {offer.expires_at ? (
            <Text style={styles.expiryText}>
              انقضا: {new Date(offer.expires_at).toLocaleDateString("fa-IR")}
            </Text>
          ) : null}
        </View>

        {offer.status === "ACTIVE" ? (
          <Pressable
            onPress={() => router.push(`/business/offer/${offer.id}/promote`)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>پیدا کردن رسانه‌های مناسب</Text>
          </Pressable>
        ) : null}

        {promotions.length ? (
          <>
            <Text style={styles.sectionTitle}>پروموشن‌های این پیشنهاد</Text>
            <View style={styles.promotionList}>
              {promotions.map((promotion) => (
                <Pressable
                  key={promotion.id}
                  onPress={() => router.push(`/business/promotion/${promotion.id}/recommendations`)}
                  style={styles.promotionCard}
                >
                  <View style={styles.promotionCount}>
                    <Text style={styles.promotionCountValue}>{promotion.recommendation_count.toLocaleString("fa-IR")}</Text>
                    <Text style={styles.promotionCountLabel}>رسانه</Text>
                  </View>
                  <View style={styles.promotionCopy}>
                    <Text style={styles.promotionTitle}>نتایج {promotion.goal}</Text>
                    <Text style={styles.promotionMeta}>
                      {promotion.target_city || "همه شهرها"} · {new Date(promotion.created_at).toLocaleDateString("fa-IR")}
                    </Text>
                  </View>
                  <Text style={styles.promotionArrow}>‹</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.actionsRow}>
          {offer.status === "ACTIVE" ? (
            <SecondaryAction
              label="توقف موقت"
              onPress={() => confirmStatus("pause")}
              disabled={actionLoading}
            />
          ) : null}
          {offer.status === "PAUSED" ? (
            <SecondaryAction
              label="فعال‌سازی"
              onPress={() => confirmStatus("activate")}
              disabled={actionLoading}
            />
          ) : null}
          {offer.status !== "EXPIRED" ? (
            <SecondaryAction
              label="منقضی‌کردن"
              danger
              onPress={() => confirmStatus("expire")}
              disabled={actionLoading}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}


function SecondaryAction({
  label,
  onPress,
  danger = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.secondaryButton, danger && styles.dangerButton, disabled && styles.disabled]}
    >
      <Text style={[styles.secondaryButtonText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    width: "100%",
    maxWidth: theme.layout.screenMaxWidth,
    alignSelf: "center",
    padding: theme.spacing.m,
    paddingBottom: 64,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.m,
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  loadingText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  errorText: { ...theme.typography.caption, color: theme.colors.error, textAlign: "center" },
  retryButton: { minHeight: 48, justifyContent: "center", paddingHorizontal: theme.spacing.l },
  retryText: { color: theme.colors.primary, fontWeight: "900" },
  navRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.m,
  },
  navButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  navButtonText: { color: theme.colors.text, fontSize: 30, lineHeight: 32 },
  navTitle: { ...theme.typography.h3, color: theme.colors.text },
  editButton: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  editText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: "900" },
  disabledText: { color: theme.colors.textMuted },
  heroImage: { width: "100%", height: 250, borderRadius: 26, backgroundColor: theme.colors.surfaceMuted },
  heroPlaceholder: {
    width: "100%",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
  },
  heroMark: { color: theme.colors.primaryMuted, fontSize: 22, fontWeight: "900", letterSpacing: 6 },
  titleCard: {
    padding: theme.spacing.l,
    marginTop: -18,
    marginHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  badgeRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  rewardType: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: "900" },
  title: { ...theme.typography.h1, color: theme.colors.text, textAlign: "right", marginTop: theme.spacing.m },
  category: { ...theme.typography.micro, color: theme.colors.primary, textAlign: "right", fontWeight: "800" },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: "right", marginTop: theme.spacing.m },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text, textAlign: "right", marginTop: theme.spacing.xl, marginBottom: theme.spacing.m },
  metricsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: theme.spacing.s },
  metric: {
    minWidth: "47%",
    flexGrow: 1,
    alignItems: "flex-end",
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  metricValue: { ...theme.typography.h3, color: theme.colors.text, textAlign: "right" },
  metricLabel: { ...theme.typography.micro, color: theme.colors.textSecondary, marginTop: 2 },
  infoCard: {
    alignItems: "flex-end",
    padding: theme.spacing.l,
    marginTop: theme.spacing.m,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.primarySoft,
  },
  infoTitle: { ...theme.typography.h3, color: theme.colors.primaryDark },
  infoText: { ...theme.typography.caption, color: theme.colors.text, textAlign: "right", marginTop: theme.spacing.s },
  deliveryBadge: { ...theme.typography.micro, color: theme.colors.success, fontWeight: "800", marginTop: theme.spacing.m },
  expiryText: { ...theme.typography.micro, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  primaryButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.l,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: { ...theme.typography.body, color: theme.colors.surface, fontWeight: "900" },
  promotionList: { gap: theme.spacing.s },
  promotionCard: {
    minHeight: 76,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  promotionCount: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
  },
  promotionCountValue: { ...theme.typography.h3, color: theme.colors.primaryDark },
  promotionCountLabel: { fontSize: 9, color: theme.colors.primary },
  promotionCopy: { flex: 1 },
  promotionTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900", textAlign: "right" },
  promotionMeta: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right" },
  promotionArrow: { fontSize: 28, color: theme.colors.textMuted },
  actionsRow: { flexDirection: "row-reverse", gap: theme.spacing.s, marginTop: theme.spacing.sm },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
  },
  secondaryButtonText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: "900" },
  dangerButton: { borderColor: "#F0C9D2" },
  dangerText: { color: theme.colors.error },
  disabled: { opacity: 0.5 },
});
