import { StyleSheet, Text, View } from "react-native";

import { formatMoney } from "../offers/components";
import { theme } from "../../theme";
import type { ExchangePackage } from "../../types/promotions";


const CONTENT_LABELS: Record<string, string> = {
  POST: "پست",
  STORY: "استوری",
  REEL: "ریلز",
  VIDEO: "ویدئو",
  SHORT_VIDEO: "ویدئوی کوتاه",
  LIVE: "لایو",
  UGC: "محتوای UGC",
};

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "اینستاگرام",
  TELEGRAM: "تلگرام",
  YOUTUBE: "یوتیوب",
  RUBIKA: "روبیکا",
  BALE: "بله",
  EITAA: "ایتا",
  OTHER: "سایر",
};


export function PackageBreakdown({
  packageData,
  compact = false,
}: {
  packageData: ExchangePackage;
  compact?: boolean;
}) {
  const methodLabel = packageData.selection.method === "LLM"
    ? "انتخاب هوشمند"
    : "انتخاب امن Match";
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <View style={[
          styles.methodBadge,
          packageData.selection.method === "LLM" && styles.aiBadge,
        ]}>
          <Text style={[
            styles.methodText,
            packageData.selection.method === "LLM" && styles.aiText,
          ]}>{methodLabel}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>بسته‌ی پیشنهادی همکاری</Text>
          <Text style={styles.platform}>{PLATFORM_LABELS[packageData.platform]}</Text>
        </View>
      </View>

      <View style={styles.deliverables}>
        {packageData.deliverables.map((item) => (
          <View key={item.media_plan_id} style={styles.deliverableRow}>
            <Text style={styles.deliverableValue}>
              {formatMoney(item.subtotal, packageData.currency)}
            </Text>
            <View style={styles.deliverableCopy}>
              <Text style={styles.deliverableTitle}>
                {item.quantity.toLocaleString("fa-IR")} × {CONTENT_LABELS[item.content_type] ?? item.content_type}
              </Text>
              {!compact ? (
                <Text style={styles.deliverableMeta}>
                  هر مورد {formatMoney(item.unit_price, packageData.currency)}
                </Text>
              ) : null}
            </View>
            <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <View>
          <Text style={styles.ratioValue}>× {Number(packageData.value_ratio).toLocaleString("fa-IR", { maximumFractionDigits: 2 })}</Text>
          <Text style={styles.totalLabel}>نسبت ارزش</Text>
        </View>
        <View style={styles.totalCopy}>
          <Text style={styles.totalValue}>{formatMoney(packageData.total_media_value, packageData.currency)}</Text>
          <Text style={styles.totalLabel}>ارزش کل رسانه</Text>
        </View>
      </View>

      {!compact ? (
        <>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardValue}>{formatMoney(packageData.reward.total_reward_value, packageData.currency)}</Text>
            <Text style={styles.rewardLabel}>ارزش پاداش برند</Text>
          </View>
          <Text style={styles.reason}>{packageData.selection.reason}</Text>
          {packageData.fair_value_band.widened ? (
            <Text style={styles.warning}>این بسته با بازه‌ی ارزش گسترده‌تر ساخته شده و confidence محدود شده است.</Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { borderRadius: 20, padding: theme.spacing.m, backgroundColor: theme.colors.primarySoft, marginTop: theme.spacing.m },
  compactContainer: { borderRadius: 16, padding: theme.spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  title: { ...theme.typography.caption, color: theme.colors.primaryDark, fontWeight: "900", textAlign: "right" },
  platform: { ...theme.typography.micro, color: theme.colors.primary, textAlign: "right" },
  methodBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: theme.colors.surface },
  aiBadge: { backgroundColor: theme.colors.successSoft },
  methodText: { fontSize: 9, color: theme.colors.textSecondary, fontWeight: "800" },
  aiText: { color: theme.colors.success },
  deliverables: { marginTop: 10, gap: 7 },
  deliverableRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.72)" },
  deliverableValue: { ...theme.typography.micro, color: theme.colors.textSecondary },
  deliverableCopy: { flex: 1, alignItems: "flex-end" },
  deliverableTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900", textAlign: "right" },
  deliverableMeta: { fontSize: 9, color: theme.colors.textMuted, textAlign: "right" },
  check: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary },
  checkText: { color: "#fff", fontWeight: "900" },
  totalRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.primaryMuted },
  totalCopy: { alignItems: "flex-end" },
  totalValue: { ...theme.typography.h3, color: theme.colors.primaryDark },
  ratioValue: { ...theme.typography.h3, color: theme.colors.success },
  totalLabel: { fontSize: 9, color: theme.colors.textSecondary },
  rewardRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  rewardValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900" },
  rewardLabel: { ...theme.typography.micro, color: theme.colors.textSecondary },
  reason: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right", marginTop: 12 },
  warning: { ...theme.typography.micro, color: theme.colors.warning, textAlign: "right", marginTop: 8 },
});
