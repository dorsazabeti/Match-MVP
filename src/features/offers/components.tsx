import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { resolveApiAssetUrl } from "../../services/api";
import { theme } from "../../theme";
import type { Offer, OfferStatus, RewardType } from "../../types/offers";


export const REWARD_LABELS: Record<RewardType, string> = {
  PRODUCT: "محصول",
  SERVICE: "خدمت",
  CASH: "نقدی",
  HYBRID: "ترکیبی",
};

export const STATUS_META: Record<
  OfferStatus,
  { label: string; background: string; color: string }
> = {
  ACTIVE: {
    label: "فعال",
    background: theme.colors.successSoft,
    color: theme.colors.success,
  },
  PAUSED: {
    label: "متوقف",
    background: theme.colors.warningSoft,
    color: theme.colors.warning,
  },
  EXPIRED: {
    label: "منقضی",
    background: theme.colors.surfaceMuted,
    color: theme.colors.textSecondary,
  },
};


export function formatMoney(value: string | null, currency: string) {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  const unit = currency === "IRR" ? "ریال" : currency;
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ${unit}`;
}


export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const meta = STATUS_META[status];
  return (
    <View style={[styles.badge, { backgroundColor: meta.background }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}


export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}


export function OfferCard({
  offer,
  onPress,
}: {
  offer: Offer;
  onPress: () => void;
}) {
  const image = offer.images[0];
  const inventoryReward = offer.reward_type !== "CASH";
  const value = offer.reward_type === "CASH"
    ? offer.cash_amount
    : offer.retail_value;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.offerCard, pressed && styles.pressed]}
    >
      {image ? (
        <Image
          source={{ uri: resolveApiAssetUrl(image.storage_path) }}
          style={styles.offerImage}
        />
      ) : (
        <View style={styles.offerImagePlaceholder}>
          <Text style={styles.offerImageMark}>M</Text>
        </View>
      )}

      <View style={styles.offerContent}>
        <View style={styles.offerTopRow}>
          <OfferStatusBadge status={offer.status} />
          <Text style={styles.rewardLabel}>
            {REWARD_LABELS[offer.reward_type]}
          </Text>
        </View>
        <Text style={styles.offerTitle} numberOfLines={2}>{offer.title}</Text>
        <Text style={styles.offerValue} numberOfLines={1}>
          {formatMoney(value, offer.currency)}
        </Text>
        <View style={styles.offerFooter}>
          <Text style={styles.offerMeta}>
            {inventoryReward
              ? `${offer.available_quantity.toLocaleString("fa-IR")} موجود`
              : "بدون محدودیت موجودی"}
          </Text>
          <Text style={styles.arrow}>‹</Text>
        </View>
      </View>
    </Pressable>
  );
}


export function EmptyOffers({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>
      <Text style={styles.emptyTitle}>اولین پیشنهادت را بساز</Text>
      <Text style={styles.emptyText}>
        محصول، خدمت یا بودجه‌ات را به یک پیشنهاد شفاف برای همکاری تبدیل کن.
      </Text>
      <Pressable onPress={onCreate} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>ساخت پیشنهاد</Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { ...theme.typography.micro, fontWeight: "800" },
  header: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  eyebrow: {
    ...theme.typography.micro,
    color: theme.colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: { ...theme.typography.h1, color: theme.colors.text, textAlign: "right" },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  offerCard: {
    flexDirection: "row-reverse",
    overflow: "hidden",
    minHeight: 168,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  offerImage: { width: 116, height: "100%", backgroundColor: theme.colors.surfaceMuted },
  offerImagePlaceholder: {
    width: 116,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
  },
  offerImageMark: { color: theme.colors.primary, fontSize: 32, fontWeight: "900" },
  offerContent: { flex: 1, padding: theme.spacing.m },
  offerTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardLabel: { ...theme.typography.micro, color: theme.colors.textSecondary },
  offerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "right",
    marginTop: theme.spacing.sm,
  },
  offerValue: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "800",
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  offerFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  offerMeta: { ...theme.typography.micro, color: theme.colors.textSecondary },
  arrow: { color: theme.colors.primary, fontSize: 26, lineHeight: 26 },
  emptyCard: {
    alignItems: "center",
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.primaryMuted,
    borderRadius: theme.layout.cardRadius,
    backgroundColor: theme.colors.surface,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: theme.colors.primarySoft,
  },
  emptyIconText: { color: theme.colors.primary, fontSize: 34, fontWeight: "500" },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.m,
  },
  emptyText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.s,
  },
  emptyButton: {
    minHeight: theme.layout.minTouchTarget,
    justifyContent: "center",
    marginTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.primary,
  },
  emptyButtonText: { color: theme.colors.surface, fontWeight: "800" },
});
