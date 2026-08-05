import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatMoney } from "../../../../src/features/offers/components";
import {
  getPromotion,
  listRecommendations,
} from "../../../../src/services/promotions";
import { useAuthStore } from "../../../../src/store/auth";
import { theme } from "../../../../src/theme";
import type { Promotion, Recommendation } from "../../../../src/types/promotions";


const FACTOR_LABELS = {
  interest: "علاقه مرتبط",
  value_fit: "تناسب ارزش",
  location: "موقعیت",
  platform: "پلتفرم",
  capability: "توان محتوا",
} as const;

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "اینستاگرام",
  TELEGRAM: "تلگرام",
  YOUTUBE: "یوتیوب",
  RUBIKA: "روبیکا",
  BALE: "بله",
  EITAA: "ایتا",
  OTHER: "سایر",
};


export default function RecommendationResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const [promotionResponse, resultResponse] = await Promise.all([
        getPromotion(token, id),
        listRecommendations(token, id),
      ]);
      setPromotion(promotionResponse);
      setItems(resultResponse.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "نتایج دریافت نشد.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  if (loading) {
    return <State loading text="در حال رتبه‌بندی رسانه‌ها..." />;
  }
  if (error || !promotion) {
    return <State text={error ?? "پروموشن پیدا نشد."} onRetry={load} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.replace(`/business/offer/${promotion.offer_id}`)}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>×</Text>
          </Pressable>
          <Text style={styles.navTitle}>پیشنهاد رسانه‌ها</Text>
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.livePill}><Text style={styles.liveText}>READY · آماده</Text></View>
            <Text style={styles.eyebrow}>MATCH RESULTS</Text>
          </View>
          <Text style={styles.heroNumber}>{items.length.toLocaleString("fa-IR")}</Text>
          <Text style={styles.heroTitle}>رسانه‌ی واجد شرایط</Text>
          <Text style={styles.heroSubtitle}>
            ترتیب براساس تناسب علاقه، ارزش، شهر، پلتفرم و توان تولید محتواست.
          </Text>
          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaText}>
              {promotion.target_city || "همه شهرها"} · {promotion.preferred_platforms.length || "همه"} پلتفرم · {promotion.desired_deals.toLocaleString("fa-IR")} همکاری
            </Text>
          </View>
        </View>

        <View style={styles.transparencyCard}>
          <Text style={styles.transparencyIcon}>◎</Text>
          <View style={styles.transparencyCopy}>
            <Text style={styles.transparencyTitle}>رتبه‌بندی شفاف، نه جعبه‌ی سیاه</Text>
            <Text style={styles.transparencyText}>امتیاز فعلی کاملاً قاعده‌محور و قابل بازبینی است. بسته‌ی هوشمند همکاری در Day 6 اضافه می‌شود.</Text>
          </View>
        </View>

        {items.length ? items.map((item, index) => (
          <RecommendationCard key={item.id} item={item} rank={index + 1} />
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyMark}>⌁</Text>
            <Text style={styles.emptyTitle}>فعلاً تطبیق واجد شرایطی پیدا نشد</Text>
            <Text style={styles.emptyText}>شهر یا پلتفرم را بازتر انتخاب کن، یا ارزش پیشنهاد را با تعرفه‌ی رسانه‌ها هماهنگ‌تر کن.</Text>
            <Pressable onPress={() => router.replace(`/business/offer/${promotion.offer_id}/promote`)} style={styles.retryWide}>
              <Text style={styles.retryWideText}>ساخت پروموشن تازه</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


function RecommendationCard({ item, rank }: { item: Recommendation; rank: number }) {
  const score = Math.round(Number(item.score));
  const initials = item.publisher_public_name.trim().slice(0, 2);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreNumber}>{score.toLocaleString("fa-IR")}</Text>
          <Text style={styles.scoreLabel}>امتیاز</Text>
        </View>
        <View style={styles.publisherCopy}>
          <View style={styles.rankRow}>
            <Text style={styles.publisherName}>{item.publisher_public_name}</Text>
            <View style={styles.rankPill}><Text style={styles.rankText}>#{rank.toLocaleString("fa-IR")}</Text></View>
          </View>
          <Text style={styles.publisherMeta}>{item.publisher_city} · {PLATFORM_LABELS[item.best_media_plan.platform]}</Text>
          <Text numberOfLines={2} style={styles.publisherBio}>{item.publisher_bio}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      </View>

      <View style={styles.planRow}>
        <View>
          <Text style={styles.planValue}>{formatMoney(item.best_media_plan.price, item.best_media_plan.currency)}</Text>
          <Text style={styles.planLabel}>تعرفه‌ی بهترین پلن</Text>
        </View>
        <View>
          <Text style={styles.planValue}>{item.platforms[0]?.followers_count.toLocaleString("fa-IR") ?? "—"}</Text>
          <Text style={styles.planLabel}>دنبال‌کننده</Text>
        </View>
        <View>
          <Text style={styles.planValue}>{item.best_media_plan.typical_views?.toLocaleString("fa-IR") ?? "—"}</Text>
          <Text style={styles.planLabel}>بازدید معمول</Text>
        </View>
      </View>

      <Text style={styles.whyTitle}>چرا این رسانه؟</Text>
      <Text style={styles.explanation}>{item.explanation}</Text>
      <View style={styles.factorList}>
        {(Object.keys(FACTOR_LABELS) as Array<keyof typeof FACTOR_LABELS>).map((key) => {
          const factor = item.factors[key];
          const width = `${Math.round((factor.score / factor.maximum) * 100)}%` as `${number}%`;
          return (
            <View key={key} style={styles.factorRow}>
              <Text style={styles.factorScore}>{factor.score.toLocaleString("fa-IR")}/{factor.maximum.toLocaleString("fa-IR")}</Text>
              <View style={styles.factorTrack}><View style={[styles.factorFill, { width }]} /></View>
              <Text style={styles.factorLabel}>{FACTOR_LABELS[key]}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.nextStep}>
        <Text style={styles.nextStepText}>بسته همکاری و دعوت در گام‌های بعدی فعال می‌شود</Text>
      </View>
    </View>
  );
}


function State({ loading, text, onRetry }: { loading?: boolean; text: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : null}
      <Text style={styles.stateText}>{text}</Text>
      {onRetry ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>تلاش دوباره</Text></Pressable> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: "100%", maxWidth: theme.layout.screenMaxWidth, alignSelf: "center", padding: theme.spacing.m, paddingBottom: 72 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.m, padding: theme.spacing.l, backgroundColor: theme.colors.background },
  stateText: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: "center" },
  retry: { minHeight: 48, justifyContent: "center", paddingHorizontal: theme.spacing.l },
  retryText: { color: theme.colors.primary, fontWeight: "900" },
  navRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.m },
  navButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: theme.colors.surface },
  navButtonText: { fontSize: 28, color: theme.colors.text },
  navTitle: { ...theme.typography.h3, color: theme.colors.text },
  navSpacer: { width: 48 },
  hero: { borderRadius: 28, padding: theme.spacing.l, backgroundColor: theme.colors.primaryDark, marginBottom: theme.spacing.m },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  livePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.12)" },
  liveText: { ...theme.typography.micro, color: "#CFF8E8", fontWeight: "800" },
  eyebrow: { ...theme.typography.micro, color: theme.colors.primaryMuted, fontWeight: "900", letterSpacing: 1.5 },
  heroNumber: { fontSize: 58, lineHeight: 68, fontWeight: "900", color: "#fff", textAlign: "right", marginTop: 16 },
  heroTitle: { ...theme.typography.h2, color: "#fff", textAlign: "right" },
  heroSubtitle: { ...theme.typography.caption, color: "#E7DFFF", textAlign: "right", marginTop: 6 },
  criteriaRow: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.16)" },
  criteriaText: { ...theme.typography.micro, color: "#fff", textAlign: "right" },
  transparencyCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: theme.spacing.m, backgroundColor: theme.colors.primarySoft, marginBottom: theme.spacing.m },
  transparencyIcon: { fontSize: 28, color: theme.colors.primary },
  transparencyCopy: { flex: 1 },
  transparencyTitle: { ...theme.typography.caption, color: theme.colors.primaryDark, fontWeight: "900", textAlign: "right" },
  transparencyText: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right" },
  card: { borderRadius: 24, padding: theme.spacing.m, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m, ...theme.shadow.card },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
  avatarText: { ...theme.typography.h3, color: theme.colors.primaryDark },
  publisherCopy: { flex: 1 },
  rankRow: { flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  rankPill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: theme.colors.accentSoft },
  rankText: { ...theme.typography.micro, color: theme.colors.accent, fontWeight: "900" },
  publisherName: { ...theme.typography.h3, color: theme.colors.text, textAlign: "right" },
  publisherMeta: { ...theme.typography.micro, color: theme.colors.primary, fontWeight: "800", textAlign: "right" },
  publisherBio: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right", marginTop: 3 },
  scoreRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 4, borderColor: theme.colors.success, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.successSoft },
  scoreNumber: { fontSize: 17, fontWeight: "900", color: theme.colors.success },
  scoreLabel: { fontSize: 8, color: theme.colors.success },
  planRow: { flexDirection: "row-reverse", justifyContent: "space-between", borderRadius: 16, padding: 12, backgroundColor: theme.colors.surfaceMuted, marginTop: theme.spacing.m },
  planValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900", textAlign: "right" },
  planLabel: { fontSize: 10, color: theme.colors.textMuted, textAlign: "right" },
  whyTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900", textAlign: "right", marginTop: theme.spacing.m },
  explanation: { ...theme.typography.micro, color: theme.colors.textSecondary, textAlign: "right", marginTop: 3 },
  factorList: { gap: 8, marginTop: theme.spacing.m },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  factorScore: { width: 42, fontSize: 10, color: theme.colors.textSecondary },
  factorTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: theme.colors.surfaceMuted, overflow: "hidden" },
  factorFill: { height: "100%", borderRadius: 4, backgroundColor: theme.colors.primary },
  factorLabel: { width: 72, fontSize: 10, color: theme.colors.textSecondary, textAlign: "right" },
  nextStep: { marginTop: theme.spacing.m, minHeight: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background },
  nextStepText: { ...theme.typography.micro, color: theme.colors.textMuted, textAlign: "center" },
  emptyCard: { borderRadius: 24, padding: theme.spacing.l, alignItems: "center", backgroundColor: theme.colors.surface },
  emptyMark: { fontSize: 42, color: theme.colors.primaryMuted },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, textAlign: "center", marginTop: 8 },
  emptyText: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: "center", marginTop: 6 },
  retryWide: { minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "stretch", backgroundColor: theme.colors.primary, marginTop: theme.spacing.l },
  retryWideText: { color: "#fff", fontWeight: "900" },
});
