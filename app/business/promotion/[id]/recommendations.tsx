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
import { PackageBreakdown } from "../../../../src/features/promotions/PackageBreakdown";
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
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [minimumScore, setMinimumScore] = useState<0 | 80>(0);

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

  const availablePlatforms = Array.from(
    new Set(items.map((item) => item.best_media_plan.platform))
  );
  const filteredItems = items.filter((item) =>
    (platformFilter === "ALL" || item.best_media_plan.platform === platformFilter)
    && Number(item.score) >= minimumScore
  );

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
          <Text style={styles.heroNumber}>{filteredItems.length.toLocaleString("fa-IR")}</Text>
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
            <Text style={styles.transparencyText}>Eligibility و امتیاز با کد قطعی کنترل می‌شوند؛ مدل فقط از میان بسته‌های ازقبل معتبر انتخاب می‌کند و fallback همیشه فعال است.</Text>
          </View>
        </View>

        {items.length ? (
          <View style={styles.filtersCard}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterReset} onPress={() => { setPlatformFilter("ALL"); setMinimumScore(0); }}>پاک‌کردن</Text>
              <Text style={styles.filterTitle}>فیلتر نتایج</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {["ALL", ...availablePlatforms].map((platform) => (
                <Pressable key={platform} onPress={() => setPlatformFilter(platform)} style={[styles.filterChip, platformFilter === platform && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, platformFilter === platform && styles.filterChipTextActive]}>{platform === "ALL" ? "همه پلتفرم‌ها" : PLATFORM_LABELS[platform]}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setMinimumScore(minimumScore === 80 ? 0 : 80)} style={[styles.filterChip, minimumScore === 80 && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, minimumScore === 80 && styles.filterChipTextActive]}>امتیاز ۸۰+</Text>
              </Pressable>
            </ScrollView>
          </View>
        ) : null}

        {filteredItems.length ? filteredItems.map((item, index) => (
          <RecommendationCard key={item.id} item={item} rank={index + 1} />
        )) : items.length ? (
          <View style={styles.filterEmpty}>
            <Text style={styles.emptyTitle}>نتیجه‌ای با این فیلتر نیست</Text>
            <Pressable onPress={() => { setPlatformFilter("ALL"); setMinimumScore(0); }} style={styles.filterEmptyButton}><Text style={styles.filterEmptyButtonText}>نمایش همه</Text></Pressable>
          </View>
        ) : (
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
      {item.package ? <PackageBreakdown packageData={item.package} compact /> : null}
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
      <Pressable
        onPress={() => router.push(`/business/recommendation/${item.id}`)}
        style={styles.detailButton}
      >
        <Text style={styles.detailArrow}>←</Text>
        <Text style={styles.detailButtonText}>مشاهده جزئیات رسانه و بسته</Text>
      </Pressable>
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
  filtersCard: { borderRadius: 18, padding: theme.spacing.sm, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m },
  filterHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  filterTitle: { ...theme.typography.caption, color: theme.colors.text, fontWeight: "900" },
  filterReset: { ...theme.typography.micro, color: theme.colors.primary, fontWeight: "800", paddingVertical: 8 },
  filterRow: { flexDirection: "row-reverse", gap: 7 },
  filterChip: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  filterChipText: { ...theme.typography.micro, color: theme.colors.textSecondary, fontWeight: "700" },
  filterChipTextActive: { color: theme.colors.primaryDark },
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
  detailButton: { marginTop: theme.spacing.m, minHeight: 48, borderRadius: 14, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary },
  detailButtonText: { ...theme.typography.caption, color: "#fff", fontWeight: "900" },
  detailArrow: { color: "#fff", fontSize: 18 },
  filterEmpty: { borderRadius: 20, padding: theme.spacing.l, alignItems: "center", backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m },
  filterEmptyButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: theme.spacing.l, marginTop: 8 },
  filterEmptyButtonText: { color: theme.colors.primary, fontWeight: "900" },
  emptyCard: { borderRadius: 24, padding: theme.spacing.l, alignItems: "center", backgroundColor: theme.colors.surface },
  emptyMark: { fontSize: 42, color: theme.colors.primaryMuted },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, textAlign: "center", marginTop: 8 },
  emptyText: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: "center", marginTop: 6 },
  retryWide: { minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "stretch", backgroundColor: theme.colors.primary, marginTop: theme.spacing.l },
  retryWideText: { color: "#fff", fontWeight: "900" },
});
